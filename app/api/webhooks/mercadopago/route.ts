import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const body = await req.json();

    // No ambiente real, valide a assinatura X-Signature usando seu MERCADOPAGO_WEBHOOK_SECRET
    // para garantir que a requisição veio mesmo da Meta/MercadoPago.

    console.log("[MercadoPago Webhook] Evento recebido:", body);

    // O Mercado Pago envia notificações de pagamento (payment) ou assinatura (subscription_preapproval)
    if (body.type === "payment" || body.action === "payment.created") {
      // 1. Busque o pagamento na API do MP usando body.data.id
      // 2. Descubra o email do pagador
      // 3. Atualize no banco de dados (Abaixo é um mock de atualização)
      
      /*
      const payerEmail = "email_do_pagador_retornado_pela_api";
      await sql`
        UPDATE users 
        SET plan = 'pro', payment_status = 'active' 
        WHERE email = ${payerEmail}
      `;
      */
      
      console.log("[MercadoPago] Pagamento detectado e processado.");
    }

    if (body.type === "subscription_preapproval") {
      console.log("[MercadoPago] Assinatura atualizada.");
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("[MercadoPago Webhook Error]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
