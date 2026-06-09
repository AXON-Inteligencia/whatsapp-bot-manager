# AxonFlow - Guia de Testes

## 📋 Testes de Integração

### Teste 1: Fluxo Completo de Conexão

**Objetivo**: Validar que um bot pode se conectar via QR Code e ficar online.

**Passos**:
1. Acessar página de bots: `http://localhost:3000/bots`
2. Clicar em "Novo Bot"
3. Preencher:
   - Nome: "Bot Teste"
   - Telefone: "+55 11 99999-0000"
   - Descrição: "Bot para teste"
4. Clicar em "Criar bot"
5. No card do bot, clicar em "Conectar WhatsApp"
6. Aguardar QR Code aparecer
7. Escanear QR Code com WhatsApp
8. Verificar se status muda para "Online" ✅

**Esperado**:
- QR Code aparece em 2-3 segundos
- Status muda para "Online" após escanear
- Diálogo fecha automaticamente

**Troubleshooting**:
- Se QR Code não aparecer: Verificar logs do Baileys
- Se status não mudar: Verificar conexão com Redis

---

### Teste 2: Envio de Mensagem Individual

**Objetivo**: Validar que uma mensagem pode ser enviada para um contato.

**Pré-requisitos**:
- Bot conectado e online

**Passos**:
1. Acessar página de bots
2. No menu do bot, clicar em "Enviar Mensagem"
3. Preencher:
   - Telefone: "+55 11 98765-4321"
   - Mensagem: "Olá! Teste de mensagem"
4. Clicar em "Enviar"
5. Verificar resposta de sucesso ✅

**Esperado**:
- Toast de sucesso aparece
- Mensagem é entregue no WhatsApp
- Status muda para "sent"

**Troubleshooting**:
- Se falhar: Verificar se o bot está realmente online
- Se timeout: Verificar conexão com WhatsApp

---

### Teste 3: Campanha em Massa

**Objetivo**: Validar que uma campanha pode ser enviada para múltiplos contatos.

**Pré-requisitos**:
- Bot conectado e online
- Arquivo CSV com contatos

**Passos**:
1. Acessar página de campanhas: `http://localhost:3000/campaigns`
2. Selecionar bot online
3. Digitar mensagem: "Olá! Esta é uma campanha de teste"
4. Configurar:
   - Delay: 3000ms
   - Usar fila: Sim
5. Clicar em "Selecionar CSV"
6. Selecionar arquivo com 5-10 contatos
7. Clicar em "Iniciar Campanha"
8. Aguardar conclusão ✅

**Esperado**:
- Campanha é adicionada à fila
- Progresso é atualizado em tempo real
- Todas as mensagens são enviadas
- Relatório final mostra sucesso

**Troubleshooting**:
- Se fila não processa: Verificar worker do BullMQ
- Se progresso não atualiza: Verificar conexão com Redis

---

### Teste 4: Extração de Grupos

**Objetivo**: Validar que grupos podem ser extraídos e membros listados.

**Pré-requisitos**:
- Bot conectado e online
- Bot deve estar em pelo menos 1 grupo

**Passos**:
1. Acessar página de grupos: `http://localhost:3000/groups`
2. Selecionar bot online
3. Deixar busca em branco
4. Clicar em "Buscar"
5. Aguardar lista de grupos aparecer ✅
6. Clicar em "Extrair" em um grupo
7. Aguardar membros serem extraídos ✅
8. Clicar em "Exportar CSV" ✅

**Esperado**:
- Grupos aparecem em 2-3 segundos
- Membros são extraídos em 5-10 segundos
- CSV é baixado com sucesso
- Dados estão corretos

**Troubleshooting**:
- Se grupos não aparecem: Bot pode não estar em nenhum grupo
- Se membros não carregam: Verificar permissões do bot no grupo

---

### Teste 5: Sincronização em Tempo Real

**Objetivo**: Validar que o status do bot é sincronizado em tempo real.

**Pré-requisitos**:
- Bot conectado e online

**Passos**:
1. Abrir página de bots em 2 abas diferentes
2. Na aba 1, desconectar o bot
3. Verificar se na aba 2 o status muda para "Offline" em até 3 segundos ✅

**Esperado**:
- Status é sincronizado automaticamente
- Não precisa recarregar a página

**Troubleshooting**:
- Se não sincroniza: Verificar polling no hook `useBotSync`

---

## 🔍 Testes de Validação

### Validação 1: Rate Limiting

**Objetivo**: Verificar que rate limiting funciona.

**Teste**:
```bash
# Fazer 100 requisições em 1 segundo
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/whatsapp/connect \
    -H "Content-Type: application/json" \
    -d '{"botId":"test"}' &
done
```

**Esperado**:
- Primeiras 50 requisições: 200/429
- Requisições 51+: 429 (Too Many Requests)

---

### Validação 2: Validação de Entrada

**Objetivo**: Verificar que inputs inválidos são rejeitados.

**Testes**:
```bash
# Teste 1: botId vazio
curl -X POST http://localhost:3000/api/whatsapp/connect \
  -H "Content-Type: application/json" \
  -d '{"botId":""}'
# Esperado: 400 Bad Request

# Teste 2: Telefone inválido
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"botId":"bot-1","phone":"abc","message":"test"}'
# Esperado: 400 Bad Request

# Teste 3: URL inválida
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"botId":"bot-1","phone":"5511999999999","message":"test","mediaUrl":"not-a-url"}'
# Esperado: 400 Bad Request
```

---

### Validação 3: Tratamento de Erro

**Objetivo**: Verificar que erros são tratados corretamente.

**Testes**:
```bash
# Teste 1: Bot não conectado
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"botId":"offline-bot","phone":"5511999999999","message":"test"}'
# Esperado: 400 "Bot não está conectado"

# Teste 2: Redis indisponível
# (Parar Redis e fazer requisição)
# Esperado: 500 "Erro ao conectar com Redis"
```

---

## 📊 Testes de Carga

### Teste de Carga 1: Múltiplos Bots

**Objetivo**: Validar que múltiplos bots podem estar conectados simultaneamente.

**Teste**:
1. Conectar 5 bots diferentes
2. Enviar mensagem de cada bot
3. Verificar que todas as mensagens são entregues ✅

**Esperado**:
- Todos os bots permanecem online
- Mensagens são entregues sem delay

---

### Teste de Carga 2: Fila de Mensagens

**Objetivo**: Validar que a fila processa muitas mensagens.

**Teste**:
1. Criar campanha com 100 contatos
2. Enviar campanha
3. Monitorar progresso
4. Verificar que todas as mensagens são processadas ✅

**Esperado**:
- Fila processa ~10-20 mensagens por segundo
- Nenhuma mensagem é perdida
- Progresso é atualizado em tempo real

---

## ✅ Checklist de Validação

- [ ] Conexão via QR Code funciona
- [ ] Mensagem individual é enviada
- [ ] Campanha em massa é processada
- [ ] Grupos são extraídos corretamente
- [ ] Membros são listados corretamente
- [ ] Status é sincronizado em tempo real
- [ ] Rate limiting funciona
- [ ] Validação de entrada funciona
- [ ] Tratamento de erro funciona
- [ ] Múltiplos bots funcionam simultaneamente
- [ ] Fila processa muitas mensagens
- [ ] Nenhuma mensagem é perdida
- [ ] Performance é aceitável
- [ ] Logs são informativos

---

## 🐛 Bugs Conhecidos

Nenhum no momento.

---

## 📝 Notas

- Todos os testes devem ser executados em um ambiente de desenvolvimento
- Para testes em produção, usar dados de teste apenas
- Monitorar logs em tempo real durante os testes
- Documentar qualquer comportamento inesperado

---

**Última atualização**: 2024-05-10
