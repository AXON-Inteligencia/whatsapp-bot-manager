import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const VALID_STAGES = ['new_lead', 'negotiating', 'closed', 'support'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body || !body.stage || !VALID_STAGES.includes(body.stage)) {
      return NextResponse.json({ error: "Estágio inválido. Use: 'new_lead', 'negotiating', 'closed', 'support'." }, { status: 400 });
    }

    // Atualiza o estágio no Redis. Pode ser chave de contato isolada ou dentro da conversa.
    // O id pode ser o phone ou id do contato
    await redis.set(`contact:${id}:stage`, body.stage);

    return NextResponse.json({ success: true, id, stage: body.stage });
  } catch (error) {
    console.error("[Stage Update Error]:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stage = await redis.get(`contact:${id}:stage`) || 'new_lead';
    return NextResponse.json({ success: true, id, stage });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
