import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';

export async function POST(req: NextRequest) {
  try {
    const { botId, contacts, message, delayMs = 3000 } = await req.json();

    if (!botId || !contacts || !message) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'Lista de contatos inválida' }, { status: 400 });
    }

    const results: { phone: string; status: 'sent' | 'error'; error?: string }[] = [];

    for (const contact of contacts) {
      const phone = typeof contact === 'string' ? contact : contact.phone;
      if (!phone) continue;

      try {
        const formattedPhone = phone.replace(/\D/g, '') + '@s.whatsapp.net';
        await WhatsAppService.sendMessage(botId, formattedPhone, message);
        results.push({ phone, status: 'sent' });

        // Delay entre mensagens para evitar bloqueio
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (err: any) {
        results.push({ phone, status: 'error', error: err.message });
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length;
    const errors = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      message: `Campanha concluída: ${sent} enviadas, ${errors} erros`,
      total: contacts.length,
      sent,
      errors,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
