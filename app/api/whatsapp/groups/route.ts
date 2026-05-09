import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const botId = searchParams.get('botId');
    const query = searchParams.get('query') || '';

    if (!botId) {
      return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
    }

    const sock = WhatsAppService.getInstance(botId);
    if (!sock) {
      return NextResponse.json({ error: 'Bot não conectado. Conecte o bot primeiro.' }, { status: 400 });
    }

    // Busca todos os grupos do WhatsApp conectado
    const groups = await WhatsAppService.getGroups(botId, query);

    return NextResponse.json({ groups });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { botId, groupId } = await req.json();

    if (!botId || !groupId) {
      return NextResponse.json({ error: 'botId e groupId são obrigatórios' }, { status: 400 });
    }

    const members = await WhatsAppService.getGroupMembers(botId, groupId);

    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
