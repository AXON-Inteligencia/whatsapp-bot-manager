# AxonFlow - Guia Técnico Completo

## 📋 Índice

1. [Arquitetura](#arquitetura)
2. [Configuração do Ambiente](#configuração-do-ambiente)
3. [Componentes Principais](#componentes-principais)
4. [Fluxos de Funcionamento](#fluxos-de-funcionamento)
5. [API Routes](#api-routes)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Arquitetura

### Stack Tecnológico

| Componente | Tecnologia | Versão |
|-----------|-----------|--------|
| Framework | Next.js | 16.2.4 |
| Linguagem | TypeScript | 5.7.3 |
| UI Components | Radix UI + shadcn/ui | Latest |
| State Management | Zustand | 5.0.13 |
| WhatsApp Bot | Baileys | 7.0.0-rc10 |
| Message Queue | BullMQ | Latest |
| Cache/Session | Upstash Redis | 1.38.0 |
| Database | Vercel Postgres | 0.10.0 |
| Styling | Tailwind CSS | 4.2.0 |

### Arquitetura de Camadas

```
┌─────────────────────────────────────────────┐
│          Frontend (Next.js Client)          │
│  - React Components (UI)                    │
│  - Zustand Store (State Management)         │
│  - Custom Hooks (useBotSync, etc)          │
└────────────────┬────────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────────┐
│       Next.js API Routes (Backend)          │
│  - /api/whatsapp/connect                    │
│  - /api/whatsapp/send                       │
│  - /api/whatsapp/bulk-send                  │
│  - /api/whatsapp/groups                     │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────┐  ┌───▼────┐  ┌───▼────┐
│ Baileys│  │ BullMQ │  │ Upstash│
│ Socket │  │ Queue  │  │ Redis  │
└────────┘  └────────┘  └────────┘
```

---

## Configuração do Ambiente

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# Upstash Redis (obrigatório para produção)
UPSTASH_REDIS_REST_URL=https://[user]:[password]@[host]:[port]
UPSTASH_REDIS_REST_TOKEN=[token]

# Opcional: Para desenvolvimento local com Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Vercel Postgres (para autenticação)
POSTGRES_URLPGSQL=postgresql://[connection-string]
```

### Instalação Local

```bash
# Clonar repositório
git clone https://github.com/AXON-Inteligencia/whatsapp-bot-manager.git
cd whatsapp-bot-manager

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

---

## Componentes Principais

### 1. WhatsAppService (`lib/whatsapp/service.ts`)

Gerencia todas as operações com WhatsApp via Baileys.

**Métodos principais:**

```typescript
// Conectar bot via QR Code
static async connect(
  botId: string,
  onQR: (qr: string) => void,
  onConnected: () => void
): Promise<Socket>

// Enviar mensagem de texto
static async sendMessage(
  botId: string,
  remoteJid: string,
  text: string
): Promise<Result>

// Enviar mensagem com mídia
static async sendMessageWithMedia(
  botId: string,
  remoteJid: string,
  caption: string,
  mediaUrl: string,
  mediaType: 'image' | 'document' | 'audio' | 'video'
): Promise<Result>

// Obter grupos do bot
static async getGroups(botId: string, query?: string): Promise<Group[]>

// Obter membros de um grupo
static async getGroupMembers(botId: string, groupId: string): Promise<Member[]>

// Obter status real do bot
static async getStatus(botId: string): Promise<'online' | 'offline' | 'connecting'>
```

### 2. Message Queue (`lib/queue/message-queue.ts`)

Sistema de fila com BullMQ para envio assíncrono de mensagens.

**Características:**

- Processamento assíncrono com concorrência controlada
- Retry automático com backoff exponencial
- Delays variáveis para evitar ban
- Suporte a mídia (imagens, documentos, áudio, vídeo)

**Funções principais:**

```typescript
// Adicionar mensagem individual à fila
export async function addMessageToQueue(
  botId: string,
  remoteJid: string,
  text: string,
  options?: {
    mediaUrl?: string
    mediaType?: 'image' | 'document' | 'audio' | 'video'
    delay?: number
    priority?: number
  }
): Promise<string>

// Adicionar campanha em massa à fila
export async function addBulkMessageJob(
  botId: string,
  contacts: string[],
  message: string,
  options?: {
    delayMs?: number
    mediaUrl?: string
    mediaType?: 'image' | 'document' | 'audio' | 'video'
  }
): Promise<string>

// Inicializar worker de processamento
export async function initializeMessageWorker()
export async function initializeBulkMessageWorker()
```

### 3. Redis Management (`lib/redis.ts`)

Gerencia conexões com Upstash Redis.

```typescript
// Cliente REST (para API Routes)
export const redisRest: Redis

// Cliente IORedis (para BullMQ)
export function getRedisIO(): IORedis
```

### 4. Custom Hooks (`hooks/use-bot-sync.ts`)

Hooks React para sincronização em tempo real.

```typescript
// Sincronizar status do bot com polling
export function useBotSync(botId: string | null, enabled: boolean = true)

// Conectar bot
export function useConnectBot()

// Desconectar bot
export function useDisconnectBot()
```

---

## Fluxos de Funcionamento

### Fluxo 1: Conectar Bot via QR Code

```
1. Usuário clica em "Conectar WhatsApp"
   ↓
2. Frontend chama POST /api/whatsapp/connect
   ↓
3. Backend inicia WhatsAppService.connect()
   ↓
4. Baileys gera QR Code
   ↓
5. QR Code é salvo no Redis com TTL de 90s
   ↓
6. Frontend faz polling em GET /api/whatsapp/qr a cada 3s
   ↓
7. Usuário escaneia QR Code com WhatsApp
   ↓
8. Baileys detecta conexão bem-sucedida
   ↓
9. Status é atualizado para "online" no Redis
   ↓
10. Frontend detecta status "online" e fecha diálogo
```

### Fluxo 2: Enviar Mensagem Individual

```
1. Usuário preenche formulário de mensagem
   ↓
2. Frontend chama POST /api/whatsapp/send
   ↓
3. Backend valida se bot está online
   ↓
4. Se useQueue=true:
   - Adiciona à fila BullMQ
   - Retorna jobId
   Senão:
   - Envia imediatamente via WhatsAppService
   ↓
5. Mensagem é entregue ao WhatsApp
   ↓
6. Resposta é retornada ao frontend
```

### Fluxo 3: Campanha em Massa com Anti-Ban

```
1. Usuário importa CSV com contatos
   ↓
2. Usuário configura:
   - Mensagem
   - Delay entre mensagens (3000-60000ms)
   - Inserir link a cada N mensagens
   ↓
3. Frontend chama POST /api/whatsapp/bulk-send
   ↓
4. Backend cria job no BullMQ com:
   - Lista de contatos
   - Delay variável (delay ± 30%)
   - Configurações de retry
   ↓
5. Worker processa contatos sequencialmente:
   - Aguarda delay aleatório
   - Envia mensagem
   - Registra resultado
   - Atualiza progresso
   ↓
6. Campanha concluída com relatório
```

### Fluxo 4: Extração de Grupos

```
1. Usuário seleciona bot online
   ↓
2. Frontend chama GET /api/whatsapp/groups?botId=...&query=...
   ↓
3. Backend chama WhatsAppService.getGroups()
   ↓
4. Baileys retorna lista de grupos
   ↓
5. Resultado é cacheado no Redis por 1 hora
   ↓
6. Usuário seleciona grupo
   ↓
7. Frontend chama POST /api/whatsapp/groups
   ↓
8. Backend chama WhatsAppService.getGroupMembers()
   ↓
9. Membros são retornados e podem ser:
   - Exportados para CSV
   - Importados como contatos
   - Usados em campanhas
```

---

## API Routes

### Autenticação

Todas as rotas requerem que o bot esteja conectado (status = 'online').

### Rotas Disponíveis

#### 1. POST `/api/whatsapp/connect`

Inicia conexão de um bot via QR Code.

**Request:**
```json
{
  "botId": "bot-123"
}
```

**Response:**
```json
{
  "message": "Conexão iniciada, aguarde o QR Code",
  "status": "connecting",
  "botId": "bot-123"
}
```

#### 2. GET `/api/whatsapp/qr`

Obtém QR Code e status atual do bot.

**Query Parameters:**
- `botId` (required): ID do bot

**Response:**
```json
{
  "botId": "bot-123",
  "qr": "data:image/png;base64,...",
  "status": "connecting",
  "connectedAt": "2024-05-10T12:00:00Z",
  "timestamp": "2024-05-10T12:00:03Z"
}
```

#### 3. POST `/api/whatsapp/disconnect`

Desconecta um bot.

**Query Parameters:**
- `botId` (required): ID do bot

**Response:**
```json
{
  "message": "Bot desconectado com sucesso",
  "botId": "bot-123",
  "status": "offline"
}
```

#### 4. POST `/api/whatsapp/send`

Envia mensagem individual.

**Request:**
```json
{
  "botId": "bot-123",
  "phone": "5511999999999",
  "message": "Olá!",
  "mediaUrl": "https://...",
  "mediaType": "image",
  "useQueue": false
}
```

**Response:**
```json
{
  "message": "Mensagem enviada com sucesso",
  "phone": "5511999999999",
  "messageId": "msg-123",
  "sentAt": "2024-05-10T12:00:00Z"
}
```

#### 5. POST `/api/whatsapp/bulk-send`

Envia campanha em massa.

**Request:**
```json
{
  "botId": "bot-123",
  "contacts": ["5511999999999", "5511988888888"],
  "message": "Olá!",
  "delayMs": 3000,
  "useQueue": true
}
```

**Response (com fila):**
```json
{
  "message": "Campanha adicionada à fila",
  "jobId": "job-123",
  "total": 2,
  "status": "queued"
}
```

#### 6. GET `/api/whatsapp/groups`

Lista grupos do bot.

**Query Parameters:**
- `botId` (required): ID do bot
- `query` (optional): Termo de busca

**Response:**
```json
{
  "botId": "bot-123",
  "query": "",
  "total": 5,
  "groups": [
    {
      "id": "group-123@g.us",
      "name": "Vendas",
      "description": "Grupo de vendas",
      "participantCount": 45,
      "createdAt": "2024-01-01T00:00:00Z",
      "owner": "5511999999999@s.whatsapp.net"
    }
  ]
}
```

#### 7. POST `/api/whatsapp/groups`

Obtém membros de um grupo.

**Request:**
```json
{
  "botId": "bot-123",
  "groupId": "group-123@g.us"
}
```

**Response:**
```json
{
  "botId": "bot-123",
  "groupId": "group-123@g.us",
  "total": 45,
  "members": [
    {
      "id": "5511999999999@s.whatsapp.net",
      "phone": "5511999999999",
      "isAdmin": true,
      "role": "admin"
    }
  ]
}
```

---

## Deployment

### Deploy na Vercel

1. **Conectar repositório:**
   ```bash
   git push origin main
   ```

2. **Configurar variáveis de ambiente no Vercel:**
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `POSTGRES_URLPGSQL` (se usar autenticação)

3. **Deploy automático:**
   - Vercel fará build e deploy automaticamente

### Deploy em Servidor Próprio

```bash
# Build
npm run build

# Iniciar servidor
npm start

# Ou usar PM2 para produção
pm2 start npm --name "axonflow" -- start
```

---

## Troubleshooting

### Problema: Bot não conecta

**Solução:**
1. Verifique se o QR Code é válido
2. Certifique-se de que o WhatsApp está instalado no dispositivo
3. Verifique logs: `console.log` em `lib/whatsapp/service.ts`
4. Reinicie a conexão

### Problema: Mensagens não são enviadas

**Solução:**
1. Verifique se o bot está online: `GET /api/whatsapp/qr?botId=...`
2. Valide o número de telefone (deve estar no formato internacional)
3. Verifique se há limite de taxa do WhatsApp
4. Verifique logs do worker BullMQ

### Problema: Redis não conecta

**Solução:**
1. Verifique credenciais do Upstash
2. Teste conexão: `curl https://[url]/ping`
3. Verifique firewall/VPN
4. Use `REDIS_HOST` e `REDIS_PORT` para desenvolvimento local

### Problema: Fila não processa

**Solução:**
1. Verifique se o worker está rodando
2. Verifique logs do BullMQ
3. Reinicie o servidor
4. Limpe a fila: `await queue.clean(0, 'completed')`

---

## Monitoramento

### Métricas Importantes

- **Bots Online**: `await redis.get('status:botId')`
- **Mensagens Enviadas**: `await redis.llen('messages:botId')`
- **Campanhas**: `await redis.llen('campaigns:botId')`
- **Fila de Mensagens**: `await queue.count()`

### Logs

Todos os eventos importantes são registrados em:
- Console (desenvolvimento)
- Vercel Logs (produção)
- Redis (histórico de operações)

---

## Segurança

### Boas Práticas

1. **Credenciais:**
   - Nunca commit `.env.local`
   - Use variáveis de ambiente em produção
   - Rotacione tokens regularmente

2. **Rate Limiting:**
   - Implementar rate limiting nas API routes
   - Usar delays entre mensagens

3. **Validação:**
   - Validar todos os inputs
   - Sanitizar dados de usuários

4. **Autenticação:**
   - Implementar JWT para API
   - Proteger rotas sensíveis

---

## Suporte

Para dúvidas ou problemas:
- GitHub Issues: https://github.com/AXON-Inteligencia/whatsapp-bot-manager/issues
- Email: support@axon.com.br
