import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';
import { redisRest } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
    }

    // Desconectar o bot
    await WhatsAppService.disconnect(botId);

    return NextResponse.json({
      message: 'Bot desconectado com sucesso',
      botId,
      status: 'offline',
    });
  } catch (error: any) {
    console.error('Erro ao desconectar bot:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
