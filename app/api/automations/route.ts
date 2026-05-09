import { NextRequest, NextResponse } from 'next/server';
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function POST(req: NextRequest) {
  try {
    const automation = await req.json();
    const botId = automation.botId;

    if (!botId) {
      return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
    }

    const key = `automations:${botId}`;
    const existing = await redis.get<any[]>(key) || [];
    
    // Adiciona ou atualiza
    const index = existing.findIndex(a => a.id === automation.id);
    if (index >= 0) {
      existing[index] = automation;
    } else {
      existing.push(automation);
    }

    await redis.set(key, existing);

    return NextResponse.json({ message: 'Automação salva' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get('botId');

  if (!botId) {
    return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
  }

  try {
    const automations = await redis.get(`automations:${botId}`) || [];
    return NextResponse.json(automations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
