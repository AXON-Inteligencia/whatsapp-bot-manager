import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/whatsapp/service";
import { redisRest } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { botId, inviteLink } = await req.json();

    if (!botId || !inviteLink) {
      return NextResponse.json({ error: "botId e inviteLink são obrigatórios" }, { status: 400 });
    }

    // Valida o link
    const codeMatch = inviteLink.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]{20,25})/);
    if (!codeMatch) {
      return NextResponse.json({ error: "Link de convite inválido" }, { status: 400 });
    }
    const inviteCode = codeMatch[1];

    // O bot entra no grupo
    const sock = await WhatsAppService.getSocket(botId);
    if (!sock) {
      return NextResponse.json({ error: "Bot não está conectado na memória. Reconecte-o." }, { status: 400 });
    }

    let groupId = "";
    try {
      groupId = await sock.groupAcceptInvite(inviteCode);
    } catch (e: any) {
      return NextResponse.json({ error: "Não foi possível entrar no grupo. Talvez o link tenha sido revogado ou o bot já foi banido do grupo." }, { status: 400 });
    }

    // Espera 2 segundos para o WhatsApp sincronizar os metadados do grupo
    await new Promise(r => setTimeout(r, 2000));

    // Pega os membros do grupo
    try {
      const metadata = await sock.groupMetadata(groupId);
      const participants = metadata.participants.map(p => ({
        id: p.id,
        phone: p.id.split("@")[0],
        admin: p.admin
      }));

      // Salvar os contatos no Redis como cache temporário para a campanha puxar (ou retornar direto pro front)
      const extractKey = `extract:${botId}:${Date.now()}`;
      await redisRest.set(extractKey, JSON.stringify(participants), { ex: 3600 }); // Expira em 1 hora

      return NextResponse.json({
        success: true,
        groupId,
        groupName: metadata.subject,
        participantsCount: participants.length,
        participants,
        extractKey
      });
    } catch (err: any) {
      return NextResponse.json({ error: "Entrou no grupo, mas falhou ao extrair metadados: " + err.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
