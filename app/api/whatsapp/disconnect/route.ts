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

    const MOTOR_URL = process.env.MOTOR_URL || 'http://127.0.0.1:10001';
    
    console.log(`[Vercel API] Solicitando desconexão ao motor para o bot: ${botId}`);

    const response = await fetch(`${MOTOR_URL}/api/whatsapp/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Erro no motor' }, { status: response.status });
    }

    // Garantir que o status seja atualizado para offline
    await redisRest.set(`status:${botId}`, 'offline');
    await redisRest.del(`qr:${botId}`);

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
