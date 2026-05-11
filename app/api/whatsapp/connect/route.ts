import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';
import { redisRest } from '@/lib/redis';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { botId } = body;

    if (!botId) {
      return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
    }

    console.log(`Iniciando conexão para o bot: ${botId}`);

    // Verificar status atual
    const currentStatus = await redisRest.get(`status:${botId}`);
    if (currentStatus === 'connected' || currentStatus === 'online') {
      return NextResponse.json({
        message: 'Bot já está conectado',
        status: 'online',
        botId,
      });
    }

    // Marcar como conectando no Redis
    await redisRest.set(`status:${botId}`, 'connecting', { ex: 120 });

    // Iniciar conexão em background (não aguardar)
    WhatsAppService.connect(botId).catch((error) => {
      console.error(`Erro ao conectar bot ${botId}:`, error);
      redisRest.set(`status:${botId}`, 'offline').catch(() => {});
    });

    // Aguardar até 20 segundos para o QR Code ser gerado no Redis
    const startTime = Date.now();
    let qr: string | null = null;

    while (Date.now() - startTime < 20000) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const stored = await redisRest.get(`qr:${botId}`);
      if (stored) {
        qr = stored as string;
        break;
      }
      // Verificar se já conectou sem precisar de QR (sessão salva)
      const status = await redisRest.get(`status:${botId}`);
      if (status === 'connected' || status === 'online') {
        return NextResponse.json({
          message: 'Bot conectado com sessão existente',
          status: 'online',
          botId,
        });
      }
    }

    if (qr) {
      return NextResponse.json({
        message: 'QR Code gerado com sucesso',
        status: 'connecting',
        botId,
        qr,
      });
    }

    // QR não foi gerado no tempo limite, mas a conexão continua em background
    return NextResponse.json({
      message: 'Conexão iniciada. Use o endpoint /api/whatsapp/qr para obter o QR Code.',
      status: 'connecting',
      botId,
      qr: null,
    });
  } catch (error: any) {
    console.error('Erro ao iniciar conexão:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
