import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// Importação fictícia da fila, ajuste conforme a sua implementação real de background jobs (BullMQ etc)
// import { messageQueue } from '@/lib/queue';

export async function POST(req: Request) {
  try {
    const { leadIds, templateMsg, sessionId } = await req.json();

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

    for (const lead of leads) {
      // Monta a mensagem final trocando as variáveis
      const msgFinal = templateMsg
        .replace(/{nome_socio}/g, lead.nome_socio || 'Responsável')
        .replace(/{nome_empresa}/g, lead.nome_empresa)
        .replace(/{cidade}/g, lead.localidade);

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
