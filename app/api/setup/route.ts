import { NextRequest, NextResponse } from "next/server"
import { initDB } from "@/lib/db"
import { sql } from "@vercel/postgres"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    console.log("Iniciando Setup forçado via GET...")
    
    // 1. Tentar inicializar tabelas
    await initDB()
    
    // 2. Criar admin manualmente para garantir
    const adminPassword = 'Axon@2026'
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    
    await sql`
      INSERT INTO users (id, name, email, password, role)
      VALUES ('user-admin-manual', 'Administrador', 'admin@axonflow.local', ${hashedPassword}, 'admin')
      ON CONFLICT (email) DO UPDATE 
      SET password = ${hashedPassword}, role = 'admin';
    `
    
    return NextResponse.json({ 
      status: "success", 
      message: "Banco de dados inicializado e admin criado/atualizado.",
      credentials: {
        email: "admin@axonflow.local",
        password: adminPassword
      }
    })
  } catch (error: any) {
    console.error("Erro no setup:", error)
    return NextResponse.json({ 
      status: "error", 
      message: error.message,
      stack: error.stack,
      env_check: {
        has_url: !!process.env.POSTGRES_URL,
        url_start: process.env.POSTGRES_URL?.substring(0, 15)
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Manter compatibilidade se necessário
  return NextResponse.json({ message: "Use GET para configurar o admin." })
}
