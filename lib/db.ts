import { User } from "./types"
import bcrypt from "bcryptjs"
import { supabase } from "./supabase"

const DEFAULT_ADMIN_EMAIL = "admin@axonflow.local"
const DEFAULT_ADMIN_PASSWORD = "Axon@2026"
const LEGACY_ADMIN_EMAILS = [
  "admin@botmanager.local",
  "admin@axoninteligencia.com.br",
]

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const generateUserId = () => `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

export async function insertUser(params: {
  id?: string
  name: string
  email: string
  password: string
  role: "admin" | "user"
  plan?: string
  paymentStatus?: string
}): Promise<User> {
  const normalizedEmail = normalizeEmail(params.email)
  const plan = params.plan || 'free'
  const paymentStatus = params.paymentStatus || 'pending'
  const id = params.id || generateUserId()

  const { data, error } = await supabase
    .from('users')
    .insert([{
      id,
      name: params.name,
      email: normalizedEmail,
      password: params.password,
      role: params.role,
      plan,
      payment_status: paymentStatus
    }])
    .select()
    .single()

  if (error) {
    console.error("Erro no insertUser:", error)
    throw error
  }

  // Map database column payment_status back to camelCase paymentStatus
  return { ...data, paymentStatus: data.payment_status } as User
}

async function upsertAdmin(email: string, passwordHash: string) {
  const normalizedEmail = normalizeEmail(email)
  const existing = await findUserByEmail(normalizedEmail)

  if (existing) {
    await supabase
      .from('users')
      .update({ name: 'Administrador', password: passwordHash, role: 'admin' })
      .eq('email', normalizedEmail)
    return
  }

  await insertUser({
    id: normalizedEmail === DEFAULT_ADMIN_EMAIL ? "user-admin" : `user-admin-${normalizedEmail.replace(/[^a-z0-9]/g, "-")}`,
    name: "Administrador",
    email: normalizedEmail,
    password: passwordHash,
    role: "admin",
  })
}

// Função para inicializar o banco de dados (criar tabela via Supabase RPC ou SQL injection, mas Supabase JS não cria tabela facilmente via REST API).
// Vamos criar a tabela users se não existir executando raw SQL via REST? O Supabase REST API não permite DDL.
// O ideal é assumir que criaremos a tabela via um script separado, mas vamos tentar ler, se falhar, avisamos para rodar o script no painel.
export const initDB = async () => {
  // Check if users table exists by doing a simple select
  const { error } = await supabase.from('users').select('id').limit(1)
  
  if (error && error.code === '42P01') {
    // Tabela não existe, a criação deve ser feita no SQL Editor do Supabase:
    console.error("ATENÇÃO: A tabela 'users' não existe no Supabase. Por favor, rode o script de criação no SQL Editor do painel do Supabase.")
  }

  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL)
  const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  // Try to upsert admin (it will fail if table doesn't exist, but that's fine, we log it above)
  try {
    await upsertAdmin(adminEmail, hashedPassword)

    if (process.env.DISABLE_LEGACY_ADMIN_ALIASES !== "true") {
      for (const legacyEmail of LEGACY_ADMIN_EMAILS) {
        if (normalizeEmail(legacyEmail) !== adminEmail) {
          await upsertAdmin(legacyEmail, hashedPassword)
        }
      }
    }
  } catch (e) {
    console.error("InitDB Admin Creation Failed:", e)
  }
}

export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, plan, payment_status')
      .order('id', { ascending: false })

    if (error) throw error

    return data.map(d => ({
      ...d,
      paymentStatus: d.payment_status
    })) as User[]
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return []
  }
}

export const getAdminStats = async () => {
  try {
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')

    const { count: activeSubscriptions } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'paid')

    return {
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      activeBots: activeSubscriptions || 0, // Simulando 1 bot por pagante
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas do admin:", error)
    return { totalUsers: 0, activeSubscriptions: 0, activeBots: 0 }
  }
}

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  try {
    const normalizedEmail = normalizeEmail(email)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (error || !data) return undefined

    return { ...data, paymentStatus: data.payment_status } as User
  } catch (error) {
    console.error("Erro ao buscar usuário por email:", error)
    return undefined
  }
}

export const addUser = async (userData: Omit<User, "id">): Promise<User | undefined> => {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    return await insertUser({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      plan: userData.plan,
      paymentStatus: userData.paymentStatus
    })
  } catch (error) {
    console.error("Erro ao adicionar usuário:", error)
    return undefined
  }
}

export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (error) {
    console.error("Erro ao deletar usuário:", error)
    return false
  }
}

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  const user = await findUserByEmail(email)
  if (!user?.password) return null

  const isPlainTextMatch = user.password === password
  const isBcryptHash = user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")
  const isHashMatch = isBcryptHash ? await bcrypt.compare(password, user.password) : false

  if (!isPlainTextMatch && !isHashMatch) {
    return null
  }

  return user
}
