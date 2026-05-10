import makeWASocket, { 
  DisconnectReason, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  AuthenticationCreds,
  SignalDataSet,
  SignalDataTypeMap
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { redis } from '../redis';

const logger = pino({ level: 'warn' });

/**
 * WhatsAppService - Versão Otimizada para Vercel (Serverless)
 * Esta versão não utiliza o sistema de arquivos local, persistindo tudo no Redis.
 */
export class WhatsAppService {
  private static instances: Map<string, any> = new Map();

  static async connect(botId: string) {
    console.log(`[WhatsAppService] Iniciando conexão serverless para o bot: ${botId}`);
    
    // 1. Limpar instâncias fantasmas
    if (this.instances.has(botId)) {
      try { this.instances.get(botId).end(); } catch (e) {}
      this.instances.delete(botId);
    }

    // 2. Carregar credenciais do Redis
    const savedCredsJSON = await redis.get(`creds:${botId}`);
    let creds: AuthenticationCreds;
    
    if (savedCredsJSON) {
      console.log(`[WhatsAppService] Carregando credenciais existentes do Redis para ${botId}`);
      creds = typeof savedCredsJSON === 'string' ? JSON.parse(savedCredsJSON) : savedCredsJSON;
    } else {
      console.log(`[WhatsAppService] Nenhuma credencial encontrada. Iniciando nova sessão para ${botId}`);
      // @ts-ignore - Importação dinâmica para evitar erros de build se o tipo não bater perfeitamente
      const { initAuthCreds } = await import('@whiskeysockets/baileys');
      creds = initAuthCreds();
    }

    const { version } = await fetchLatestBaileysVersion();

    // 3. Configurar Socket sem persistência em disco
    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: {
        creds,
        // Mock de keys para evitar uso de useMultiFileAuthState que exige disco
        keys: {
          get: async (type, ids) => {
            const data: { [id: string]: any } = {};
            for (const id of ids) {
              const value = await redis.get(`keys:${botId}:${type}:${id}`);
              if (value) data[id] = typeof value === 'string' ? JSON.parse(value) : value;
            }
            return data;
          },
          set: async (data) => {
            for (const type in data) {
              for (const id in data[type as keyof SignalDataTypeMap]) {
                const value = data[type as keyof SignalDataTypeMap][id];
                if (value) {
                  await redis.set(`keys:${botId}:${type}:${id}`, JSON.stringify(value), { ex: 60 * 60 * 24 * 30 });
                } else {
                  await redis.del(`keys:${botId}:${type}:${id}`);
                }
              }
            }
          }
        }
      },
      logger,
      browser: ['AxonFlow', 'Chrome', '1.0.0'],
    });

    this.instances.set(botId, sock);

    // 4. Eventos de atualização
    sock.ev.on('creds.update', async (newCreds) => {
      console.log(`[WhatsAppService] Atualizando credenciais no Redis para ${botId}`);
      Object.assign(creds, newCreds);
      await redis.set(`creds:${botId}`, JSON.stringify(creds), { ex: 60 * 60 * 24 * 30 });
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`[WhatsAppService] QR Code gerado e salvo no Redis para ${botId}`);
        await redis.set(`qr:${botId}`, qr, { ex: 90 });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.log(`[WhatsAppService] Conexão fechada (${botId}). Status: ${statusCode}. Reconectar: ${shouldReconnect}`);
        
        await redis.del(`qr:${botId}`);
        this.instances.delete(botId);

        if (shouldReconnect && statusCode !== 401) { // Evitar loop infinito em erro de auth
          setTimeout(() => this.connect(botId), 5000);
        } else if (statusCode === DisconnectReason.loggedOut) {
          console.log(`[WhatsAppService] Logout detectado. Limpando Redis para ${botId}`);
          await this.clearBotData(botId);
        }
      } else if (connection === 'open') {
        console.log(`[WhatsAppService] Conexão ABERTA para ${botId}`);
        await redis.del(`qr:${botId}`);
        await redis.set(`status:${botId}`, 'connected', { ex: 60 * 60 * 24 });
      }
    });

    return sock;
  }

  private static async clearBotData(botId: string) {
    await redis.del(`creds:${botId}`);
    await redis.del(`status:${botId}`);
    await redis.del(`qr:${botId}`);
    // Nota: Limpar chaves individuais do Redis exigiria um SCAN, simplificado aqui
  }

  static async getStatus(botId: string) {
    return (await redis.get(`status:${botId}`)) || 'disconnected';
  }

  static async getQRCode(botId: string) {
    return await redis.get(`qr:${botId}`);
  }

  static async logout(botId: string) {
    const sock = this.instances.get(botId);
    if (sock) {
      try { await sock.logout(); } catch (e) {}
      this.instances.delete(botId);
    }
    await this.clearBotData(botId);
  }
}
