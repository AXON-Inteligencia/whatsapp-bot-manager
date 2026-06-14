import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(req: Request) {
  try {
    const userId = "user-admin"; // Temporário, deve vir da sessão real
    
    // Deleta todos os leads desse usuário
    const { error } = await supabase
      .from('leads_b2b')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Tabela limpa com sucesso.' });
  } catch (error: any) {
    console.error('[Leads Clear] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
