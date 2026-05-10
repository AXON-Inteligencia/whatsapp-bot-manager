import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

async function isAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
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

    // Verificar se usuário já existe
    const { rows: existing } = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || "user";

    await sql`
      INSERT INTO users (name, email, password, role)
      VALUES (${name}, ${email}, ${hashedPassword}, ${userRole})
    `;

    return NextResponse.json({ message: "Usuário criado com sucesso" }, { status: 201 });
  } catch (error: any) {
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

    if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

    await sql`DELETE FROM users WHERE id = ${id}`;
    return NextResponse.json({ message: "Usuário removido com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { id, name, email, role, password } = await request.json();

    if (!id || !name || !email) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await sql`
        UPDATE users 
        SET name = ${name}, email = ${email}, role = ${role}, password = ${hashedPassword}
        WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE users 
        SET name = ${name}, email = ${email}, role = ${role} 
        WHERE id = ${id}
      `;
    }
    
    return NextResponse.json({ message: "Usuário atualizado com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
