import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';

export async function POST(req: NextRequest) {
  try {
    const { botId, to, text } = await req.json();

    if (!botId || !to || !text) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
    
    // Envia a mensagem via Baileys/WhatsApp Web
    await WhatsAppService.sendMessage(botId, jid, text);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Send Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
