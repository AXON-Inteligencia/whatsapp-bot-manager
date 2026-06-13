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
import Groq from 'groq-sdk';
import { logConversationStart, updateConversationMessage, initAnalyticsTable, updateConversationRoute } from '../analytics';
import { downloadAudio, transcribeAudio } from './audio';

const logger = pino({ level: 'info' });
const SESSIONS_DIR = '/tmp/sessions';

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Fase 0.1 - Memória de Conversa
const conversationHistory = new Map<string, any[]>();
function appendToHistory(phoneNumber: string, role: 'user' | 'assistant', content: string) {
  if (!conversationHistory.has(phoneNumber)) {
    conversationHistory.set(phoneNumber, []);
  }
  const history = conversationHistory.get(phoneNumber)!;
  history.push({ role, content });
  if (history.length > 10) {
    history.shift(); // Remove o mais antigo
  }
}
function clearExpiredSessions() {
  // Opcional: Limpar histórico completo periodicamente
}

// Fase 0.2 - Rate Limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(phoneNumber: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(phoneNumber);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(phoneNumber, { count: 1, resetAt: now + 60000 });
    return false;
  }
  
  if (limit.count >= 10) {
    return true;
  }
  
  limit.count++;
  return false;
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
  
  const savedCreds = await redis.get(`${key}:creds`).catch(() => null);
  const savedKeys = await redis.get(`${key}:keys`).catch(() => null);
  
  try {
    if (savedCreds) {
      console.log(`[WhatsAppService] Carregando credenciais do Redis para o bot ${botId}`);
      const credsStr = typeof savedCreds === 'string' ? savedCreds : JSON.stringify(savedCreds);
      creds = JSON.parse(credsStr, BufferJSON.reviver);
    } else {
      console.log(`[WhatsAppService] Criando novas credenciais para o bot ${botId}`);
      creds = initAuthCreds();
    }
  } catch (e) {
    console.error(`[WhatsAppService] Erro ao carregar credenciais do Redis, criando novas:`, e);
    creds = initAuthCreds();
  }

  try {
    if (savedKeys) {
      const keysStr = typeof savedKeys === 'string' ? savedKeys : JSON.stringify(savedKeys);
      keysData = JSON.parse(keysStr, BufferJSON.reviver);
    }
  } catch (e) {
    console.error(`[WhatsAppService] Erro ao carregar chaves do Redis, ignorando:`, e);
    keysData = {};
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
    
    // Inicializa a tabela de analytics se não existir
    await initAnalyticsTable();
    
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
    let version: [number, number, number] = [2, 3000, 1015901307];
    try {
      const res = await fetchLatestBaileysVersion();
      version = res.version;
    } catch (e) {
      console.error('[WhatsAppService] Erro ao buscar versão do Baileys, usando fallback:', e);
    }

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

    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];
      if (!msg.message || m.type !== 'notify') return;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.includes('@g.us') || remoteJid.includes('status')) return; // Ignora grupos e status

      const isFromMe = msg.key.fromMe;
      let textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
      
      // FEATURE 2: OUVIDO BIÔNICO (TRANSCRIÇÃO DE ÁUDIO)
      if (msg.message.audioMessage || msg.message.ptvMessage) {
        let bot: any = null;
        try {
          const { createClient } = require('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
          );
          const { data } = await supabase.from('bots').select('aiSettings').eq('id', botId).single();
          bot = data;
        } catch (e) {
          console.error('[WhatsAppService] Erro ao buscar configurações do bot para transcrição', e);
        }
        
        if (bot && bot.aiSettings?.enabled && bot.aiSettings?.apiKey) {
          const start = Date.now();
          try {
            const buffer = await downloadAudio(msg);
            const transcription = await transcribeAudio(buffer, bot.aiSettings.apiKey.trim());
            
            if (!transcription) {
              await sock.sendMessage(remoteJid, { text: 'Não consegui entender o áudio 🎤 Pode digitar sua mensagem?' });
              return;
            }
            
            textMessage = `[Áudio transcrito]: ${transcription}`;
            console.log(`[Áudio] Transcrito em ${Date.now() - start}ms: "${transcription.substring(0, 80)}..."`);
          } catch (e) {
            console.error('[Áudio] Erro ao processar:', e);
            await sock.sendMessage(remoteJid, { text: 'Estou com dificuldade para ouvir áudios agora 🎤 Pode digitar?' });
            return;
          }
        }
      }

      if (!textMessage) return;

      const timestamp = new Date().toISOString();
      const contactPhone = remoteJid.replace('@s.whatsapp.net', '');
      
      // SALVAR NO BANCO DE DADOS (REDIS)
      try {
        const convId = `${botId}:${contactPhone}`;
        const newMessage = {
          id: msg.key.id || Math.random().toString(36).substr(2, 9),
          content: textMessage,
          sender: isFromMe ? 'bot' : 'contact',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          timestamp
        };
        
        const convKey = `axon:conversations:${convId}`;
        let conv: any = await redis.get(convKey);
        
        if (!conv) {
          conv = {
            id: convId,
            botId,
            botName: `Bot ${botId.substring(0, 4)}`,
            contactPhone,
            contactName: msg.pushName || contactPhone,
            messages: [],
            unreadCount: 0,
            lastMessage: textMessage,
            timestamp
          };
        }
        
        conv.messages.push(newMessage);
        conv.lastMessage = textMessage;
        conv.timestamp = timestamp;
        if (!isFromMe) {
          conv.unreadCount += 1;
        }

        if (conv.messages.length > 50) {
          conv.messages = conv.messages.slice(-50);
        }

        await redis.set(convKey, conv);
      } catch (err) {
        console.error(`[WhatsAppService] Erro ao salvar mensagem no histórico:`, err);
      }

      // SE FOR MENSAGEM MINHA, NÃO CHAMA A IA
      if (isFromMe) return;

      // LÓGICA DA IA (GROQ CLOUD)
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        );

        const { data: bot } = await supabase
          .from('bots')
          .select('aiSettings')
          .eq('id', botId)
          .single();

        if (!bot || !bot.aiSettings?.enabled || !bot.aiSettings?.apiKey) return;

        // Rate Limiting (Fase 0.2)
        if (isRateLimited(contactPhone)) {
          await sock.sendMessage(remoteJid, { text: "Muitas mensagens em pouco tempo. Aguarde um momento. 🙏" });
          return;
        }

        console.log(`[WhatsAppService] Mensagem recebida no bot ${botId} de ${remoteJid}: ${textMessage}`);
        
        await sock.sendPresenceUpdate('composing', remoteJid);
        const apiKey = bot.aiSettings.apiKey.trim();
        const groq = new Groq({ apiKey });

        // Analytics & Memória (Fase 0.1 e 0.4)
        const isNewSession = !conversationHistory.has(contactPhone);
        if (isNewSession) {
          await logConversationStart(contactPhone, 'whatsapp');
        } else {
          await updateConversationMessage(contactPhone);
        }

        const history = conversationHistory.get(contactPhone) || [];

        // Roteador de Intenção (Fase 1.1)
        let intent: 'sales' | 'support' = 'sales'; // Default
        try {
          const recentHistory = history.slice(-4).map(h => `${h.role}: ${h.content}`).join('\\n');
          const ROUTER_PROMPT = `
Você é um classificador de intenção de mensagens para um chatbot comercial.
Analise a mensagem do cliente e o histórico recente e responda APENAS com uma palavra: "vendas" ou "suporte".

Regras de classificação:
- "vendas": cliente quer comprar, saber preço, conhecer o produto, fazer upgrade, tem dúvida antes de comprar
- "suporte": cliente já é usuário e tem dúvida técnica, problema para usar, reclamação, solicitação de cancelamento

Mensagem atual: "${textMessage}"
Histórico recente:
${recentHistory}

Responda apenas: vendas ou suporte`;

          const routerCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: ROUTER_PROMPT }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            max_completion_tokens: 10,
          });
          
          const routerOutput = (routerCompletion.choices[0]?.message?.content || "").toLowerCase().trim();
          if (routerOutput.includes('suporte')) {
            intent = 'support';
          }
          await updateConversationRoute(contactPhone, intent);

          // CRM Kanban (Feature 3): Atualiza estágio do funil se for novo lead
          try {
            const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
            const getStage = await fetch(`${baseUrl}/api/contacts/${contactPhone}/stage`);
            const stageData = await getStage.json();
            
            if (stageData.stage === 'new_lead') {
              const newStage = intent === 'sales' ? 'negotiating' : 'support';
              await fetch(`${baseUrl}/api/contacts/${contactPhone}/stage`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: newStage })
              });
              console.log(`[CRM] Movido automaticamente ${contactPhone} para ${newStage}`);
            }
          } catch (crmErr) {
            console.error('[CRM] Erro ao mover card no Kanban:', crmErr);
          }

        } catch (routerErr) {
          console.error('[Roteador] Erro na classificação, caindo para vendas por padrão', routerErr);
        }

        // Seleciona o Prompt correto (Fase 1.2)
        const botSalesPrompt = bot.aiSettings.salesPrompt || bot.aiSettings.systemPrompt || "Você é um vendedor focado.";
        const botSupportPrompt = bot.aiSettings.supportPrompt || "Você é um suporte técnico prestativo.";
        
        let systemPromptText = intent === 'sales' ? botSalesPrompt : botSupportPrompt;

        // Base de Conhecimento (RAG)
        let knowledgeContext = "";
        try {
          const knowledgeDataStr = await redis.get(`bot:${botId}:knowledge`);
          if (knowledgeDataStr) {
            const knowledgeData = typeof knowledgeDataStr === 'string' ? JSON.parse(knowledgeDataStr) : knowledgeDataStr;
            if (knowledgeData.chunks && knowledgeData.chunks.length > 0) {
              const docName = knowledgeData.metadata?.filename || "documento";
              knowledgeContext = `\n<knowledge>\n[CONTEÚDO DO DOCUMENTO: ${docName}]\n${knowledgeData.chunks.join('\\n\\n---\\n\\n')}\n[FIM DO DOCUMENTO]\n</knowledge>\n\nQuando a pergunta do usuário puder ser respondida com base no documento acima, priorize essas informações.`;
            }
          }
        } catch (knowledgeErr) {
          console.error('[Base de Conhecimento] Erro ao buscar documento do bot', knowledgeErr);
        }

        const systemPrompt = `COMPORTAMENTO (Modo: ${intent === 'sales' ? 'VENDAS' : 'SUPORTE'}):
${systemPromptText}${knowledgeContext}

INSTRUÇÕES IMPORTANTES:
- NUNCA invente informações.
- Responda SEMPRE em português do Brasil, seja natural, humano e focado.`;

        appendToHistory(contactPhone, 'user', textMessage);

        // AbortController para Fallback de Timeout (Fase 0.3)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let responseText = "Desculpe, não consegui processar sua mensagem.";
        try {
          const chatCompletion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory.get(contactPhone)!
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_completion_tokens: 1024,
            top_p: 1,
          }, { signal: controller.signal as any });
          
          clearTimeout(timeoutId);
          responseText = chatCompletion.choices[0]?.message?.content || responseText;
          appendToHistory(contactPhone, 'assistant', responseText);
        } catch (apiErr: any) {
          clearTimeout(timeoutId);
          console.error(`[WhatsAppService] Erro na API Groq ou Timeout:`, apiErr);
          responseText = "Estou com uma instabilidade agora. Tente novamente em instantes! 🙏";
        }

        // Simula digitação (mínimo 1s, máximo 4s - Groq é rápido)
        const delay = Math.min(Math.max(responseText.length * 20, 1000), 4000);
        await new Promise(r => setTimeout(r, delay));

        await sock.sendPresenceUpdate('paused', remoteJid);
        await sock.sendMessage(remoteJid, { text: responseText });
        
        // SALVAR A RESPOSTA DA IA NO REDIS IMEDIATAMENTE
        try {
          const convId = `${botId}:${contactPhone}`;
          const convKey = `axon:conversations:${convId}`;
          let conv: any = await redis.get(convKey);
          if (conv) {
            conv.messages.push({
              id: Math.random().toString(36).substr(2, 9),
              content: responseText,
              sender: 'bot',
              time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date().toISOString()
            });
            conv.lastMessage = responseText;
            conv.timestamp = new Date().toISOString();
            if (conv.messages.length > 50) conv.messages = conv.messages.slice(-50);
            await redis.set(convKey, conv);
          }
        } catch (e) {
          console.error('[WhatsAppService] Erro ao salvar resposta da IA no Redis:', e);
        }
        
      } catch (err: any) {
        const errorMessage = err?.message || String(err);
        console.error(`[WhatsAppService] Erro Crítico na Inteligência Artificial: [${contactPhone}]`, errorMessage);
        
        if (remoteJid) {
          await sock.sendPresenceUpdate('paused', remoteJid).catch(() => {});
          await sock.sendMessage(remoteJid, { text: "Estou com uma instabilidade agora. Tente novamente em instantes! 🙏" }).catch(() => {});
        }

        // SALVAR O ERRO NO PAINEL PARA O USUÁRIO VER
        try {
          const contactPhone = remoteJid.replace('@s.whatsapp.net', '');
          const convId = `${botId}:${contactPhone}`;
          const convKey = `axon:conversations:${convId}`;
          let conv: any = await redis.get(convKey);
          if (conv) {
            conv.messages.push({
              id: Math.random().toString(36).substr(2, 9),
              content: `⚠️ [ERRO NA IA]: Falha ao gerar resposta. Verifique se a Chave API do Groq Cloud está correta. Erro técnico: ${errorMessage}`,
              sender: 'bot',
              time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date().toISOString()
            });
            conv.lastMessage = "⚠️ Erro na IA";
            conv.timestamp = new Date().toISOString();
            await redis.set(convKey, conv);
          }
        } catch (e) {}
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
    
    // Salva a mensagem enviada no histórico da IA para contexto
    const phone = to.split('@')[0];
    appendToHistory(phone, 'assistant', text);
    
    return await sock.sendMessage(to, { text });
  }

  static async sendMessageWithMedia(botId: string, to: string, text: string, mediaUrl: string, mediaType: string) {
    const sock = await this.getSocket(botId);
    if (!sock) {
      throw new Error('Bot não está conectado ou a sessão expirou. Reconecte-o no painel.');
    }
    
    // Salva a mensagem enviada no histórico da IA para contexto
    const phone = to.split('@')[0];
    if (text) {
      appendToHistory(phone, 'assistant', text);
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

  static async updateProfilePicture(botId: string, options: { imageUrl?: string, imageBase64?: string }) {
    const sock = await this.getSocket(botId);
    if (!sock) {
      throw new Error('Bot não está conectado ou a sessão expirou.');
    }
    
    let buffer: Buffer;

    if (options.imageBase64) {
      const base64Data = options.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, 'base64');
    } else if (options.imageUrl) {
      const response = await fetch(options.imageUrl);
      if (!response.ok) {
        throw new Error('Não foi possível baixar a imagem da URL fornecida.');
      }
      buffer = Buffer.from(await response.arrayBuffer());
    } else {
      throw new Error('Nenhuma imagem fornecida.');
    }
    
    // Atualizar a foto (0 jid = my jid)
    const jid = sock.user?.id;
    if (!jid) throw new Error('Não foi possível obter o JID do bot');
    
    await sock.updateProfilePicture(jid, buffer);
    return true;
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
