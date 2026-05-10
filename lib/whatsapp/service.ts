import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { Redis } from "@upstash/redis";
import axios from 'axios';

const logger = pino({ level: 'silent' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export class WhatsAppService {
  private static instances: Map<string, any> = new Map();
  private static reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Conecta um bot via QR Code com persistência de sessão no Redis
   */
  static async connect(botId: string, onQR: (qr: string) => void, onConnected: () => void) {
    // Verificar se já existe uma instância ativa
    if (this.instances.has(botId)) {
      console.log(`Bot ${botId} já está conectado`);
      return this.instances.get(botId);
    }

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
      shouldIgnoreJid: (jid) => jid.endsWith('@broadcast'),
    });

    this.instances.set(botId, sock);

    // Salvar credenciais quando atualizadas
    sock.ev.on('creds.update', async () => {
      await saveCreds();
      // Também persistir no Redis como backup
      await redis.set(`creds:${botId}`, JSON.stringify(state.creds), { ex: 2592000 }); // 30 dias
    });

    // Processar mensagens recebidas
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

    // Gerenciar conexão
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        await redis.set(`qr:${botId}`, qr, { ex: 90 });
        onQR(qr);
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect) {
          console.log(`Reconectando bot ${botId}...`);
          this.instances.delete(botId);
          
          // Aguardar 5 segundos antes de reconectar
          const timer = setTimeout(() => {
            this.connect(botId, onQR, onConnected);
          }, 5000);
          
          this.reconnectTimers.set(botId, timer);
        } else {
          console.log(`Bot ${botId} desconectado pelo usuário`);
          this.instances.delete(botId);
          await redis.del(`qr:${botId}`);
          await redis.set(`status:${botId}`, 'offline');
        }
      } else if (connection === 'open') {
        console.log(`Bot ${botId} conectado com sucesso`);
        await redis.del(`qr:${botId}`);
        await redis.set(`status:${botId}`, 'online');
        await redis.set(`connected_at:${botId}`, new Date().toISOString());
        
        // Limpar timer de reconexão se existir
        const timer = this.reconnectTimers.get(botId);
        if (timer) {
          clearTimeout(timer);
          this.reconnectTimers.delete(botId);
        }
        
        onConnected();
      }
    });

    return sock;
  }

  /**
   * Desconectar um bot
   */
  static async disconnect(botId: string) {
    const sock = this.instances.get(botId);
    if (sock) {
      await sock.logout();
      this.instances.delete(botId);
    }
    
    // Limpar timer de reconexão se existir
    const timer = this.reconnectTimers.get(botId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(botId);
    }

    await redis.del(`qr:${botId}`);
    await redis.set(`status:${botId}`, 'offline');
  }

  /**
   * Obter instância do socket
   */
  static getInstance(botId: string) {
    return this.instances.get(botId);
  }

  /**
   * Enviar mensagem de texto
   */
  static async sendMessage(botId: string, remoteJid: string, text: string) {
    const sock = this.getInstance(botId);
    if (!sock) throw new Error('Bot não conectado');
    
    try {
      const result = await sock.sendMessage(remoteJid, { text });
      
      // Registrar no Redis
      await redis.lpush(`messages:${botId}`, JSON.stringify({
        to: remoteJid,
        text,
        type: 'text',
        sentAt: new Date().toISOString(),
        messageId: result.key.id,
      }));
      
      return result;
    } catch (error) {
      console.error(`Erro ao enviar mensagem para ${remoteJid}:`, error);
      throw error;
    }
  }

  /**
   * Enviar mensagem com mídia
   */
  static async sendMessageWithMedia(
    botId: string,
    remoteJid: string,
    caption: string,
    mediaUrl: string,
    mediaType: 'image' | 'document' | 'audio' | 'video'
  ) {
    const sock = this.getInstance(botId);
    if (!sock) throw new Error('Bot não conectado');

    try {
      // Download da mídia
      const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      const messageContent: any = { caption };

      switch (mediaType) {
        case 'image':
          messageContent.image = buffer;
          break;
        case 'document':
          messageContent.document = buffer;
          messageContent.mimetype = 'application/pdf';
          messageContent.fileName = `documento_${Date.now()}.pdf`;
          break;
        case 'audio':
          messageContent.audio = buffer;
          messageContent.mimetype = 'audio/mpeg';
          messageContent.ptt = true; // Enviar como áudio de voz
          break;
        case 'video':
          messageContent.video = buffer;
          messageContent.mimetype = 'video/mp4';
          break;
      }

      const result = await sock.sendMessage(remoteJid, messageContent);

      // Registrar no Redis
      await redis.lpush(`messages:${botId}`, JSON.stringify({
        to: remoteJid,
        caption,
        type: mediaType,
        mediaUrl,
        sentAt: new Date().toISOString(),
        messageId: result.key.id,
      }));

      return result;
    } catch (error) {
      console.error(`Erro ao enviar mídia para ${remoteJid}:`, error);
      throw error;
    }
  }

  /**
   * Obter todos os grupos do bot
   */
  static async getGroups(botId: string, query: string = '') {
    const sock = this.getInstance(botId);
    if (!sock) throw new Error('Bot não conectado');

    try {
      const groupsObj = await sock.groupFetchAllParticipating();
      const groups = Object.values(groupsObj) as any[];

      const filtered = query
        ? groups.filter((g: any) =>
            g.subject?.toLowerCase().includes(query.toLowerCase()) ||
            g.desc?.toLowerCase().includes(query.toLowerCase())
          )
        : groups;

      const result = filtered.map((g: any) => ({
        id: g.id,
        name: g.subject || 'Sem nome',
        description: g.desc || '',
        participantCount: g.participants?.length || 0,
        createdAt: g.creation ? new Date(g.creation * 1000).toISOString() : null,
        owner: g.owner || '',
      }));

      // Persistir no Redis
      await redis.set(`groups:${botId}`, JSON.stringify(result), { ex: 3600 }); // 1 hora

      return result;
    } catch (error) {
      console.error(`Erro ao buscar grupos para ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Obter membros de um grupo
   */
  static async getGroupMembers(botId: string, groupId: string) {
    const sock = this.getInstance(botId);
    if (!sock) throw new Error('Bot não conectado');

    try {
      const metadata = await sock.groupMetadata(groupId);
      
      const members = metadata.participants.map((p: any) => ({
        id: p.id,
        phone: p.id.replace('@s.whatsapp.net', '').replace('@g.us', ''),
        isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
        role: p.admin || 'member',
      }));

      // Persistir no Redis
      await redis.set(`group_members:${botId}:${groupId}`, JSON.stringify(members), { ex: 3600 }); // 1 hora

      return members;
    } catch (error) {
      console.error(`Erro ao buscar membros do grupo ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Extrair links de grupos
   */
  static async extractGroupLinks(botId: string, groupId: string) {
    const sock = this.getInstance(botId);
    if (!sock) throw new Error('Bot não conectado');

    try {
      const inviteCode = await sock.groupInviteCode(groupId);
      const link = `https://chat.whatsapp.com/${inviteCode}`;

      return {
        groupId,
        link,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Erro ao extrair link do grupo ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Gerenciar automações baseadas em mensagens recebidas
   */
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

  /**
   * Obter status real do bot
   */
  static async getStatus(botId: string): Promise<'online' | 'offline' | 'connecting'> {
    const sock = this.getInstance(botId);
    if (sock) {
      return 'online';
    }
    
    const status = await redis.get<string>(`status:${botId}`);
    return (status as any) || 'offline';
  }

  /**
   * Listar todos os bots conectados
   */
  static getConnectedBots(): string[] {
    return Array.from(this.instances.keys());
  }
}
