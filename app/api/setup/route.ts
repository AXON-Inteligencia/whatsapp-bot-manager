import { NextResponse } from "next/navigation";
import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }

    // Cria a tabela se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Verifica se já existe um usuário
    const existingUser = await sql`SELECT * FROM users LIMIT 1`;
    
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser.rowCount > 0) {
      // Atualiza o administrador existente
      await sql`
        UPDATE users 
        SET email = ${email}, password = ${hashedPassword} 
        WHERE id = ${existingUser.rows[0].id}
      `;
    } else {
      // Cria o primeiro administrador
      await sql`
        INSERT INTO users (email, password) 
        VALUES (${email}, ${hashedPassword})
      `;
    }

    return NextResponse.json({ message: "Administrador configurado com sucesso" });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Erro ao configurar banco de dados" }, { status: 500 });
  }
}
