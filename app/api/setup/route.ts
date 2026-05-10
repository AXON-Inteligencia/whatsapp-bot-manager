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
    // Usamos uma query separada para garantir a criação antes da consulta
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL
        );
      `;
    } catch (e) {
      console.error("Erro ao criar tabela:", e);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedEmail = email.trim().toLowerCase();

    // Verifica se já existe algum usuário
    const result = await sql`SELECT id FROM users LIMIT 1`;
    const rows = result.rows || [];
    
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
