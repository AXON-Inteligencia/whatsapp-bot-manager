import { NextRequest, NextResponse } from 'next/server';
import { redisRest } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get('botId');

  if (!botId) {
    return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
  }

  try {
    // Obter QR code do Redis
    const qr = await redisRest.get(`qr:${botId}`);

    // Obter status do bot diretamente do Redis
    const rawStatus = await redisRest.get(`status:${botId}`);

    // Normalizar status: 'connected' e 'online' são equivalentes
    let status: string;
    if (rawStatus === 'connected' || rawStatus === 'online') {
      status = 'online';
    } else if (rawStatus === 'connecting') {
      status = 'connecting';
    } else {
      status = 'offline';
    }

    // Obter timestamp de conexão
    const connectedAt = await redisRest.get(`connected_at:${botId}`);

    return NextResponse.json({
      botId,
      qr: qr || null,
      status,
      connectedAt: connectedAt || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erro ao buscar QR code:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
