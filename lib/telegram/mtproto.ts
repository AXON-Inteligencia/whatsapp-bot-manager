import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { redis } from '../redis';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Credenciais Globais (Precisam ser geradas no my.telegram.org)
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0');
const API_HASH = process.env.TELEGRAM_API_HASH || '';

export class TelegramUserbotService {
  private clients: Map<string, TelegramClient> = new Map();

  constructor() {
    if (!API_ID || !API_HASH) {
      logger.warn('[Telegram] TELEGRAM_API_ID e TELEGRAM_API_HASH não configurados. Userbot desativado.');
    }
  }

  /**
   * Inicia o processo de login enviando o código para o número de telefone
   */
  async sendLoginCode(botId: string, phoneNumber: string) {
    if (!API_ID || !API_HASH) throw new Error('API Credentials missing');
    
    // Iniciar sessão vazia
    const stringSession = new StringSession('');
    const client = new TelegramClient(stringSession, API_ID, API_HASH, {
      connectionRetries: 5,
    });

    await client.connect();

    const { phoneCodeHash } = await client.sendCode(
      {
        apiId: API_ID,
        apiHash: API_HASH,
      },
      phoneNumber
    );

    // Salva temporariamente o client e o hash para a verificação do código
    this.clients.set(`auth:${botId}`, client);
    await redis.set(`tg_auth:${botId}`, JSON.stringify({ phoneNumber, phoneCodeHash }), 'EX', 300);

    return { success: true, message: 'Código enviado para o Telegram' };
  }

  /**
   * Verifica o código e finaliza o login, retornando a StringSession
   */
  async verifyLoginCode(botId: string, code: string, password?: string) {
    const authDataStr = await redis.get(`tg_auth:${botId}`);
    if (!authDataStr) throw new Error('Sessão de autenticação expirada');
    
    const { phoneNumber, phoneCodeHash } = JSON.parse(authDataStr as string);
    const client = this.clients.get(`auth:${botId}`);
    if (!client) throw new Error('Cliente Telegram não encontrado na memória');

    try {
      await client.invoke(new (require('telegram/tl').Api).auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode: code,
      }));
    } catch (err: any) {
      if (err.message.includes('SESSION_PASSWORD_NEEDED') && password) {
        // Autenticação de Dois Fatores
        await client.invoke(new (require('telegram/tl').Api).auth.CheckPassword({
          password: require('telegram/crypto/SRP').computeCheck(
            await client.invoke(new (require('telegram/tl').Api).account.GetPassword()),
            password
          )
        }));
      } else {
        throw err;
      }
    }

    const sessionString = (client.session as StringSession).save();
    
    // Move o client para a lista ativa
    this.clients.delete(`auth:${botId}`);
    this.clients.set(botId, client);
    
    return { success: true, sessionString };
  }

  /**
   * Conecta um Userbot já autenticado usando a StringSession salva
   */
  async connect(botId: string, sessionString: string) {
    if (!API_ID || !API_HASH) return;

    logger.info(`[Telegram] Conectando Userbot: ${botId}`);
    const session = new StringSession(sessionString);
    const client = new TelegramClient(session, API_ID, API_HASH, {
      connectionRetries: 5,
    });

    await client.connect();
    logger.info(`[Telegram] Userbot ${botId} conectado com sucesso!`);
    
    this.clients.set(botId, client);

    // TODO: Adicionar listener para eventos (Novo membro, etc)
    
    return client;
  }
}

export const telegramService = new TelegramUserbotService();
