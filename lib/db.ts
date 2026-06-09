import { Pool } from "pg"

// Criando pool de conexão universal (funciona com Render, Supabase, Neon, AWS, etc)
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL && !process.env.POSTGRES_URL.includes("localhost") 
    ? { rejectUnauthorized: false } 
    : undefined
})

export const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  const queryText = strings.reduce((prev, curr, i) => prev + curr + (i < values.length ? `$${i + 1}` : ""), "")
  const client = await pool.connect()
  try {
    const result = await client.query(queryText, values)
    return result
  } finally {
    client.release()
  }
}
import { User } from "./types"
import bcrypt from "bcryptjs"

type IdColumnKind = "numeric" | "text" | "unknown"

const DEFAULT_ADMIN_EMAIL = "admin@axonflow.local"
const DEFAULT_ADMIN_PASSWORD = "Axon@2026"
const LEGACY_ADMIN_EMAILS = [
  "admin@botmanager.local",
  "admin@axoninteligencia.com.br",
]

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const generateUserId = () => `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

async function getUserIdColumnKind(): Promise<IdColumnKind> {
  try {
    const { rows } = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name = 'id'
      LIMIT 1;
    `

    const dataType = String(rows[0]?.data_type || "").toLowerCase()

    if (["integer", "bigint", "smallint", "numeric"].includes(dataType)) {
      return "numeric"
    }

    if (["text", "character varying", "uuid"].includes(dataType)) {
      return "text"
    }

    return "unknown"
  } catch (error) {
    console.error("Erro ao verificar tipo da coluna users.id:", error)
    return "unknown"
  }
}

async function insertUser(params: {
  id?: string
  name: string
  email: string
  password: string
  role: "admin" | "user"
}): Promise<User> {
  const idKind = await getUserIdColumnKind()
  const normalizedEmail = normalizeEmail(params.email)

  if (idKind === "numeric") {
    const { rows } = await sql`
      INSERT INTO users (name, email, password, role)
      VALUES (${params.name}, ${normalizedEmail}, ${params.password}, ${params.role})
      RETURNING id, name, email, password, role;
    `
    return rows[0] as User
  }

  const id = params.id || generateUserId()
  const { rows } = await sql`
    INSERT INTO users (id, name, email, password, role)
    VALUES (${id}, ${params.name}, ${normalizedEmail}, ${params.password}, ${params.role})
    RETURNING id, name, email, password, role;
  `
  return rows[0] as User
}

async function upsertAdmin(email: string, passwordHash: string) {
  const normalizedEmail = normalizeEmail(email)
  const existing = await findUserByEmail(normalizedEmail)

  if (existing) {
    await sql`
      UPDATE users
      SET name = 'Administrador', password = ${passwordHash}, role = 'admin'
      WHERE email = ${normalizedEmail};
    `
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

// Função para inicializar o banco de dados se necessário.
export const initDB = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );
  `

  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL)
  const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  await upsertAdmin(adminEmail, hashedPassword)

  // Mantém compatibilidade com credenciais antigas documentadas no projeto e com o placeholder da tela de login.
  // Para desativar estes aliases, defina DISABLE_LEGACY_ADMIN_ALIASES=true no ambiente.
  if (process.env.DISABLE_LEGACY_ADMIN_ALIASES !== "true") {
    for (const legacyEmail of LEGACY_ADMIN_EMAILS) {
      if (normalizeEmail(legacyEmail) !== adminEmail) {
        await upsertAdmin(legacyEmail, hashedPassword)
      }
    }
  }
}

export const getUsers = async (): Promise<User[]> => {
  try {
    const { rows } = await sql`SELECT id, name, email, role FROM users ORDER BY id DESC;`
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

export const addUser = async (userData: Omit<User, "id">): Promise<User | undefined> => {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    return await insertUser({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
    })
  } catch (error) {
    console.error("Erro ao adicionar usuário:", error)
    return undefined
  }
}

export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    await sql`DELETE FROM users WHERE id = ${id};`
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
