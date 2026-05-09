import { NextRequest, NextResponse } from 'next/server';
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get('botId');

  if (!botId) {
    return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
  }

  try {
    const qr = await redis.get(`qr:${botId}`);
    const status = await redis.get(`status:${botId}`) || 'offline';

    return NextResponse.json({ qr, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
