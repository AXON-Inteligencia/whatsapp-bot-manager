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
    const status = await redisRest.get(`status:${botId}`);
    if (status !== 'online') {
      return NextResponse.json({ error: 'Bot não está conectado' }, { status: 400 });
    }

    const formattedPhone = phone.replace(/\D/g, '') + '@s.whatsapp.net';

    // Se useQueue é true, adicionar à fila (MANTIDO)
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

    // Envio síncrono via MOTOR
    try {
      const MOTOR_URL = process.env.MOTOR_URL || 'http://localhost:10001';
      
      const response = await fetch(`${MOTOR_URL}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          botId, 
          to: formattedPhone, 
          message, 
          mediaUrl, 
          mediaType 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json({ error: data.error || 'Erro ao enviar via motor' }, { status: response.status });
      }

      return NextResponse.json({
        message: 'Mensagem enviada com sucesso',
        phone,
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
