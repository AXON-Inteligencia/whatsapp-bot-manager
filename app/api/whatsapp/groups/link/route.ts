import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';
import { redisRest } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { botId, groupId } = await req.json();

    if (!botId || !groupId) {
      return NextResponse.json({ error: 'botId e groupId são obrigatórios' }, { status: 400 });
    }

    // Validar se o bot está conectado
    const status = await WhatsAppService.getStatus(botId);
    if (status !== 'online') {
      return NextResponse.json({ error: 'Bot não está conectado' }, { status: 400 });
    }

    // Extrair link do grupo
    const result = await WhatsAppService.extractGroupLinks(botId, groupId);

    // Registrar no Redis
    await redisRest.lpush(`group_links:${botId}`, JSON.stringify({
      groupId,
      link: result.link,
      generatedAt: result.generatedAt,
    }));

    return NextResponse.json({
      botId,
      groupId,
      link: result.link,
      generatedAt: result.generatedAt,
    });
  } catch (error: any) {
    console.error('Erro ao extrair link do grupo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
