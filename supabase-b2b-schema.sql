-- Enum para o Status do Disparo
CREATE TYPE status_disparo_lead AS ENUM ('PENDENTE', 'EM_FILA', 'ENVIADO', 'ERRO');

-- Tabela para armazenar os Leads B2B Extraídos
CREATE TABLE leads_b2b (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Referência ao ID do usuário do sistema (Tenant)
    nicho_busca TEXT NOT NULL,
    nome_empresa TEXT NOT NULL,
    nome_socio TEXT,
    whatsapp TEXT NOT NULL,
    localidade TEXT NOT NULL,
    status_disparo status_disparo_lead DEFAULT 'PENDENTE'::status_disparo_lead NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para otimizar as buscas no Painel e na Fila de Disparos
CREATE INDEX idx_leads_b2b_user_id ON leads_b2b(user_id);
CREATE INDEX idx_leads_b2b_status ON leads_b2b(status_disparo);
CREATE INDEX idx_leads_b2b_nicho ON leads_b2b(nicho_busca);

-- Configurações de RLS (Row Level Security) para segurança (opcional, se ativado no projeto)
ALTER TABLE leads_b2b ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Usuário só pode ver/modificar seus próprios leads
CREATE POLICY "Users can manage their own leads" ON leads_b2b
    FOR ALL
    USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
