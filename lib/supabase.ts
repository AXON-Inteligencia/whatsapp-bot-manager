import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('[FATAL ERROR] Variável NEXT_PUBLIC_SUPABASE_URL está vazia ou não foi encontrada no Environment!');
}
if (!supabaseKey) {
  console.error('[FATAL ERROR] Variável SUPABASE_SERVICE_ROLE_KEY está vazia ou não foi encontrada no Environment!');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');
