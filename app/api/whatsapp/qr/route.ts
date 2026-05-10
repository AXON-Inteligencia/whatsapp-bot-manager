import { NextRequest, NextResponse } from 'next/server';
import { redisRest } from '@/lib/redis';
import { WhatsAppService } from '@/lib/whatsapp/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get('botId');

  if (!botId) {
    return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
  }

  try {
    // Obter QR code do Redis
    const qr = await redisRest.get(`qr:${botId}`);
    
    // Obter status real do bot
    const status = await WhatsAppService.getStatus(botId);
    
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
