import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';
import { addBulkMessageJob } from '@/lib/queue/message-queue';
import { redisRest } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { botId, contacts, message, delayMs = 3000, mediaUrl, mediaType, useQueue = true } = await req.json();

    if (!botId || !contacts || !message) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'Lista de contatos inválida' }, { status: 400 });
    }

    // Validar se o bot está conectado
    const status = await WhatsAppService.getStatus(botId);
    if (status !== 'online') {
      return NextResponse.json({ error: 'Bot não está conectado' }, { status: 400 });
    }

    // Se useQueue é true, adicionar à fila BullMQ
    if (useQueue) {
      try {
        const jobId = await addBulkMessageJob(botId, contacts, message, {
          delayMs,
          mediaUrl,
          mediaType,
        });

        return NextResponse.json({
          message: 'Campanha adicionada à fila',
          jobId,
          total: contacts.length,
          status: 'queued',
        });
      } catch (error: any) {
        console.error('Erro ao adicionar à fila:', error);
        // Fallback para envio síncrono
      }
    }

    // Envio síncrono (fallback ou se useQueue for false)
    const results: { phone: string; status: 'sent' | 'error'; error?: string }[] = [];

    for (const contact of contacts) {
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

        results.push({ phone, status: 'sent' });
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (errMsg.toLowerCase().includes('timeout') || errMsg.toLowerCase().includes('timed out')) {
          results.push({ phone, status: 'sent' });
        } else {
          results.push({ phone, status: 'error', error: errMsg });
        }
      } finally {
        // Delay anti-ban com variação aleatória
        if (delayMs > 0) {
          const randomDelay = delayMs + Math.random() * (delayMs * 0.3);
          await new Promise((resolve) => setTimeout(resolve, randomDelay));
        }
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length;
    const errors = results.filter((r) => r.status === 'error').length;

    // Registrar campanha no Redis
    await redisRest.lpush(`campaigns:${botId}`, JSON.stringify({
      timestamp: new Date().toISOString(),
      total: contacts.length,
      sent,
      errors,
      message: message.substring(0, 100),
    }));

    return NextResponse.json({
      message: `Campanha concluída: ${sent} enviadas, ${errors} erros`,
      total: contacts.length,
      sent,
      errors,
      results,
    });
  } catch (error: any) {
    console.error('Erro na rota de bulk send:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
    }

    // Obter histórico de campanhas
    const campaigns = await redisRest.lrange(`campaigns:${botId}`, 0, 9);

    return NextResponse.json({
      botId,
      campaigns: campaigns.map((c) => JSON.parse(c as string)),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
