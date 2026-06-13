-- Criação da tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  plan TEXT DEFAULT 'free',
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de Bots (Instâncias do WhatsApp)
CREATE TABLE IF NOT EXISTS bots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number TEXT,
  phone TEXT,
  status TEXT DEFAULT 'offline',
  messages INTEGER DEFAULT 0,
  uptime TEXT DEFAULT '0%',
  description TEXT,
  "aiSettings" JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir o administrador padrão (a senha é o hash de 'Axon@2026')
INSERT INTO users (id, name, email, password, role, plan, payment_status)
VALUES (
  'user-admin', 
  'Administrador', 
  'admin@axonflow.local', 
  '$2a$10$wN8Z3E3P0.yB6v0g3eP0f.Pz.Q.t6yP/G/F4tTz7.b4l9g3h1rJ3i', 
  'admin', 
  'enterprise', 
  'paid'
) ON CONFLICT (email) DO NOTHING;
