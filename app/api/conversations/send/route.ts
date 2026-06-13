import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';

export async function POST(req: NextRequest) {
  try {
    const { botId, to, text } = await req.json();

    if (!botId || !to || !text) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
    
    // Envia a mensagem via Motor
    const MOTOR_URL = process.env.MOTOR_URL || 'http://127.0.0.1:10001';
    const response = await fetch(`${MOTOR_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botId, to: jid, message: text }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erro ao enviar via motor');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Send Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
