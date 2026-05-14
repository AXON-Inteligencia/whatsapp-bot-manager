import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  AuthenticationState,
  AuthenticationCreds,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
  proto
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

/**
 * Implementação personalizada para salvar o estado da autenticação no Redis.
 * Isso é necessário porque a Vercel (Serverless) não persiste arquivos locais.
 */
async function useRedisAuthState(botId: string) {
  const key = `session:${botId}`;
  
  // Tentar carregar as credenciais do Redis
  let creds: AuthenticationCreds;
  const savedCreds = await redis.get(`${key}:creds`);
  
  if (savedCreds) {
    console.log(`[WhatsAppService] Carregando credenciais do Redis para o bot ${botId}`);
    creds = typeof savedCreds === 'string' ? JSON.parse(savedCreds, BufferJSON.reviver) : savedCreds;
  } else {
    console.log(`[WhatsAppService] Criando novas credenciais para o bot ${botId}`);
    creds = initAuthCreds();
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
          const data: { [id: string]: any } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await redis.get(`${key}:${type}:${id}`);
              if (value) {
                if (typeof value === 'string') {
                  value = JSON.parse(value, BufferJSON.reviver);
                }
                data[id] = value;
              }
            })
          );
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<any>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const sKey = `${key}:${category}:${id}`;
              if (value) {
                tasks.push(redis.set(sKey, JSON.stringify(value, BufferJSON.replacer), { ex: 60 * 60 * 24 * 30 }));
              } else {
                tasks.push(redis.del(sKey));
              }
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      await redis.set(`${key}:creds`, JSON.stringify(creds, BufferJSON.replacer), { ex: 60 * 60 * 24 * 30 });
    },
  };
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

    // Usar o Redis para persistência em vez do sistema de arquivos local
    const { state, saveCreds } = await useRedisAuthState(botId);
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
      // Adicionar configurações de retry para melhor estabilidade em serverless
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
    });

    this.instances.set(botId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`[WhatsAppService] Novo QR Code gerado para o bot ${botId}`);
        await redis.set(`qr:${botId}`, qr, { ex: 90 }); // Expira em 90 segundos
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.log(`[WhatsAppService] Conexão fechada para o bot ${botId}. Código: ${statusCode}. Reconectando: ${shouldReconnect}`);
        
        await redis.del(`qr:${botId}`);
        this.instances.delete(botId);

        if (shouldReconnect) {
          // Pequeno atraso antes de reconectar para evitar loop infinito em caso de erro crítico
          setTimeout(() => this.connect(botId), 3000);
        } else {
          console.log(`[WhatsAppService] Bot ${botId} desconectado permanentemente (Logged Out). Limpando dados do Redis.`);
          // Limpar todas as chaves da sessão no Redis
          const keys = await redis.keys(`session:${botId}:*`);
          if (keys.length > 0) {
            await Promise.all(keys.map(k => redis.del(k)));
          }
          await redis.del(`status:${botId}`);
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
      try {
        await sock.logout();
      } catch (e) {
        console.error(`[WhatsAppService] Erro durante logout do socket:`, e);
      }
      this.instances.delete(botId);
    }
    
    // Limpar dados do Redis
    const keys = await redis.keys(`session:${botId}:*`);
    if (keys.length > 0) {
      await Promise.all(keys.map(k => redis.del(k)));
    }
    await redis.del(`status:${botId}`);
    await redis.del(`qr:${botId}`);
  }
}
