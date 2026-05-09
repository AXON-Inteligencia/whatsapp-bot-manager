import { Redis } from "@upstash/redis"
import { User } from "./types"

// Fallback para desenvolvimento local
let redis: Redis | null = null

// Inicializar Redis apenas se as variáveis de ambiente estiverem disponíveis
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

const defaultUsers: User[] = [
  {
    id: "user-1",
    name: "Administrador",
    email: "admin@botmanager.local",
    password: "admin123",
    role: "admin",
  },
]

const USERS_KEY = "whatsapp-bot-manager:users"

// Função auxiliar para garantir que temos usuários padrão
const ensureDefaultUsers = async (): Promise<User[]> => {
  if (!redis) {
    // Desenvolvimento local - usar dados em memória
    return defaultUsers
  }

  try {
    const users = await redis.get<User[]>(USERS_KEY)
    if (!users || users.length === 0) {
      await redis.set(USERS_KEY, defaultUsers)
      return defaultUsers
    }
    return users
  } catch (error) {
    console.error("Erro ao acessar Redis:", error)
    return defaultUsers
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const getUsers = async (): Promise<User[]> => {
  if (!redis) {
    // Desenvolvimento local
    return defaultUsers
  }

  try {
    const users = await redis.get<User[]>(USERS_KEY)
    return users || await ensureDefaultUsers()
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return defaultUsers
  }
}

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const users = await getUsers()
  return users.find((user) => user.email === normalizeEmail(email))
}

export const addUser = async (userData: Omit<User, "id">): Promise<User> => {
  const users = await getUsers()
  const email = normalizeEmail(userData.email)

  if (users.some((user) => user.email === email)) {
    throw new Error("Email já cadastrado")
  }

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: userData.name,
    email,
    password: userData.password,
    role: userData.role,
  }

  const updatedUsers = [...users, newUser]

  if (redis) {
    try {
      await redis.set(USERS_KEY, updatedUsers)
    } catch (error) {
      console.error("Erro ao salvar usuário no Redis:", error)
      throw new Error("Erro interno do servidor")
    }
  }

  return newUser
}

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  const user = await findUserByEmail(email)
  if (!user || user.password !== password) {
    return null
  }
  return user
}
