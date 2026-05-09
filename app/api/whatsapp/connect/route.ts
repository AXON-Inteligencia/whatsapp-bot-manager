import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function POST(req: NextRequest) {
  try {
    const { botId } = await req.json();

    if (!botId) {
      return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
    }

    // Marca o bot como conectando
    await redis.set(`status:${botId}`, 'connecting');

    // Inicia a conexão em background — o WhatsAppService já salva o QR no Redis internamente
    WhatsAppService.connect(
      botId,
      async (qr) => {
        // Garante que o QR está salvo no Redis com TTL de 90 segundos
        await redis.set(`qr:${botId}`, qr, { ex: 90 });
        await redis.set(`status:${botId}`, 'connecting');
      },
      async () => {
        // Quando conectado, limpa o QR e atualiza o status
        await redis.del(`qr:${botId}`);
        await redis.set(`status:${botId}`, 'online');
      }
    );

    return NextResponse.json({ message: 'Conexão iniciada' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
