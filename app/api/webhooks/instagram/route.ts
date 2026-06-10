import { NextRequest, NextResponse } from 'next/server';
import { logConversationStart, updateConversationMessage, updateConversationRoute } from '@/lib/analytics';
import { redis } from '@/lib/redis';
import Groq from 'groq-sdk';

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "axonflow_instagram_token";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Instagram Webhook] Verificado pela Meta!");
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse("Forbidden", { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object === "instagram") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages") {
            const msgData = change.value.messages?.[0];
            if (!msgData) continue;

            const fromId = msgData.from.id; // Instagram sender ID
            const textMessage = msgData.text?.body;
            
            if (!textMessage) continue;

            console.log(`[Instagram] Mensagem recebida de ${fromId}: ${textMessage}`);

            // TODO: Aqui implementaríamos a busca do Access Token da página e 
            // a integração exata via Graph API: POST graph.facebook.com/v18.0/me/messages
            // Usando o mesmo pipeline Groq de lib/whatsapp/service.ts

            // Analytics: Instagram
            await logConversationStart(fromId, 'instagram');
          }
        }
      }
      return NextResponse.json({ success: true });
    }
    return new NextResponse("Not Found", { status: 404 });
  } catch (err) {
    console.error("[Instagram Webhook] Erro:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
