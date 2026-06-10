import { sql } from './db';
import { v4 as uuidv4 } from 'uuid';

export async function initAnalyticsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS conversation_logs (
        id UUID PRIMARY KEY,
        phone_number VARCHAR(255) NOT NULL,
        channel VARCHAR(50) NOT NULL,
        routed_to VARCHAR(50),
        message_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        resolved BOOLEAN DEFAULT false
      );
    `;
  } catch (err) {
    console.error('[Analytics] Erro ao criar tabela conversation_logs:', err);
  }
}

export async function logConversationStart(phoneNumber: string, channel: 'whatsapp' | 'instagram') {
  try {
    const id = uuidv4();
    await sql`
      INSERT INTO conversation_logs (id, phone_number, channel, message_count)
      VALUES (${id}, ${phoneNumber}, ${channel}, 1)
    `;
    return id;
  } catch (err) {
    console.error('[Analytics] Erro ao iniciar log:', err);
  }
}

export async function updateConversationMessage(phoneNumber: string) {
  try {
    // Atualiza a conversa mais recente desse numero não resolvida
    await sql`
      UPDATE conversation_logs
      SET message_count = message_count + 1, last_message_at = CURRENT_TIMESTAMP
      WHERE id = (
        SELECT id FROM conversation_logs 
        WHERE phone_number = ${phoneNumber} AND resolved = false
        ORDER BY created_at DESC LIMIT 1
      )
    `;
  } catch (err) {
    console.error('[Analytics] Erro ao atualizar log:', err);
  }
}

export async function updateConversationRoute(phoneNumber: string, route: 'sales' | 'support') {
  try {
    await sql`
      UPDATE conversation_logs
      SET routed_to = ${route}
      WHERE id = (
        SELECT id FROM conversation_logs 
        WHERE phone_number = ${phoneNumber} AND resolved = false
        ORDER BY created_at DESC LIMIT 1
      )
    `;
  } catch (err) {
    console.error('[Analytics] Erro ao atualizar rota:', err);
  }
}
