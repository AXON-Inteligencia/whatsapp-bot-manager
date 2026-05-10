import makeWASocket, { 
  fetchLatestBaileysVersion,
  initAuthCreds
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { redis } from '../redis';

const logger = pino({ level: 'silent' });

export class WhatsAppService {
  private static instances: Map<string, any> = new Map();

  static async connect(botId: string) {
    console.log(`[FAST] Conectando bot: ${botId}`);
    
    // Limpeza rápida
    if (this.instances.has(botId)) {
      try { this.instances.get(botId).end(); } catch (e) {}
      this.instances.delete(botId);
    }

    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: {
        creds: initAuthCreds(),
        keys: {
          get: async () => ({}),
          set: async () => {}
        }
      },
      logger,
      browser: ['AxonFlow', 'Chrome', '1.0.0'],
    });

    this.instances.set(botId, sock);

    // Captura o primeiro QR Code e já salva no Redis
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 15000);

      sock.ev.on('connection.update', async (update) => {
        const { qr, connection } = update;
        if (qr) {
          console.log(`[FAST] QR Gerado para ${botId}`);
          await redis.set(`qr:${botId}`, qr, { ex: 60 });
          clearTimeout(timeout);
          resolve(qr);
        }
        if (connection === 'open') {
          await redis.set(`status:${botId}`, 'connected');
          await redis.del(`qr:${botId}`);
        }
      });
    });
  }

  static async getStatus(botId: string) {
    return (await redis.get(`status:${botId}`)) || 'disconnected';
  }

  static async getQRCode(botId: string) {
    return await redis.get(`qr:${botId}`);
  }

  static async logout(botId: string) {
    await redis.del(`status:${botId}`);
    await redis.del(`qr:${botId}`);
  }
}
