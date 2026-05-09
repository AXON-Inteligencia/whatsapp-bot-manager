import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';

// Nota: Em um ambiente real, usaríamos WebSockets ou Server-Sent Events para o QR Code.
// Para este MVP, vamos simular o início da conexão.

export async function POST(req: NextRequest) {
  try {
    const { botId } = await req.json();

    if (!botId) {
      return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
    }

    // Inicia a conexão em background
    // Em produção, isso precisaria de um gerenciador de processos ou worker
    WhatsAppService.connect(
      botId, 
      (qr) => {
        // Aqui salvaríamos o QR no Redis para o frontend buscar
        console.log(`QR Code para ${botId}: ${qr}`);
      },
      () => {
        console.log(`Bot ${botId} conectado!`);
      }
    );

    return NextResponse.json({ message: 'Conexão iniciada' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
