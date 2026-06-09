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
  
  // Tentar carregar a sessão inteira do Redis
  let creds: AuthenticationCreds;
  let keysData: any = {};
  
  const savedCreds = await redis.get(`${key}:creds`);
  const savedKeys = await redis.get(`${key}:keys`);
  
  if (savedCreds) {
    console.log(`[WhatsAppService] Carregando credenciais do Redis para o bot ${botId}`);
    const credsStr = typeof savedCreds === 'string' ? savedCreds : JSON.stringify(savedCreds);
    creds = JSON.parse(credsStr, BufferJSON.reviver);
  } else {
    console.log(`[WhatsAppService] Criando novas credenciais para o bot ${botId}`);
    creds = initAuthCreds();
  }

  if (savedKeys) {
    const keysStr = typeof savedKeys === 'string' ? savedKeys : JSON.stringify(savedKeys);
    keysData = JSON.parse(keysStr, BufferJSON.reviver);
  }

  // Função helper para salvar as chaves com debounce/timeout para não inundar o Redis
  let saveTimeout: NodeJS.Timeout | null = null;
  const saveKeysToRedis = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        await redis.set(`${key}:keys`, JSON.stringify(keysData, BufferJSON.replacer), { ex: 60 * 60 * 24 * 30 });
      } catch (e) {
        console.error('Erro ao salvar keys no Redis:', e);
      }
    }, 2000); // Salva 2 segundos após a última modificação em batch
  };

  return {
    state: {
      creds,
      keys: {
        get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
          const data: { [id: string]: any } = {};
          if (!keysData[type]) return data;
          
          for (const id of ids) {
            let value = keysData[type][id];
            if (value) {
              data[id] = value;
            }
          }
          return data;
        },
        set: async (data: any) => {
          let hasChanges = false;
          for (const category in data) {
            if (!keysData[category]) keysData[category] = {};
            for (const id in data[category]) {
              const value = data[category][id];
              if (value) {
                keysData[category][id] = value;
              } else {
                delete keysData[category][id];
              }
              hasChanges = true;
            }
          }
          if (hasChanges) {
            saveKeysToRedis();
          }
        },
      },
    },
    saveCreds: () => {
      return redis.set(`${key}:creds`, JSON.stringify(creds, BufferJSON.replacer), { ex: 60 * 60 * 24 * 30 }).catch(err => {
        console.error('Erro ao salvar creds no Redis:', err);
      });
    }
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
      browser: ['AxonFlow SaaS', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      // Adicionar configurações de retry para melhor estabilidade em serverless
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
    });

    this.instances.set(botId, sock);

    sock.ev.on('creds.update', async () => {
      await saveCreds();
    });

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

  static async getSocket(botId: string) {
    let sock = this.instances.get(botId);
    if (!sock) {
      const status = await redis.get(`status:${botId}`);
      if (status === 'online') {
        console.log(`[WhatsAppService] Socket não encontrado na memória. Restaurando conexão do Redis para o bot ${botId}`);
        sock = await this.connect(botId);
        // Aguarda 3 segundos para dar tempo do socket conectar ao WhatsApp
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    return sock;
  }

  static async sendMessage(botId: string, to: string, text: string) {
    const sock = await this.getSocket(botId);
    if (!sock) {
      throw new Error('Bot não está conectado ou a sessão expirou. Reconecte-o no painel.');
    }
    return await sock.sendMessage(to, { text });
  }

  static async sendMessageWithMedia(botId: string, to: string, text: string, mediaUrl: string, mediaType: string) {
    const sock = await this.getSocket(botId);
    if (!sock) {
      throw new Error('Bot não está conectado ou a sessão expirou. Reconecte-o no painel.');
    }
    const message: any = { caption: text };
    if (mediaType === 'image') message.image = { url: mediaUrl };
    else if (mediaType === 'video') message.video = { url: mediaUrl };
    else if (mediaType === 'document') {
      message.document = { url: mediaUrl };
      message.mimetype = 'application/octet-stream';
      message.fileName = 'arquivo';
    } else if (mediaType === 'audio') message.audio = { url: mediaUrl };
    
    return await sock.sendMessage(to, message);
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
