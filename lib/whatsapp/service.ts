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
    // 1. Limpar qualquer estado anterior se estiver tentando conectar novamente
    if (this.instances.has(botId)) {
      const oldSock = this.instances.get(botId);
      try { oldSock.end(); } catch (e) {}
      this.instances.delete(botId);
    }

    const sessionsDir = '/tmp/sessions';
    const authPath = path.join(sessionsDir, botId);
    
    // 2. Limpar diretório local de sessão para forçar novo QR se não houver credenciais no Redis
    const savedCreds = await redis.get(`creds:${botId}`);
    if (!savedCreds) {
      console.log(`Nenhuma credencial no Redis para o bot ${botId}. Limpando sessão local.`);
      if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
      }
    }

    try {
      if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
      }
    } catch (err) {
      console.error('Erro ao criar diretório de sessões:', err);
    }

    // 3. Restaurar credenciais do Redis se existirem
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
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
    });

    this.instances.set(botId, sock);

    // Salvar credenciais quando atualizadas
    sock.ev.on('creds.update', async () => {
      await saveCreds();
      await redis.set(`creds:${botId}`, state.creds, { ex: 2592000 }); // 30 dias
    });

    // Gerenciar conexão
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`Novo QR Code gerado para o bot ${botId}`);
        await redis.set(`qr:${botId}`, qr, { ex: 60 });
        await redis.set(`status:${botId}`, 'connecting');
        onQR(qr);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.log(`Conexão fechada para o bot ${botId}. Motivo: ${statusCode}. Reconectar: ${shouldReconnect}`);

        if (shouldReconnect) {
          this.instances.delete(botId);
          const timer = setTimeout(() => {
            this.connect(botId, onQR, onConnected);
          }, 3000);
          this.reconnectTimers.set(botId, timer);
        } else {
          this.instances.delete(botId);
          await redis.del(`qr:${botId}`);
          await redis.set(`status:${botId}`, 'offline');
          await redis.del(`creds:${botId}`);
          if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
          }
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

    const sessionsDir = '/tmp/sessions';
    const authPath = path.join(sessionsDir, botId);
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }

    await redis.del(`qr:${botId}`);
    await redis.del(`creds:${botId}`);
    await redis.set(`status:${botId}`, 'offline');
  }

  static getInstance(botId: string) {
    return this.instances.get(botId);
  }

  static async getStatus(botId: string): Promise<'online' | 'offline' | 'connecting'> {
    const status = await redis.get<string>(`status:${botId}`);
    return (status as any) || 'offline';
  }
}
