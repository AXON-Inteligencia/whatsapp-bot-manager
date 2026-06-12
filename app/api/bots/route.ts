import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { redisRest } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { data: bots, error } = await supabase.from('bots').select('*');
    if (error) throw error;

    // Sincronizar status de cada bot com o Redis (apenas para status temporário de conexão)
    // Supabase armazena a listagem mestre. Redis gerencia o status real-time do WhatsApp.
    const botsWithStatus = await Promise.all(
      (bots || []).map(async (bot) => {
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

    const newBot = {
      ...bot,
      id: bot.id || Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      messages: 0,
      uptime: '0%',
      status: 'offline',
    };

    const { error } = await supabase.from('bots').insert([newBot]);
    if (error) throw error;

    return NextResponse.json(newBot);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();

    console.log('[Bots API] Updating bot', id, 'with:', JSON.stringify(updates));

    const { error, data } = await supabase.from('bots').update(updates).eq('id', id).select();
    
    if (error) {
      console.log('[Bots API] Update error:', error);
      throw error;
    }

    console.log('[Bots API] Update successful, returned data:', JSON.stringify(data));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Bots API] Catch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const { error } = await supabase.from('bots').delete().eq('id', id);
    if (error) throw error;

    // Limpar dados voláteis do bot no Redis
    await redisRest.del(`status:${id}`);
    await redisRest.del(`qr:${id}`);
    await redisRest.del(`creds:${id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
