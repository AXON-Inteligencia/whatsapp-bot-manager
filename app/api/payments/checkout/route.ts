import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-SEU_TOKEN_AQUI',
  options: { timeout: 5000 }
});

const PLANS = {
  starter: { price: 97.00, title: "AxonFlow Starter - Assinatura Mensal" },
  pro: { price: 197.00, title: "AxonFlow Pro - Assinatura Mensal" },
  enterprise: { price: 497.00, title: "AxonFlow Enterprise - Assinatura Mensal" }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, plan } = body;

    if (!userEmail) {
      return NextResponse.json({ error: "Email do usuário é obrigatório" }, { status: 400 });
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS];
    if (!selectedPlan) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const preApproval = new PreApproval(client);
    
    const subscription = await preApproval.create({
      body: {
        reason: selectedPlan.title,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: selectedPlan.price,
          currency_id: "BRL"
        },
        back_url: "https://flow.axoninteligencia.com.br/dashboard?payment=success",
        payer_email: userEmail,
        status: "pending"
      }
    });

    return NextResponse.json({ 
      checkoutUrl: subscription.init_point,
      subscriptionId: subscription.id 
    });

  } catch (error: any) {
    console.error("[MercadoPago Checkout Error]:", error);
    return NextResponse.json({ error: "Erro ao gerar link de pagamento." }, { status: 500 });
  }
}
