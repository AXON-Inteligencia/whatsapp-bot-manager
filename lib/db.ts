import fs from "fs"
import path from "path"
import { User } from "./types"

const DB_DIR = path.join(process.cwd(), "data")
const DB_FILE = path.join(DB_DIR, "db.json")

const defaultUsers: User[] = [
  {
    id: "user-1",
    name: "Administrador",
    email: "admin@botmanager.local",
    password: "admin123",
    role: "admin",
  },
]

interface DbSchema {
  users: User[]
}

const ensureDb = () => {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: defaultUsers }, null, 2), "utf8")
  }
}

const readDb = (): DbSchema => {
  ensureDb()
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DbSchema
}

const writeDb = (data: DbSchema) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8")
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const getUsers = (): User[] => {
  return readDb().users
}

export const findUserByEmail = (email: string): User | undefined => {
  return getUsers().find((user) => user.email === normalizeEmail(email))
}

export const addUser = (userData: Omit<User, "id">): User => {
  const users = getUsers()
  const email = normalizeEmail(userData.email)

  if (users.some((user) => user.email === email)) {
    throw new Error("Email já cadastrado")
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: userData.name,
    email,
    password: userData.password,
    role: userData.role,
  }

  users.push(newUser)
  writeDb({ users })
  return newUser
}

export const authenticateUser = (email: string, password: string): User | null => {
  const user = findUserByEmail(email)
  if (!user || user.password !== password) {
    return null
  }
  return user
}
