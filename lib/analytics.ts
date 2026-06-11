import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export async function initAnalyticsTable() {
  // Em Supabase, recomendamos criar as tabelas via painel SQL.
  // Criaremos conversation_logs via script manual ou a própria API fará inserts simples se existir.
}

export async function logConversationStart(phoneNumber: string, channel: 'whatsapp' | 'instagram') {
  try {
    const id = uuidv4();
    await supabase.from('conversation_logs').insert([{
      id,
      phone_number: phoneNumber,
      channel,
      message_count: 1
    }]);
    return id;
  } catch (err) {
    console.error('[Analytics] Erro ao iniciar log:', err);
  }
}

export async function updateConversationMessage(phoneNumber: string) {
  try {
    // Para simplificar, em supabase buscaríamos o último e atualizaríamos
    const { data: logs } = await supabase
      .from('conversation_logs')
      .select('id, message_count')
      .eq('phone_number', phoneNumber)
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (logs && logs.length > 0) {
      const log = logs[0];
      await supabase
        .from('conversation_logs')
        .update({ 
          message_count: log.message_count + 1, 
          last_message_at: new Date().toISOString() 
        })
        .eq('id', log.id);
    }
  } catch (err) {
    console.error('[Analytics] Erro ao atualizar log:', err);
  }
}

export async function updateConversationRoute(phoneNumber: string, route: 'sales' | 'support') {
  try {
    const { data: logs } = await supabase
      .from('conversation_logs')
      .select('id')
      .eq('phone_number', phoneNumber)
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (logs && logs.length > 0) {
      await supabase
        .from('conversation_logs')
        .update({ routed_to: route })
        .eq('id', logs[0].id);
    }
  } catch (err) {
    console.error('[Analytics] Erro ao atualizar rota:', err);
  }
}
