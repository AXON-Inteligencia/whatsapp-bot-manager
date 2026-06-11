import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { addUser, deleteUser, getUsers, initDB } from "@/lib/db"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "axon-inteligencia-secret-key-2024"

async function isAdmin() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("axon-auth-token")?.value
    if (!token) return false

    const decoded: any = jwt.verify(token, JWT_SECRET)
    return decoded.role === "admin"
  } catch {
    return false
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  try {
    await initDB()
    const users = await getUsers()
    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  try {
    await initDB()
    const { name, email, password, role } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    const createdUser = await addUser({
      name,
      email,
      password,
      role: role === "admin" ? "admin" : "user",
    })

    if (!createdUser) {
      return NextResponse.json({ error: "Erro ao criar usuário ou email já existe" }, { status: 500 })
    }

    const { password: _, ...safeUser } = createdUser
    return NextResponse.json(safeUser)
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  try {
    await initDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 })
    }

    const deleted = await deleteUser(id)
    if (!deleted) {
      return NextResponse.json({ error: "Erro ao deletar usuário" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  try {
    const { id, name, email, role, plan, paymentStatus, password } = await request.json()

    if (!id || !name || !email) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    const updateData: any = { 
      name, 
      email: email.trim().toLowerCase(), 
      role, 
      plan,
      payment_status: paymentStatus 
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: "Erro ao atualizar usuário no Supabase" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
