import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    // Verificar se a tabela de usuários existe e se há algum usuário
    const result = await sql`SELECT id FROM users LIMIT 1`;
    const rows = result.rows || [];
    
    const isSetupComplete = rows.length > 0;
    
    return NextResponse.json({ isSetupComplete });
  } catch (error) {
    // Se a tabela não existe, o setup não foi completado
    return NextResponse.json({ isSetupComplete: false });
  }
}
