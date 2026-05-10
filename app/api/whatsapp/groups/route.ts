import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';
import { redisRest } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const botId = searchParams.get('botId');
    const query = searchParams.get('query') || '';

    if (!botId) {
      return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
    }

    // Validar se o bot está conectado
    const status = await WhatsAppService.getStatus(botId);
    if (status !== 'online') {
      return NextResponse.json({ error: 'Bot não está conectado' }, { status: 400 });
    }

    // Buscar grupos
    const groups = await WhatsAppService.getGroups(botId, query);

    return NextResponse.json({
      botId,
      query,
      total: groups.length,
      groups,
    });
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

    // Validar se o bot está conectado
    const status = await WhatsAppService.getStatus(botId);
    if (status !== 'online') {
      return NextResponse.json({ error: 'Bot não está conectado' }, { status: 400 });
    }

    // Buscar membros do grupo
    const members = await WhatsAppService.getGroupMembers(botId, groupId);

    // Registrar extração no Redis
    await redisRest.lpush(`group_extractions:${botId}`, JSON.stringify({
      groupId,
      memberCount: members.length,
      extractedAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      botId,
      groupId,
      total: members.length,
      members,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
