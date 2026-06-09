import { NextRequest, NextResponse } from 'next/server';
import { redisRest } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const bots: any[] = await redisRest.get('axon:bots') || [];

    // Sincronizar status de cada bot com o Redis em tempo real
    const botsWithStatus = await Promise.all(
      bots.map(async (bot) => {
        const rawStatus = await redisRest.get(`status:${bot.id}`);
        let status: string;
        if (rawStatus === 'connected' || rawStatus === 'online') {
          status = 'online';
        } else if (rawStatus === 'connecting') {
          status = 'connecting';
        } else {
          status = 'offline';
        }
        return { ...bot, status };
      })
    );

    return NextResponse.json(botsWithStatus);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const bot = await req.json();
    const bots: any[] = await redisRest.get('axon:bots') || [];

    const newBot = {
      ...bot,
      id: bot.id || Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      messages: 0,
      uptime: '0%',
      status: 'offline',
    };

    const updatedBots = [...bots, newBot];
    await redisRest.set('axon:bots', updatedBots);

    return NextResponse.json(newBot);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    const bots: any[] = await redisRest.get('axon:bots') || [];

    const updatedBots = bots.map((bot) =>
      bot.id === id ? { ...bot, ...updates } : bot
    );

    await redisRest.set('axon:bots', updatedBots);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const bots: any[] = await redisRest.get('axon:bots') || [];
    const updatedBots = bots.filter((bot) => bot.id !== id);

    await redisRest.set('axon:bots', updatedBots);

    // Limpar dados do bot no Redis
    if (id) {
      await redisRest.del(`status:${id}`);
      await redisRest.del(`qr:${id}`);
      await redisRest.del(`creds:${id}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
