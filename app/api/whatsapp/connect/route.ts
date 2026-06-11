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

    const MOTOR_URL = process.env.MOTOR_URL || 'http://localhost:10001';
    
    console.log(`[Vercel API] Solicitando conexão ao motor para o bot: ${botId}`);

    const response = await fetch(`${MOTOR_URL}/api/whatsapp/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Erro no motor' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao chamar o motor:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
