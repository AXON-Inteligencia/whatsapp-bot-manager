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
      plan: plan || "starter",
      paymentStatus: paymentStatus || "pending"
    })

    // Remove password before returning
    const { password: _, ...userWithoutPassword } = user

    // Gerar Token JWT
    const { SignJWT } = await import("jose")
    const JWT_SECRET = new TextEncoder().encode(
      process.env.JWT_SECRET || 'axon-inteligencia-secret-key-2024'
    )
    
    const token = await new SignJWT({ 
      id: user.id, 
      email: user.email, 
      role: user.role,
      plan: user.plan,
      paymentStatus: user.paymentStatus
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    const response = NextResponse.json(userWithoutPassword, { status: 201 })
    
    response.cookies.set('axon-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error("[Register API Error]:", error)
    
    // Debug helper to check if env vars are loaded
    const debugUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "VAZIO_OU_UNDEFINED";
    const debugKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? "PREENCHIDA" : "VAZIA";
    
    return NextResponse.json({ 
      error: `Erro ao criar conta no Banco de Dados. Detalhes: ${error.message || JSON.stringify(error)}. [DEBUG INFO: URL_BANCO='${debugUrl}', CHAVE='${debugKey}']` 
    }, { status: 500 })
  }
}
