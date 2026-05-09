import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';

export async function POST(req: NextRequest) {
  try {
    const { botId, phone, message } = await req.json();

    if (!botId || !phone || !message) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    // Formata o número para o padrão do WhatsApp (ex: 5511999999999@s.whatsapp.net)
    const formattedPhone = phone.replace(/\D/g, '') + '@s.whatsapp.net';

    await WhatsAppService.sendMessage(botId, formattedPhone, message);

    return NextResponse.json({ message: 'Mensagem enviada com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
