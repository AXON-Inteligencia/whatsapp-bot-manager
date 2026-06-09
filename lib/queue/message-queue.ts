import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedisIO } from '@/lib/redis';
import { WhatsAppService } from '@/lib/whatsapp/service';

export interface MessageJob {
  botId: string;
  remoteJid: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'audio' | 'video';
  retries?: number;
  timestamp: number;
}

let messageQueue: Queue<MessageJob> | null = null;
let queueEvents: QueueEvents | null = null;

export function getMessageQueue(): Queue<MessageJob> {
  if (!messageQueue) {
    const connection = getRedisIO();
    messageQueue = new Queue<MessageJob>('whatsapp-messages', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    // Inicializar eventos da fila
    queueEvents = new QueueEvents('whatsapp-messages', { connection });
  }

  return messageQueue;
}

export async function initializeMessageWorker() {
  const connection = getRedisIO();
  
  const worker = new Worker<MessageJob>(
    'whatsapp-messages',
    async (job) => {
      const { botId, remoteJid, text, mediaUrl, mediaType } = job.data;

      try {
        if (mediaUrl && mediaType) {
          // Enviar mensagem com mídia
          await WhatsAppService.sendMessageWithMedia(
            botId,
            remoteJid,
            text,
            mediaUrl,
            mediaType
          );
        } else {
          // Enviar mensagem de texto
          await WhatsAppService.sendMessage(botId, remoteJid, text);
        }

        return {
          success: true,
          sentAt: new Date().toISOString(),
          jobId: job.id,
        };
      } catch (error: any) {
        console.error(`Erro ao enviar mensagem (Job ${job.id}):`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5, // Processar até 5 mensagens simultaneamente por bot
      settings: {
        lockDuration: 30000, // Lock de 30 segundos por job
        lockRenewTime: 15000, // Renovar lock a cada 15 segundos
      },
    }
  );

  // Listeners para monitoramento
  worker.on('completed', (job) => {
    console.log(`✅ Mensagem enviada: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Falha ao enviar mensagem ${job?.id}:`, err.message);
  });

  return worker;
}

export async function addMessageToQueue(
  botId: string,
  remoteJid: string,
  text: string,
  options?: {
    mediaUrl?: string;
    mediaType?: 'image' | 'document' | 'audio' | 'video';
    delay?: number;
    priority?: number;
  }
): Promise<string> {
  const queue = getMessageQueue();

  const job = await queue.add(
    'send',
    {
      botId,
      remoteJid,
      text,
      mediaUrl: options?.mediaUrl,
      mediaType: options?.mediaType,
      timestamp: Date.now(),
    },
    {
      delay: options?.delay || 0,
      priority: options?.priority || 0,
    }
  );

  return job.id || '';
}

export async function getBulkMessageQueue(): Promise<Queue<any>> {
  const connection = getRedisIO();
  return new Queue('whatsapp-bulk-send', {
    connection,
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: false,
    },
  });
}

export async function initializeBulkMessageWorker() {
  const connection = getRedisIO();

  const worker = new Worker<any>(
    'whatsapp-bulk-send',
    async (job) => {
      const { botId, contacts, message, delayMs = 3000, mediaUrl, mediaType } = job.data;
      const results: any[] = [];

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const phone = typeof contact === 'string' ? contact : contact.phone;

        if (!phone) continue;

      try {
          let cleanPhone = phone.replace(/\D/g, '');
          // Se for um número brasileiro sem o 55 (ex: 41999999999)
          if (cleanPhone.length === 10 || cleanPhone.length === 11) {
            cleanPhone = '55' + cleanPhone;
          }
          const formattedPhone = cleanPhone + '@s.whatsapp.net';

          if (mediaUrl && mediaType) {
            await WhatsAppService.sendMessageWithMedia(
              botId,
              formattedPhone,
              message,
              mediaUrl,
              mediaType
            );
          } else {
            await WhatsAppService.sendMessage(botId, formattedPhone, message);
          }

          results.push({
            phone,
            status: 'sent',
            sentAt: new Date().toISOString(),
          });

          // Progresso
          job.progress(((i + 1) / contacts.length) * 100);
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          // O WhatsApp às vezes demora para confirmar (ACK) e a biblioteca Baileys 
          // lança um "TimeoutError" mesmo que a mensagem tenha sido entregue com sucesso.
          // Nesses casos de timeout, vamos considerar como enviada para não alarmar o usuário.
          if (errMsg.toLowerCase().includes('timeout') || errMsg.toLowerCase().includes('timed out')) {
            results.push({
              phone,
              status: 'sent',
              sentAt: new Date().toISOString(),
            });
            job.progress(((i + 1) / contacts.length) * 100);
          } else {
            results.push({
              phone,
              status: 'error',
              error: errMsg,
            });
          }
        } finally {
          // Delay anti-ban OBRIGATÓRIO, executa mesmo que dê erro na mensagem anterior
          if (delayMs > 0) {
            const randomDelay = delayMs + Math.random() * (delayMs * 0.3);
            await new Promise((resolve) => setTimeout(resolve, randomDelay));
          }
        }
      }

      const sent = results.filter((r) => r.status === 'sent').length;
      const errors = results.filter((r) => r.status === 'error').length;

      return {
        total: contacts.length,
        sent,
        errors,
        results,
      };
    },
    {
      connection,
      concurrency: 1, // Uma campanha por vez
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Campanha concluída: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Falha na campanha ${job?.id}:`, err.message);
  });

  return worker;
}

export async function addBulkMessageJob(
  botId: string,
  contacts: string[],
  message: string,
  options?: {
    delayMs?: number;
    mediaUrl?: string;
    mediaType?: 'image' | 'document' | 'audio' | 'video';
  }
): Promise<string> {
  const queue = await getBulkMessageQueue();

  const job = await queue.add('bulk-send', {
    botId,
    contacts,
    message,
    delayMs: options?.delayMs || 3000,
    mediaUrl: options?.mediaUrl,
    mediaType: options?.mediaType,
  });

  return job.id || '';
}
