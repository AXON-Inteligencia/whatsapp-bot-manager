import { NextResponse } from "next/server"
import { authenticateUser } from "@/lib/db"

export async function POST(req: Request) {
  const body = await req.json()
  const email = body?.email?.toString()?.trim()
  const password = body?.password?.toString()?.trim()

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email e senha são obrigatórios." },
      { status: 400 }
    )
  }

  const user = await authenticateUser(email, password)
  if (!user) {
    return NextResponse.json(
      { error: "Credenciais inválidas. Verifique email e senha." },
      { status: 401 }
    )
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
}
