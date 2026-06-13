import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { redisRest } from '@/lib/redis';
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || "axon-inteligencia-secret-key-2024";

async function getUserFromSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("axon-auth-token")?.value;
    if (!token) return null;
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getUserFromSession();
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: bots, error } = await supabase
      .from('bots')
      .select('*')
      .eq('user_id', sessionUser.id);
      
    if (error) throw error;

    // Sincronizar status de cada bot com o Redis (apenas para status temporário de conexão)
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
    const sessionUser = await getUserFromSession();
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar Limites do Plano
    const plan = sessionUser.plan || 'free';
    const limits: any = { starter: 1, pro: 5, enterprise: 9999, free: 0 };
    const maxBots = limits[plan] || 0;

    const { count } = await supabase
      .from('bots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', sessionUser.id);

    if (count !== null && count >= maxBots) {
      return NextResponse.json({ error: `Limite do plano atingido. Seu plano (${plan}) permite ${maxBots} bot(s). Faça upgrade!` }, { status: 403 });
    }

    const bot = await req.json();

    const newBot = {
      ...bot,
      user_id: sessionUser.id,
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
    const sessionUser = await getUserFromSession();
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...updates } = await req.json();

    const { error, data } = await supabase
      .from('bots')
      .update(updates)
      .eq('id', id)
      .eq('user_id', sessionUser.id) // Segurança Multi-tenant
      .select();
    
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getUserFromSession();
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const { error } = await supabase
      .from('bots')
      .delete()
      .eq('id', id)
      .eq('user_id', sessionUser.id); // Segurança Multi-tenant
      
    if (error) throw error;

    await redisRest.del(`status:${id}`);
    await redisRest.del(`qr:${id}`);
    await redisRest.del(`creds:${id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
