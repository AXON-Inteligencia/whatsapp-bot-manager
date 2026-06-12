import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { botId, prompt } = await req.json();

    if (!botId || !prompt) {
      return NextResponse.json({ error: 'Faltam parâmetros' }, { status: 400 });
    }

    const { data: bot, error } = await supabase.from('bots').select('*').eq('id', botId).single();

    console.log('[AICopy] Bot fetched from DB:', JSON.stringify(bot));

    if (!bot || !bot.aiSettings?.apiKey) {
      console.log('[AICopy] Missing aiSettings or apiKey!', bot?.aiSettings);
      return NextResponse.json({ error: 'Chave do Groq Cloud não configurada no bot' }, { status: 400 });
    }

    const groq = new Groq({ apiKey: bot.aiSettings.apiKey.trim() });

    const systemPrompt = `Você é um Copywriter Especialista em WhatsApp Marketing.
O usuário vai descrever o que ele quer vender ou avisar. Sua tarefa é escrever UMA única mensagem persuasiva pronta para ser enviada por WhatsApp.
REGRAS:
1. Use gatilhos mentais (escassez, urgência, curiosidade).
2. Seja direto e não muito longo (pessoas não leem textões no WhatsApp).
3. Use emojis de forma moderada.
4. Inclua uma chamada para ação (Call to Action) no final, ex: "Responda EU QUERO para garantir".
5. Retorne APENAS o texto da mensagem, sem aspas, sem explicações.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_completion_tokens: 1024,
    });

    const copy = chatCompletion.choices[0]?.message?.content || "";

    return NextResponse.json({ success: true, copy: copy.trim() });
  } catch (error: any) {
    console.error('[AICopy] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
