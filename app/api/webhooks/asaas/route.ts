import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.headers.get('asaas-access-token');
    
    // Opcional: Verificação de segurança (recomendado configurar no ambiente de prod)
    if (process.env.ASAAS_WEBHOOK_TOKEN && accessToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
    }

    const body = await request.json();
    const eventType = body.event;
    const payment = body.payment;

    if (!payment || !payment.customer) {
      return NextResponse.json({ error: "Missing payment data" }, { status: 400 });
    }

    // Idempotência
    const { data: existingEvent } = await supabase
      .from('processed_webhooks')
      .select('payment_id')
      .eq('payment_id', payment.id)
      .single();

    if (existingEvent) {
      return NextResponse.json({ message: "Webhook already processed" });
    }

    // Processar pagamento confirmado
    if (eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED') {
      const customerId = payment.customer;

      // Calcular expiração (+30 dias)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          payment_status: 'active',
          plan: 'pro',
          payment_expires_at: expiresAt.toISOString(),
        })
        .eq('asaas_customer_id', customerId);

      if (updateError) {
        console.error("Erro ao atualizar usuário pelo Webhook:", updateError);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    }

    // Registrar webhook como processado (mesmo se for outro evento, como PAYMENT_OVERDUE)
    await supabase
      .from('processed_webhooks')
      .insert({
        payment_id: payment.id,
        event_type: eventType,
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Asaas Webhook Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
