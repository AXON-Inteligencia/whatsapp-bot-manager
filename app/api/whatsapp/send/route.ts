import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';
import { addMessageToQueue } from '@/lib/queue/message-queue';
import { redisRest } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { botId, phone, message, mediaUrl, mediaType, useQueue = false } = await req.json();

    if (!botId || !phone || !message) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    // Validar se o bot está conectado
    const status = await WhatsAppService.getStatus(botId);
    if (status !== 'online') {
      return NextResponse.json({ error: 'Bot não está conectado' }, { status: 400 });
    }

    const formattedPhone = phone.replace(/\D/g, '') + '@s.whatsapp.net';

    // Se useQueue é true, adicionar à fila
    if (useQueue) {
      try {
        const jobId = await addMessageToQueue(botId, formattedPhone, message, {
          mediaUrl,
          mediaType,
        });

        return NextResponse.json({
          message: 'Mensagem adicionada à fila',
          jobId,
          status: 'queued',
        });
      } catch (error: any) {
        console.error('Erro ao adicionar à fila:', error);
        // Fallback para envio síncrono
      }
    }

    // Envio síncrono
    try {
      let result;

      if (mediaUrl && mediaType) {
        result = await WhatsAppService.sendMessageWithMedia(
          botId,
          formattedPhone,
          message,
          mediaUrl,
          mediaType
        );
      } else {
        result = await WhatsAppService.sendMessage(botId, formattedPhone, message);
      }

      return NextResponse.json({
        message: 'Mensagem enviada com sucesso',
        phone,
        messageId: result.key.id,
        sentAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro na rota de envio:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
