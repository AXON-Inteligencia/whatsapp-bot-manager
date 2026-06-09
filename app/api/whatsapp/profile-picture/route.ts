import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/whatsapp/service";

export async function POST(req: NextRequest) {
  try {
    const { botId, imageUrl, imageBase64 } = await req.json();

    if (!botId || (!imageUrl && !imageBase64)) {
      return NextResponse.json({ error: "botId e imageUrl ou imageBase64 são obrigatórios" }, { status: 400 });
    }

    await WhatsAppService.updateProfilePicture(botId, { imageUrl, imageBase64 });

    return NextResponse.json({ success: true, message: "Foto de perfil atualizada com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao atualizar foto:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
