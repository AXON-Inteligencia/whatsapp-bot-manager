import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';
import { redisRest } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { botId } = await req.json();

    if (!botId) {
      return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
    }

    // Verificar se o bot já está conectado
    const currentStatus = await WhatsAppService.getStatus(botId);
    if (currentStatus === 'online') {
      return NextResponse.json({
        message: 'Bot já está conectado',
        status: 'online',
      });
    }

    // Marcar como conectando
    await redisRest.set(`status:${botId}`, 'connecting');

    // Iniciar conexão em background
    WhatsAppService.connect(
      botId,
      async (qr) => {
        // Salvar QR no Redis com TTL de 90 segundos
        await redisRest.set(`qr:${botId}`, qr, { ex: 90 });
        console.log(`QR Code gerado para bot ${botId}`);
      },
      async () => {
        // Quando conectado, limpar QR e atualizar status
        await redisRest.del(`qr:${botId}`);
        await redisRest.set(`status:${botId}`, 'online');
        console.log(`Bot ${botId} conectado com sucesso`);
      }
    ).catch((error) => {
      console.error(`Erro ao conectar bot ${botId}:`, error);
      redisRest.set(`status:${botId}`, 'offline');
    });

    return NextResponse.json({
      message: 'Conexão iniciada, aguarde o QR Code',
      status: 'connecting',
      botId,
    });
  } catch (error: any) {
    console.error('Erro na rota de conexão:', error);
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

    const status = await WhatsAppService.getStatus(botId);
    const qr = await redisRest.get(`qr:${botId}`);
    const connectedAt = await redisRest.get(`connected_at:${botId}`);

    return NextResponse.json({
      botId,
      status,
      qr: qr || null,
      connectedAt: connectedAt || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
