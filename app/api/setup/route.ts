import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }

    // Cria a tabela se não existir (alinhado com lib/db.ts)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      );
    `;

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedEmail = email.trim().toLowerCase();

    // Verifica se o admin padrão ou qualquer usuário existe
    const { rows } = await sql`SELECT * FROM users LIMIT 1`;
    
    if (rows.length > 0) {
      // Atualiza o primeiro usuário encontrado para ser o novo admin
      await sql`
        UPDATE users 
        SET email = ${normalizedEmail}, password = ${hashedPassword}, name = 'Administrador', role = 'admin'
        WHERE id = ${rows[0].id}
      `;
    } else {
      // Cria o primeiro administrador
      const id = `user-admin-${Date.now()}`;
      await sql`
        INSERT INTO users (id, name, email, password, role) 
        VALUES (${id}, 'Administrador', ${normalizedEmail}, ${hashedPassword}, 'admin')
      `;
    }

    return NextResponse.json({ message: "Administrador configurado com sucesso" });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Erro ao configurar banco de dados: " + error.message }, { status: 500 });
  }
}
