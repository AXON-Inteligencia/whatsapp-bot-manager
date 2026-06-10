import { NextRequest, NextResponse } from "next/server"
import { findUserByEmail, insertUser } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, plan, paymentStatus } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 })
    }

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "Este email já está em uso." }, { status: 400 })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await insertUser({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      plan: plan || "free",
      paymentStatus: paymentStatus || "pending"
    })

    // Remove password before returning
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error: any) {
    console.error("[Register API Error]:", error)
    return NextResponse.json({ error: "Erro interno no servidor ao criar conta." }, { status: 500 })
  }
}
