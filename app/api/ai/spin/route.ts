import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { botId, message } = await req.json();

    if (!botId || !message) {
      return NextResponse.json({ error: 'Faltam parâmetros' }, { status: 400 });
    }

    const { data: bot, error } = await supabase.from('bots').select('*').eq('id', botId).single();

    if (!bot || !bot.aiSettings?.apiKey) {
      return NextResponse.json({ error: 'Chave do Groq Cloud não configurada no bot' }, { status: 400 });
    }

    const groq = new Groq({ apiKey: bot.aiSettings.apiKey.trim() });

    const systemPrompt = `Você é um gerador automático de Spin Syntax Anti-Ban para disparos de WhatsApp. 
O usuário fornecerá uma mensagem padrão. Sua tarefa é reescrever essa mensagem de uma forma LEVEMENTE diferente para que cada cliente receba um texto único, evitando que o WhatsApp detecte como SPAM.
REGRAS:
1. Mantenha exatamente o mesmo sentido e as mesmas informações (links, valores, ofertas).
2. Não adicione saudações como "Olá" se não tiver na mensagem original.
3. Não adicione aspas. Retorne APENAS o texto reescrito.
4. Mude sinônimos, a ordem das palavras ou os emojis levemente.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_completion_tokens: 1024,
    });

    const spunMessage = chatCompletion.choices[0]?.message?.content || message;

    return NextResponse.json({ success: true, message: spunMessage.trim() });
  } catch (error: any) {
    console.error('[AISpin] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
