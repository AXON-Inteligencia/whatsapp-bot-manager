# AxonFlow - Plataforma SaaS de Marketing e Prospecção no WhatsApp

> **Status**: ✅ Funcional | **Versão**: 1.0.0 | **Última Atualização**: 2024-05-10

Uma plataforma moderna e completa para gerenciar bots de WhatsApp, enviar campanhas em massa, extrair dados de grupos e automatizar prospecção.

---

## 🎯 Características Principais

### ✅ Gerenciamento de Bots
- Conexão via QR Code em tempo real
- Status de conexão sincronizado
- Múltiplos bots simultâneos
- Reconexão automática

### ✅ Envio de Mensagens
- Mensagens individuais
- Campanhas em massa
- Suporte a mídia (imagens, documentos, áudio, vídeo)
- Motor anti-ban com delays variáveis
- Fila de processamento com BullMQ

### ✅ Extração de Dados
- Busca de grupos
- Extração de membros
- Exportação para CSV
- Obtenção de links de convite
- Importação de contatos

### ✅ Segurança
- Rate limiting
- Validação de entrada
- Tratamento centralizado de erro
- Autenticação JWT (em implementação)

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- npm ou pnpm
- Conta Upstash Redis (gratuita)
- Conta Vercel (opcional, para deploy)

### Instalação Local

```bash
# 1. Clonar repositório
git clone https://github.com/AXON-Inteligencia/whatsapp-bot-manager.git
cd whatsapp-bot-manager

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local

# 4. Editar .env.local com suas credenciais
# UPSTASH_REDIS_REST_URL=https://...
# UPSTASH_REDIS_REST_TOKEN=...

# 5. Executar em desenvolvimento
npm run dev

# 6. Acessar
# http://localhost:3000
```

### Credenciais Padrão (Desenvolvimento)

- **Email**: `admin@botmanager.local`
- **Senha**: `admin123`

---

## 📚 Documentação

### Guias Principais

1. **[TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md)** - Arquitetura e documentação técnica
2. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Status e próximos passos
3. **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testes de integração

### Documentação de API

#### Autenticação
```bash
POST /api/auth/login
POST /api/auth/logout
```

#### WhatsApp
```bash
POST /api/whatsapp/connect        # Conectar bot via QR Code
GET  /api/whatsapp/qr             # Obter QR Code e status
POST /api/whatsapp/disconnect     # Desconectar bot
POST /api/whatsapp/send           # Enviar mensagem individual
POST /api/whatsapp/bulk-send      # Enviar campanha em massa
GET  /api/whatsapp/groups         # Listar grupos
POST /api/whatsapp/groups         # Extrair membros de grupo
POST /api/whatsapp/groups/link    # Obter link de convite
```

#### Contatos
```bash
GET  /api/contacts                # Listar contatos
POST /api/contacts                # Criar contato
POST /api/contacts/import-from-group  # Importar de grupo
```

---

## 🏗️ Arquitetura

### Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| UI | Radix UI + shadcn/ui + Tailwind CSS |
| State | Zustand |
| Backend | Next.js API Routes |
| WhatsApp | Baileys |
| Queue | BullMQ |
| Cache/Session | Upstash Redis |
| Database | Vercel Postgres |

### Fluxo de Dados

```
┌─────────────────┐
│  React Frontend │
└────────┬────────┘
         │ HTTP
┌────────▼────────┐
│  API Routes     │
└────────┬────────┘
         │
    ┌────┴────┐
    │          │
┌───▼──┐  ┌──▼────┐
│Redis │  │Baileys│
└──────┘  └───────┘
```

---

## 🔧 Configuração Avançada

### Variáveis de Ambiente

```bash
# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://[user]:[password]@[host]:[port]
UPSTASH_REDIS_REST_TOKEN=[token]

# Banco de Dados (Vercel Postgres)
POSTGRES_URLPGSQL=postgresql://[connection-string]

# Segurança
JWT_SECRET=your-secret-key-change-in-production

# Desenvolvimento
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Configuração de Rate Limiting

No arquivo `lib/middleware/auth.ts`:

```typescript
checkRateLimit(ip, limit = 100, windowMs = 60000)
// Padrão: 100 requisições por minuto
```

---

## 📊 Monitoramento

### Métricas Importantes

```bash
# Bots online
GET /api/metrics/bots-online

# Mensagens enviadas
GET /api/metrics/messages-sent

# Fila de processamento
GET /api/metrics/queue-status

# Taxa de erro
GET /api/metrics/error-rate
```

### Logs

Todos os eventos são registrados em:
- Console (desenvolvimento)
- Vercel Logs (produção)
- Redis (histórico)

---

## 🚀 Deployment

### Deploy na Vercel (Recomendado)

```bash
# 1. Conectar repositório GitHub
# 2. Configurar variáveis de ambiente
# 3. Deploy automático
```

### Deploy em Servidor Próprio

```bash
# Build
npm run build

# Iniciar
npm start

# Ou com PM2
pm2 start npm --name "axonflow" -- start
```

---

## 🐛 Troubleshooting

### Problema: Bot não conecta

**Solução**:
1. Verificar se o QR Code é válido
2. Certificar-se de que o WhatsApp está instalado
3. Verificar logs: `console.log` em `lib/whatsapp/service.ts`
4. Reiniciar a conexão

### Problema: Mensagens não são enviadas

**Solução**:
1. Verificar se o bot está online: `GET /api/whatsapp/qr?botId=...`
2. Validar número de telefone (formato internacional)
3. Verificar limite de taxa do WhatsApp
4. Verificar logs do worker BullMQ

### Problema: Redis não conecta

**Solução**:
1. Verificar credenciais do Upstash
2. Testar conexão: `curl https://[url]/ping`
3. Verificar firewall/VPN
4. Usar `REDIS_HOST` e `REDIS_PORT` para desenvolvimento local

---

## 📈 Performance

### Benchmarks

| Operação | Tempo Médio |
|----------|------------|
| Conectar bot | 2-3s |
| Enviar mensagem | 1-2s |
| Extrair 50 membros | 5-10s |
| Processar 100 mensagens | 5-10 min |

### Otimizações

- ✅ Fila de processamento com concorrência controlada
- ✅ Cache de grupos por 1 hora
- ✅ Pooling de conexões Redis
- ✅ Compressão de responses

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/sua-feature`
3. Commit suas mudanças: `git commit -m 'Adiciona feature'`
4. Push para a branch: `git push origin feature/sua-feature`
5. Abra um Pull Request

---

## 📄 Licença

MIT License - veja [LICENSE](./LICENSE) para detalhes

---

## 📞 Suporte

- **Issues**: https://github.com/AXON-Inteligencia/whatsapp-bot-manager/issues
- **Email**: support@axon.com.br
- **Documentação**: [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md)

---

## 🎉 Agradecimentos

- [Baileys](https://github.com/WhiskeySockets/Baileys) - Biblioteca WhatsApp
- [BullMQ](https://docs.bullmq.io/) - Fila de mensagens
- [Next.js](https://nextjs.org/) - Framework web
- [Upstash](https://upstash.com/) - Redis serverless

---

**Desenvolvido com ❤️ pela AXON Inteligência**

**Versão**: 1.0.0 | **Status**: ✅ Produção | **Última Atualização**: 2024-05-10
