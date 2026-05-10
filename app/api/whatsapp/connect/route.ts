import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';
import { redisRest } from '@/lib/redis';

export const maxDuration = 60; // Aumentar tempo de execução para 60s (Vercel Pro/Hobby)

export async function POST(req: NextRequest) {
    try {
          const body = await req.json();
          const { botId } = body;

      if (!botId) {
              return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
      }

      console.log(`Iniciando conexão para o bot: ${botId}`);

      // Verificar status atual
      const currentStatus = await WhatsAppService.getStatus(botId);
          if (currentStatus === 'online') {
                  return NextResponse.json({
                            message: 'Bot já está conectado',
                            status: 'online',
                            botId
                  });
          }

      // Iniciar conexão
      // Nota: Em serverless, o processo pode ser congelado após a resposta.
      // Vamos aguardar um pouco para ver se o QR é gerado e salvo no Redis.

      let qrGenerated = false;
          const connectionPromise = WhatsAppService.connect(
                  botId,
                  async (qr) => {
                            qrGenerated = true;
                            await redisRest.set(`qr:${botId}`, qr, { ex: 90 });
                            console.log(`QR Code gerado com sucesso para ${botId}`);
                  },
                  async () => {
                            await redisRest.del(`qr:${botId}`);
                            await redisRest.set(`status:${botId}`, 'online');
                            console.log(`Bot ${botId} conectado!`);
                  }
                );

      // Aguardar até 25 segundos pela geração do QR Code inicial
      // Isso ajuda a garantir que o QR seja gerado antes da função serverless terminar
      let qr = null;
          const startTime = Date.now();

      while (Date.now() - startTime < 25000) {
              
