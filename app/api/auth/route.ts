import { NextRequest, NextResponse } from "next/server"
import { authenticateUser, initDB } from "@/lib/db"
import { SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'axon-inteligencia-secret-key-2024'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email?.trim()
    const password = body.password?.trim()

    // Para testes locais sem Postgres configurado:
    if (email === "admin@axonflow.local" && password === "Axon@2026") {
      const user = {
        id: "local-admin",
        name: "Administrador (Local)",
        email: "admin@axonflow.local",
        role: "admin",
      }

      const token = await new SignJWT({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET)

      const response = NextResponse.json({
        message: "Login realizado com sucesso",
        user
      })

      response.cookies.set('axon-auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 horas
        path: '/',
      })

      return response
    }

    try {
      await initDB()
    } catch (dbError) {
      console.error("Erro ao inicializar DB:", dbError)
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Gerar Token JWT
    const token = await new SignJWT({ 
      id: user.id, 
      email: user.email, 
      role: user.role 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    // Criar resposta com o usuário (sem senha)
    const { password: _, ...safeUser } = user
    const response = NextResponse.json({
      message: "Login realizado com sucesso",
      user: safeUser
    })

    // Configurar Cookie Seguro
    response.cookies.set('axon-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    })

    return response
  } catch (error) {
    console.error("Erro na autenticação:", error)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
