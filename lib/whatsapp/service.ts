import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  AuthenticationState
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import { redis } from '../redis';

const logger = pino({ level: 'info' });
const SESSIONS_DIR = '/tmp/sessions';

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

export class WhatsAppService {
  private static instances: Map<string, any> = new Map();

  static async connect(botId: string) {
    console.log(`[WhatsAppService] Iniciando conexão para o bot: ${botId}`);
    
    // Limpar instância anterior se existir
    if (this.instances.has(botId)) {
      console.log(`[WhatsAppService] Fechando instância anterior do bot ${botId}`);
      try {
        const oldSocket = this.instances.get(botId);
        oldSocket.ev.removeAllListeners('connection.update');
        oldSocket.end();
      } catch (e) {
        console.error(`[WhatsAppService] Erro ao fechar instância anterior:`, e);
      }
      this.instances.delete(botId);
    }

    const authPath = path.join(SESSIONS_DIR, botId);
    
    // Sincronizar credenciais do Redis para o sistema de arquivos local
    const savedCreds = await redis.get(`creds:${botId}`);
    if (!savedCreds) {
      console.log(`[WhatsAppService] Nenhuma credencial no Redis para o bot ${botId}. Limpando sessão local.`);
      if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
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
      browser: ['AxonFlow', 'Chrome', '1.0.0'],
    });

    this.instances.set(botId, sock);

    sock.ev.on('creds.update', async () => {
      await saveCreds();
      // Persistir credenciais no Redis para persistência serverless
      await redis.set(`creds:${botId}`, JSON.stringify(state.creds), { ex: 60 * 60 * 24 * 30 }); // 30 dias
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`[WhatsAppService] Novo QR Code gerado para o bot ${botId}`);
        await redis.set(`qr:${botId}`, qr, { ex: 90 }); // Expira em 90 segundos
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`[WhatsAppService] Conexão fechada para o bot ${botId}. Motivo:`, lastDisconnect?.error, 'Reconectando:', shouldReconnect);
        
        await redis.del(`qr:${botId}`);
        this.instances.delete(botId);

        if (shouldReconnect) {
          this.connect(botId);
        } else {
          console.log(`[WhatsAppService] Bot ${botId} desconectado permanentemente. Limpando dados.`);
          await redis.del(`creds:${botId}`);
          if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
          }
        }
      } else if (connection === 'open') {
        console.log(`[WhatsAppService] Conexão aberta com sucesso para o bot ${botId}`);
        await redis.del(`qr:${botId}`);
        await redis.set(`status:${botId}`, 'online');
      }
    });

    return sock;
  }

  static async getStatus(botId: string) {
    const status = await redis.get(`status:${botId}`);
    return status || 'disconnected';
  }

  static async getQRCode(botId: string) {
    return await redis.get(`qr:${botId}`);
  }

  static async logout(botId: string) {
    const sock = this.instances.get(botId);
    if (sock) {
      await sock.logout();
      this.instances.delete(botId);
    }
    await redis.del(`creds:${botId}`);
    await redis.del(`status:${botId}`);
    const authPath = path.join(SESSIONS_DIR, botId);
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }
  }
}
