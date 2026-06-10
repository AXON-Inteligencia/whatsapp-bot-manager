import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-SEU_TOKEN_AQUI',
  options: { timeout: 5000 }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("[MercadoPago Webhook] Evento recebido:", body.type || body.action);

    if (body.type === "payment" || body.action?.startsWith("payment")) {
      const paymentId = body.data?.id;
      if (!paymentId) return new NextResponse("OK", { status: 200 });

      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === "approved") {
        const payerEmail = paymentData.payer?.email;
        const description = paymentData.description || "";
        
        let plan = "pro"; // Default fallback
        if (description.toLowerCase().includes("starter")) plan = "starter";
        if (description.toLowerCase().includes("enterprise")) plan = "enterprise";

        if (payerEmail) {
          await sql`
            UPDATE users 
            SET plan = ${plan}, payment_status = 'paid' 
            WHERE email = ${payerEmail}
          `;
          console.log(`[MercadoPago] Plano ${plan} ativado para ${payerEmail}`);
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("[MercadoPago Webhook Error]:", error);
    // Retornamos 200 mesmo no erro para que o MercadoPago pare de reenviar se não for crítico
    return new NextResponse("OK", { status: 200 });
  }
}
