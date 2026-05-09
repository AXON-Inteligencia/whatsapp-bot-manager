import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { Redis } from "@upstash/redis";

const logger = pino({ level: 'silent' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export class WhatsAppService {
  private static instances: Map<string, any> = new Map();

  static async connect(botId: string, onQR: (qr: string) => void, onConnected: () => void) {
    const sessionsDir = '/tmp/sessions';
    const authPath = path.join(sessionsDir, botId);
    
    try {
      if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
      }
    } catch (err) {
      console.error('Erro ao criar diretório de sessões:', err);
    }

    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
    });

    this.instances.set(botId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
      if (m.type === 'notify') {
        for (const msg of m.messages) {
          if (!msg.key.fromMe && msg.message) {
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
            const from = msg.key.remoteJid;
            
            if (text && from) {
              await this.handleAutomation(botId, from, text);
            }
          }
        }
      }
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        await redis.set(`qr:${botId}`, qr, { ex: 60 });
        onQR(qr);
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          this.connect(botId, onQR, onConnected);
        } else {
          this.instances.delete(botId);
          await redis.del(`qr:${botId}`);
          await redis.set(`status:${botId}`, 'offline');
        }
      } else if (connection === 'open') {
        await redis.del(`qr:${botId}`);
        await redis.set(`status:${botId}`, 'online');
        onConnected();
      }
    });

    return sock;
  }

  static getInstance(botId: string) {
    return this.instances.get(botId);
  }

  static async sendMessage(botId: string, remoteJid: string, text: string) {
    const sock = this.getInstance(botId);
    if (!sock) throw new Error('Bot não conectado');
    
    await sock.sendMessage(remoteJid, { text });
  }

  /**
   * Retorna todos os grupos do WhatsApp em que o bot está participando,
   * filtrando pelo termo de busca se fornecido.
   */
  static async getGroups(botId: string, query: string = '') {
    const sock = this.getInstance(botId);
    if (!sock) throw new Error('Bot não conectado');

    // groupFetchAllParticipating retorna um objeto { [groupId]: GroupMetadata }
    const groupsObj = await sock.groupFetchAllParticipating();
    const groups = Object.values(groupsObj) as any[];

    const filtered = query
      ? groups.filter((g: any) =>
          g.subject?.toLowerCase().includes(query.toLowerCase()) ||
          g.desc?.toLowerCase().includes(query.toLowerCase())
        )
      : groups;

    return filtered.map((g: any) => ({
      id: g.id,
      name: g.subject || 'Sem nome',
      description: g.desc || '',
      participantCount: g.participants?.length || 0,
      createdAt: g.creation ? new Date(g.creation * 1000).toISOString() : null,
      owner: g.owner || '',
    }));
  }

  /**
   * Retorna todos os membros de um grupo específico.
   */
  static async getGroupMembers(botId: string, groupId: string) {
    const sock = this.getInstance(botId);
    if (!sock) throw new Error('Bot não conectado');

    const metadata = await sock.groupMetadata(groupId);
    
    return metadata.participants.map((p: any) => ({
      id: p.id,
      phone: p.id.replace('@s.whatsapp.net', '').replace('@g.us', ''),
      isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
      role: p.admin || 'member',
    }));
  }

  private static async handleAutomation(botId: string, from: string, text: string) {
    try {
      const automationsKey = `automations:${botId}`;
      const automations = await redis.get<any[]>(automationsKey) || [];
      
      for (const auto of automations) {
        if (!auto.isActive) continue;

        let shouldTrigger = false;
        
        if (auto.trigger === 'Novo contato') {
          shouldTrigger = true; 
        } else if (auto.trigger === 'Palavra-chave' && auto.keyword) {
          shouldTrigger = text.toLowerCase().includes(auto.keyword.toLowerCase());
        }

        if (shouldTrigger && auto.response) {
          await this.sendMessage(botId, from, auto.response);
          auto.executions = (auto.executions || 0) + 1;
          auto.lastExecution = new Date();
          await redis.set(automationsKey, automations);
          break;
        }
      }
    } catch (error) {
      console.error('Erro no motor de automação:', error);
    }
  }
}
