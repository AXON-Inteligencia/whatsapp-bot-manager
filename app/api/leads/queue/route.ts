import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Groq from 'groq-sdk';
// Importação fictícia da fila, ajuste conforme a sua implementação real de background jobs (BullMQ etc)
// import { messageQueue } from '@/lib/queue';

export async function POST(req: Request) {
  try {
    const { leadIds, templateMsg, sessionId, useAI } = await req.json();

    if (!leadIds || leadIds.length === 0 || !templateMsg || !sessionId) {
      return NextResponse.json({ success: false, error: 'Dados insuficientes para enfileirar' }, { status: 400 });
    }

    // Busca os leads no banco
    const { data: leads, error } = await supabase
      .from('leads_b2b')
      .select('*')
      .in('id', leadIds);

    if (error) throw error;

    let queuedCount = 0;

    // Inicializa a Groq apenas se for usar IA
    let groq: any = null;
    if (useAI && process.env.GROQ_API_KEY) {
      groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    for (const lead of leads) {
      // Monta a mensagem final trocando as variáveis
      let msgFinal = templateMsg
        .replace(/{nome_socio}/g, lead.nome_socio || 'Responsável')
        .replace(/{nome_empresa}/g, lead.nome_empresa)
        .replace(/{cidade}/g, lead.localidade);

      // Se a IA estiver ativada, reescreve a mensagem
      if (useAI && groq) {
        try {
          const aiResponse = await groq.chat.completions.create({
            messages: [
              {
                role: "system",
                content: "Você é um SDR B2B (Especialista em Vendas) humano. Seu trabalho é pegar a mensagem base fornecida e reescrevê-line para soar como se fosse escrita por um humano real no WhatsApp, sendo amigável e direto. Aja como alguém que achou a empresa no mapa. NUNCA pareça um robô. Mantenha curta, no máximo 3 frases."
              },
              {
                role: "user",
                content: `Reescreva esta abordagem de prospecção para ${lead.nome_socio || 'o dono'} da ${lead.nome_empresa}: "${msgFinal}"`
              }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            max_tokens: 150,
          });
          
          if (aiResponse.choices[0]?.message?.content) {
            msgFinal = aiResponse.choices[0].message.content.trim();
          }
        } catch (aiError) {
          console.error(`[Queue] Erro na IA para ${lead.nome_empresa}:`, aiError);
          // Fallback silencioso: se a IA falhar, manda a mensagem padrão
        }
      }

      // Salva no Redis que este número é um Lead Outbound (para a IA interceptar se ele responder)
      // Usaremos validade de 7 dias (604800 segundos)
      try {
        const { redis } = require('@/lib/redis'); // Require dinâmico para evitar problemas de dependência circular na API route
        await redis.set(`outbound:${lead.whatsapp}`, 'true', 'EX', 604800);
      } catch (redisErr) {
        console.error(`[Queue] Erro ao salvar flag outbound no Redis para ${lead.whatsapp}:`, redisErr);
      }

      // Aqui entra a injeção na fila do Baileys
      // Exemplo:
      // await messageQueue.add('send-whatsapp', { phone: lead.whatsapp, message: msgFinal, sessionId });
      
      // Simulação para o teste
      console.log(`[Queue] Lead ${lead.nome_empresa} adicionado à fila: ${msgFinal}`);

      // Atualiza o status no banco
      await supabase
        .from('leads_b2b')
        .update({ status_disparo: 'EM_FILA' })
        .eq('id', lead.id);

      queuedCount++;
    }

    return NextResponse.json({ success: true, queued: queuedCount });
  } catch (error: any) {
    console.error('[Leads Queue] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
