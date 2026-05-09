# WhatsApp Bot Manager

Um dashboard moderno para gerenciamento de bots de WhatsApp, construído com Next.js 16, TypeScript e Tailwind CSS.

## 🚀 Funcionalidades

- **Dashboard Principal**: Visão geral dos bots, estatísticas e métricas
- **Gerenciamento de Bots**: Criar, editar e gerenciar bots WhatsApp
- **Conversas**: Visualizar e gerenciar conversas ativas
- **Contatos**: Gerenciar base de contatos
- **Automações**: Criar e configurar automações
- **Analytics**: Gráficos e relatórios detalhados
- **Admin**: Painel administrativo para gerenciar usuários
- **Autenticação**: Sistema de login seguro

## 🛠️ Tecnologias

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts
- **State Management**: Zustand
- **Database**: JSON File (local)
- **Icons**: Lucide React

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/SEU_USERNAME/whatsapp-bot-manager.git
cd whatsapp-bot-manager
```

2. Instale as dependências:
```bash
npm install
# ou
pnpm install
```

3. Execute o projeto:
```bash
npm run dev
# ou
pnpm dev
```

4. Acesse: `http://localhost:3000`

## 🔐 Acesso Admin

- **URL**: `/login`
- **Email**: `admin@botmanager.local`
- **Senha**: `admin123`

## 📁 Estrutura do Projeto

```
├── app/                    # Páginas Next.js
│   ├── admin/             # Painel administrativo
│   ├── analytics/         # Página de analytics
│   ├── api/               # API Routes
│   ├── bots/              # Gerenciamento de bots
│   ├── login/             # Página de login
│   └── ...
├── components/            # Componentes React
│   ├── dashboard/         # Componentes do dashboard
│   └── ui/                # Componentes UI reutilizáveis
├── lib/                   # Utilitários e lógica
│   ├── db.ts             # Banco de dados local
│   ├── store.ts          # Estado global (Zustand)
│   └── types.ts          # Tipos TypeScript
├── data/                  # Dados locais
└── public/               # Assets estáticos
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Faça push do código para o GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Importe seu repositório
4. Deploy automático!

### Outras Opções

- **Netlify**: Suporte para Next.js
- **Railway**: Deploy direto do GitHub
- **Render**: Suporte para Node.js

## 📊 Funcionalidades Técnicas

- **SSR/SSG**: Otimizado com Next.js
- **Dark Mode**: Tema escuro por padrão
- **Responsive**: Design mobile-first
- **Type Safety**: TypeScript completo
- **Performance**: Build otimizado
- **SEO**: Meta tags configuradas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Criado com ❤️ usando Next.js e TypeScript