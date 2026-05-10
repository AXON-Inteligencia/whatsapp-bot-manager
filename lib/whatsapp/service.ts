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

const logger = pino({ level: 'debug' });

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
        console.log(`[WhatsAppService] Iniciando conexão para o bot ${botId}`);

      // 1. Limpar qualquer estado anterior se estiver tentando conectar novamente
      if (this.instances.has(botId)) {
              console.log(`[WhatsAppService] Encerrando instância anterior do bot ${botId}`);
              const oldSock = this.instances.get(botId);
              try { 
                oldSock.ev.removeAllListeners('connection.update');
                        oldSock.end(); 
              } catch (e) {}
              this.instances.delete(botId);
      }

      const sessionsDir = '/tmp/sessions';
        const authPath = path.join(sessionsDir, botId);

      // 2. Limpar diretório local de sessão para forçar novo QR se não houver credenciais no Redis
      const savedCreds = await redis.get(`creds:${botId}`);
        if (!savedCreds) {
                console.log(`[WhatsAppService] Nenhuma credencial no Redis para o bot ${botId}. Limpando sessão local.`);
                if (fs.existsSync(auth
