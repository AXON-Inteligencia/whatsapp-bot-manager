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
    // Na Vercel, apenas a pasta /tmp é gravável
    const baseDir = process.env.VERCEL ? '/tmp' : process.cwd();
    const sessionsDir = path.join(baseDir, 'sessions');
    const authPath = path.join(sessionsDir, botId);
    
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
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
              console.log(`Mensagem recebida de ${from}: ${text}`);
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
        console.log('Conexão fechada devido a erro, reconectando:', shouldReconnect);
        if (shouldReconnect) {
          this.connect(botId, onQR, onConnected);
        } else {
          this.instances.delete(botId);
          await redis.del(`qr:${botId}`);
          await redis.set(`status:${botId}`, 'offline');
        }
      } else if (connection === 'open') {
        console.log('Conexão aberta com sucesso!');
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
