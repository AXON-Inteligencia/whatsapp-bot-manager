import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { findOrCreateCustomer, createPaymentLink } from "@/lib/asaas/client";
import { supabase } from "@/lib/supabase";

const JWT_SECRET = process.env.JWT_SECRET || "axon-inteligencia-secret-key-2024";

async function getUserFromSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("axon-auth-token")?.value;
    if (!token) return null;
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const sessionUser = await getUserFromSession();
  if (!sessionUser || !sessionUser.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { planName, value } = body;

    const { data: dbUser, error } = await supabase
      .from('users')
      .select('email, name, asaas_customer_id')
      .eq('id', sessionUser.id)
      .single();

    if (error || !dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    let customerId = dbUser.asaas_customer_id;

    if (!customerId) {
      customerId = await findOrCreateCustomer(sessionUser.id, dbUser.name, dbUser.email);
      await supabase
        .from('users')
        .update({ asaas_customer_id: customerId })
        .eq('id', sessionUser.id);
    }

    const paymentLink = await createPaymentLink(customerId, planName, value);

    return NextResponse.json({ paymentLink });
  } catch (err: any) {
    console.error("[Checkout API Error]:", err);
    return NextResponse.json({ error: "Erro ao gerar link de pagamento, tente novamente" }, { status: 502 });
  }
}
