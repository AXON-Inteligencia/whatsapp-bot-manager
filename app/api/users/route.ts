import { NextResponse } from "next/server"
import { addUser, getUsers } from "@/lib/db"

export async function GET() {
  const users = getUsers()
  return NextResponse.json(
    users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }))
  )
}

export async function POST(req: Request) {
  const body = await req.json()
  const name = body?.name?.toString()?.trim()
  const email = body?.email?.toString()?.trim()
  const password = body?.password?.toString()?.trim()

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Nome, email e senha são obrigatórios." },
      { status: 400 }
    )
  }

  try {
    const newUser = addUser({
      name,
      email,
      password,
      role: "user",
    })

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao criar usuário." },
      { status: 400 }
    )
  }
}
