import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
  AuthenticationState
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
      const sock = this.instances.get(botId);
      // Se já tiver QR no Redis, notificar
      const existingQr = await redis.get<string>(`qr:${botId}`);
      if (existingQr) onQR(existingQr);
      return sock;
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

    // Tentar recuperar credenciais do Redis antes de iniciar
    const savedCreds = await redis.get(`creds:${botId}`);
    if (savedCreds && !fs.existsSync(path.join(authPath, 'creds.json'))) {
      try {
        if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true });
        fs.writeFileSync(path.join(authPath, 'creds.json'), JSON.stringify(savedCreds));
        console.log(`Credenciais recuperadas do Redis para o bot ${botId}`);
      } catch (e) {
        console.error('Erro ao restaurar credenciais do Redis:', e);
      }
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
      connectTimeoutMs: 60000, // Aumentar timeout para 60s
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
    });

    this.instances.set(botId, sock);

    // Salvar credenciais quando atualizadas
    sock.ev.on('creds.update', async () => {
      await saveCreds();
      // Também persistir no Redis como backup
      await redis.set(`creds:${botId}`, state.creds, { ex: 2592000 }); // 30 dias
    });

    // Gerenciar conexão
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`Novo QR Code gerado para o bot ${botId}`);
        await redis.set(`qr:${botId}`, qr, { ex: 60 }); // Expira em 60s
        await redis.set(`status:${botId}`, 'connecting');
        onQR(qr);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.log(`Conexão fechada para o bot ${botId}. Motivo: ${statusCode}. Reconectar: ${shouldReconnect}`);

        if (shouldReconnect) {
          this.instances.delete(botId);
          // Aguardar 3 segundos antes de reconectar
          const timer = setTimeout(() => {
            this.connect(botId, onQR, onConnected);
          }, 3000);
          this.reconnectTimers.set(botId, timer);
        } else {
          this.instances.delete(botId);
          await redis.del(`qr:${botId}`);
          await redis.set(`status:${botId}`, 'offline');
          await redis.del(`creds:${botId}`); // Limpar credenciais se deslogado
        }
      } else if (connection === 'open') {
        console.log(`Bot ${botId} conectado com sucesso`);
        await redis.del(`qr:${botId}`);
        await redis.set(`status:${botId}`, 'online');
        await redis.set(`connected_at:${botId}`, new Date().toISOString());
        
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
      try {
        await sock.logout();
      } catch (e) {
        console.error('Erro ao deslogar socket:', e);
      }
      this.instances.delete(botId);
    }
    
    const timer = this.reconnectTimers.get(botId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(botId);
    }

    await redis.del(`qr:${botId}`);
    await redis.del(`creds:${botId}`);
    await redis.set(`status:${botId}`, 'offline');
  }

  static getInstance(botId: string) {
    return this.instances.get(botId);
  }

  static async sendMessage(botId: string, remoteJid: string, text: string) {
    const sock = this.getInstance(botId);
    if (!sock) throw new Error('Bot não conectado');
    
    const result = await sock.sendMessage(remoteJid, { text });
    await redis.lpush(`messages:${botId}`, JSON.stringify({
      to: remoteJid,
      text,
      type: 'text',
      sentAt: new Date().toISOString(),
      messageId: result.key.id,
    }));
    return result;
  }

  static async getStatus(botId: string): Promise<'online' | 'offline' | 'connecting'> {
    const sock = this.getInstance(botId);
    if (sock) return 'online';
    
    const status = await redis.get<string>(`status:${botId}`);
    return (status as any) || 'offline';
  }

  static getConnectedBots(): string[] {
    return Array.from(this.instances.keys());
  }
}
