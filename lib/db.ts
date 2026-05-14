import { sql } from "@vercel/postgres"
import { User } from "./types"
import bcrypt from "bcryptjs"

// Função para inicializar o banco de dados se necessário
export const initDB = async () => {
  try {
    // CORREÇÃO: Usar SERIAL para o ID para garantir autoincremento se a tabela for criada do zero
    // E garantir que a coluna ID seja compatível com o que o banco espera.
    // Como o Postgres da Vercel é usado, SERIAL é o padrão para autoincremento.
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      );
    `;

    // Garantir que o admin padrão existe e está atualizado
    const adminPassword = process.env.ADMIN_PASSWORD || 'Axon@2026';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    console.log("Iniciando initDB...");
    const { rows } = await sql`SELECT * FROM users WHERE email = 'admin@axonflow.local' LIMIT 1;`
    
    if (rows.length === 0) {
      console.log("Criando usuário admin padrão...");
      await sql`
        INSERT INTO users (name, email, password, role)
        VALUES ('Administrador', 'admin@axonflow.local', ${hashedPassword}, 'admin');
      `;
    } else {
      console.log("Atualizando usuário admin padrão...");
      await sql`
        UPDATE users 
        SET password = ${hashedPassword}, role = 'admin' 
        WHERE email = 'admin@axonflow.local';
      `;
    }
    console.log("initDB concluído com sucesso.");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

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
    const { name, email, password, role } = userData
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // CORREÇÃO: Removido o ID da inserção para usar o autoincremento do banco
    const { rows } = await sql`
      INSERT INTO users (name, email, password, role)
      VALUES (${name}, ${email}, ${hashedPassword}, ${role})
      RETURNING id, name, email, role;
    `
    return rows[0] as User
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
