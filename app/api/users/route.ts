import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || 'axon-inteligencia-secret-key-2024';

async function isAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("axon-auth-token")?.value;
    if (!token) return false;
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.role === "admin";
  } catch {
    return false;
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { rows } = await sql`SELECT id, name, email, role FROM users ORDER BY id DESC`;
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { name, email, password, role } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // CORREÇÃO: Removido o campo 'id' do INSERT para permitir que o banco gere automaticamente
    // Se o banco não tiver autoincremento, esta query ainda pode falhar, mas é o primeiro passo correto no código.
    const result = await sql`
      INSERT INTO users (name, email, password, role)
      VALUES (${name}, ${email}, ${hashedPassword}, ${role || 'user'})
      RETURNING id, name, email, role
    `;

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    await sql`DELETE FROM users WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
