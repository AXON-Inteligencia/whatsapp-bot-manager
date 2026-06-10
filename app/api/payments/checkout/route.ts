import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

// Instância do SDK do Mercado Pago
// No ambiente de produção, certifique-se de que MERCADOPAGO_ACCESS_TOKEN está definido.
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-SEU_TOKEN_AQUI',
  options: { timeout: 5000 }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail } = body;

    if (!userEmail) {
      return NextResponse.json({ error: "Email do usuário é obrigatório" }, { status: 400 });
    }

    // Como é uma assinatura mensal profissional, usamos o PreApproval (Assinaturas)
    const preApproval = new PreApproval(client);
    
    // Configuração do plano Pro (R$ 297/mês)
    const subscription = await preApproval.create({
      body: {
        reason: "AxonFlow Pro - Assinatura Mensal",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 297.00,
          currency_id: "BRL"
        },
        back_url: "https://axonflow.com/dashboard?payment=success",
        payer_email: userEmail,
        status: "pending"
      }
    });

    // subscription.init_point é o link oficial de checkout do Mercado Pago
    return NextResponse.json({ 
      checkoutUrl: subscription.init_point,
      subscriptionId: subscription.id 
    });

  } catch (error: any) {
    console.error("[MercadoPago Checkout Error]:", error);
    return NextResponse.json({ error: "Erro ao gerar link de pagamento." }, { status: 500 });
  }
}
