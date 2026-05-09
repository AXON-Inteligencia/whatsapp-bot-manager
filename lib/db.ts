import { sql } from "@vercel/postgres"
import { User } from "./types"

// Função para inicializar o banco de dados se necessário
export const initDB = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      );
    `
    
    // Verificar se o admin padrão existe
    const { rows } = await sql`SELECT * FROM users WHERE email = 'admin@axonflow.local' LIMIT 1;`
    if (rows.length === 0) {
      await sql`
        INSERT INTO users (id, name, email, password, role)
        VALUES ('user-admin', 'Administrador', 'admin@axonflow.local', 'admin123', 'admin');
      `
    }
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const getUsers = async (): Promise<User[]> => {
  try {
    const { rows } = await sql`SELECT id, name, email, role FROM users;`
    return rows as User[]
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return []
  }
}

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  try {
    const normalizedEmail = normalizeEmail(email)
    const { rows } = await sql`SELECT * FROM users WHERE email = ${normalizedEmail} LIMIT 1;`
    return rows[0] as User | undefined
  } catch (error) {
    console.error("Erro ao buscar usuário por email:", error)
    return undefined
  }
}

export const addUser = async (userData: Omit<User, "id">): Promise<User> => {
  const email = normalizeEmail(userData.email)
  const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    await sql`
      INSERT INTO users (id, name, email, password, role)
      VALUES (${id}, ${userData.name}, ${email}, ${userData.password}, ${userData.role});
    `
    return { id, ...userData, email }
  } catch (error) {
    console.error("Erro ao adicionar usuário:", error)
    throw new Error("Erro ao cadastrar usuário ou email já existe")
  }
}

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  const user = await findUserByEmail(email)
  if (!user || user.password !== password) {
    return null
  }
  return user
}
