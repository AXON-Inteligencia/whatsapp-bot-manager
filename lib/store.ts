import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Bot, Conversation, Contact, Automation, BotStatus } from "./types"

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9)

// Initial mock data
const initialBots: Bot[] = [
  {
    id: "bot-1",
    name: "Bot Vendas",
    phone: "+55 11 99999-0001",
    status: "online",
    messages: 1234,
    uptime: "99.9%",
    createdAt: new Date("2024-01-15"),
    description: "Bot para atendimento de vendas e prospecção",
  },
  {
    id: "bot-2",
    name: "Bot Suporte",
    phone: "+55 11 99999-0002",
    status: "online",
    messages: 892,
    uptime: "98.5%",
    createdAt: new Date("2024-02-20"),
    description: "Suporte ao cliente 24/7",
  },
  {
    id: "bot-3",
    name: "Bot Marketing",
    phone: "+55 11 99999-0003",
    status: "offline",
    messages: 0,
    uptime: "0%",
    createdAt: new Date("2024-03-10"),
    description: "Campanhas de marketing e promoções",
  },
  {
    id: "bot-4",
    name: "Bot Financeiro",
    phone: "+55 11 99999-0004",
    status: "online",
    messages: 567,
    uptime: "97.2%",
    createdAt: new Date("2024-01-28"),
    description: "Consultas financeiras e cobranças",
  },
  {
    id: "bot-5",
    name: "Bot Agendamento",
    phone: "+55 11 99999-0005",
    status: "connecting",
    messages: 0,
    uptime: "-",
    createdAt: new Date("2024-04-01"),
    description: "Agendamento de consultas e reuniões",
  },
]

const initialConversations: Conversation[] = [
  {
    id: "conv-1",
    contactName: "Maria Silva",
    contactPhone: "+55 11 98765-4321",
    lastMessage: "Olá! Gostaria de saber mais sobre os planos...",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    unreadCount: 2,
    botId: "bot-1",
    botName: "Bot Vendas",
  },
  {
    id: "conv-2",
    contactName: "João Santos",
    contactPhone: "+55 21 99876-5432",
    lastMessage: "Preciso de ajuda com meu pedido #12345",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    unreadCount: 0,
    botId: "bot-2",
    botName: "Bot Suporte",
  },
  {
    id: "conv-3",
    contactName: "Ana Costa",
    contactPhone: "+55 31 97654-3210",
    lastMessage: "Quando será a próxima promoção?",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 1,
    botId: "bot-3",
    botName: "Bot Marketing",
  },
  {
    id: "conv-4",
    contactName: "Carlos Oliveira",
    contactPhone: "+55 41 96543-2109",
    lastMessage: "Gostaria de confirmar o pagamento...",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    unreadCount: 0,
    botId: "bot-4",
    botName: "Bot Financeiro",
  },
  {
    id: "conv-5",
    contactName: "Patricia Lima",
    contactPhone: "+55 51 95432-1098",
    lastMessage: "Preciso remarcar minha consulta",
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    unreadCount: 3,
    botId: "bot-5",
    botName: "Bot Agendamento",
  },
]

const initialContacts: Contact[] = [
  {
    id: "contact-1",
    name: "Maria Silva",
    phone: "+55 11 98765-4321",
    email: "maria@email.com",
    tags: ["cliente", "vip"],
    lastContact: new Date(Date.now() - 5 * 60 * 1000),
    totalMessages: 156,
  },
  {
    id: "contact-2",
    name: "João Santos",
    phone: "+55 21 99876-5432",
    email: "joao@email.com",
    tags: ["suporte"],
    lastContact: new Date(Date.now() - 15 * 60 * 1000),
    totalMessages: 89,
  },
  {
    id: "contact-3",
    name: "Ana Costa",
    phone: "+55 31 97654-3210",
    email: "ana@email.com",
    tags: ["marketing", "newsletter"],
    lastContact: new Date(Date.now() - 30 * 60 * 1000),
    totalMessages: 234,
  },
  {
    id: "contact-4",
    name: "Carlos Oliveira",
    phone: "+55 41 96543-2109",
    email: "carlos@email.com",
    tags: ["financeiro"],
    lastContact: new Date(Date.now() - 45 * 60 * 1000),
    totalMessages: 67,
  },
  {
    id: "contact-5",
    name: "Patricia Lima",
    phone: "+55 51 95432-1098",
    email: "patricia@email.com",
    tags: ["agendamento"],
    lastContact: new Date(Date.now() - 60 * 60 * 1000),
    totalMessages: 45,
  },
  {
    id: "contact-6",
    name: "Roberto Alves",
    phone: "+55 61 94321-0987",
    email: "roberto@email.com",
    tags: ["cliente", "vip", "parceiro"],
    lastContact: new Date(Date.now() - 120 * 60 * 1000),
    totalMessages: 312,
  },
]

const initialAutomations: Automation[] = [
  {
    id: "auto-1",
    name: "Boas-vindas",
    description: "Enviar mensagem de boas-vindas para novos contatos",
    trigger: "Novo contato",
    botId: "bot-1",
    isActive: true,
    executions: 1523,
    lastExecution: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: "auto-2",
    name: "Resposta Automática",
    description: "Responder fora do horário comercial",
    trigger: "Fora do horário",
    botId: "bot-2",
    isActive: true,
    executions: 892,
    lastExecution: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: "auto-3",
    name: "Lembrete de Pagamento",
    description: "Enviar lembrete 3 dias antes do vencimento",
    trigger: "Agendado",
    botId: "bot-4",
    isActive: false,
    executions: 234,
    lastExecution: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "auto-4",
    name: "Confirmação de Agendamento",
    description: "Confirmar consulta 24h antes",
    trigger: "Agendado",
    botId: "bot-5",
    isActive: true,
    executions: 567,
    lastExecution: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "auto-5",
    name: "Pesquisa de Satisfação",
    description: "Enviar pesquisa após atendimento",
    trigger: "Fim do atendimento",
    botId: "bot-2",
    isActive: true,
    executions: 445,
    lastExecution: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
]

interface AppStore {
  // Data
  bots: Bot[]
  conversations: Conversation[]
  contacts: Contact[]
  automations: Automation[]
  
  // Search & Filters
  searchTerm: string
  statusFilter: BotStatus | "all"
  
  // Bot Actions
  addBot: (bot: Omit<Bot, "id" | "createdAt" | "messages" | "uptime">) => void
  updateBot: (id: string, updates: Partial<Bot>) => void
  deleteBot: (id: string) => void
  toggleBotStatus: (id: string) => void
  
  // Conversation Actions
  markConversationAsRead: (id: string) => void
  
  // Contact Actions
  addContact: (contact: Omit<Contact, "id" | "lastContact" | "totalMessages">) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  deleteContact: (id: string) => void
  importContacts: (newContacts: Omit<Contact, "id" | "lastContact" | "totalMessages">[]) => number
  
  // Automation Actions
  addAutomation: (automation: Omit<Automation, "id" | "executions" | "lastExecution">) => void
  updateAutomation: (id: string, updates: Partial<Automation>) => void
  deleteAutomation: (id: string) => void
  toggleAutomation: (id: string) => void
  
  // WhatsApp Actions
  connectBot: (id: string) => Promise<void>
  sendMessage: (botId: string, phone: string, message: string) => Promise<void>
  
  // Search & Filter Actions
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: BotStatus | "all") => void
  
  // Computed
  getStats: () => {
    totalBots: number
    activeBots: number
    todayConversations: number
    totalContacts: number
    responseRate: number
  }
  getFilteredBots: () => Bot[]
}

// Custom storage handler to properly deserialize Date objects
const customStorage = {
  getItem: (name: string) => {
    const item = localStorage.getItem(name)
    if (!item) return null
    try {
      const parsed = JSON.parse(item)
      // Deserialize Date fields
      if (parsed.conversations) {
        parsed.conversations = parsed.conversations.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
        }))
      }
      if (parsed.bots) {
        parsed.bots = parsed.bots.map((bot: any) => ({
          ...bot,
          createdAt: new Date(bot.createdAt),
        }))
      }
      if (parsed.contacts) {
        parsed.contacts = parsed.contacts.map((contact: any) => ({
          ...contact,
          lastContact: new Date(contact.lastContact),
        }))
      }
      if (parsed.automations) {
        parsed.automations = parsed.automations.map((auto: any) => ({
          ...auto,
          lastExecution: new Date(auto.lastExecution),
        }))
      }
      return JSON.stringify(parsed)
    } catch (error) {
      console.error('Error deserializing store:', error)
      return item
    }
  },
  setItem: (name: string, value: string) => {
    localStorage.setItem(name, value)
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name)
  },
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
  // Initial Data
  bots: initialBots,
  conversations: initialConversations,
  contacts: initialContacts,
  automations: initialAutomations,
  
  // Search & Filters
  searchTerm: "",
  statusFilter: "all",
  
  // Bot Actions
  addBot: (botData) => {
    const newBot: Bot = {
      ...botData,
      id: generateId(),
      createdAt: new Date(),
      messages: 0,
      uptime: "0%",
    }
    set((state) => ({ bots: [...state.bots, newBot] }))
  },
  
  updateBot: (id, updates) => {
    set((state) => ({
      bots: state.bots.map((bot) => (bot.id === id ? { ...bot, ...updates } : bot)),
    }))
  },
  
  deleteBot: (id) => {
    set((state) => ({ bots: state.bots.filter((bot) => bot.id !== id) }))
  },
  
  toggleBotStatus: (id) => {
    set((state) => ({
      bots: state.bots.map((bot) => {
        if (bot.id !== id) return bot
        const newStatus: BotStatus = bot.status === "online" ? "offline" : 
                                     bot.status === "offline" ? "connecting" : "online"
        return { ...bot, status: newStatus }
      }),
    }))
  },
  
  // Conversation Actions
  markConversationAsRead: (id) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, unreadCount: 0 } : conv
      ),
    }))
  },
  
  // Contact Actions
  addContact: (contactData) => {
    const newContact: Contact = {
      ...contactData,
      id: generateId(),
      lastContact: new Date(),
      totalMessages: 0,
    }
    set((state) => ({ contacts: [...state.contacts, newContact] }))
  },
  
  updateContact: (id, updates) => {
    set((state) => ({
      contacts: state.contacts.map((contact) =>
        contact.id === id ? { ...contact, ...updates } : contact
      ),
    }))
  },
  
  deleteContact: (id) => {
    set((state) => ({ contacts: state.contacts.filter((contact) => contact.id !== id) }))
  },

  importContacts: (newContacts) => {
    let added = 0
    const state = get()
    const toAdd: Contact[] = []
    for (const c of newContacts) {
      const exists = state.contacts.find((e) => e.phone.replace(/\D/g, '') === c.phone.replace(/\D/g, ''))
      if (!exists) {
        toAdd.push({
          ...c,
          id: generateId(),
          lastContact: new Date(),
          totalMessages: 0,
        })
        added++
      }
    }
    if (toAdd.length > 0) {
      set((state) => ({ contacts: [...state.contacts, ...toAdd] }))
    }
    return added
  },
  
  // Automation Actions
  addAutomation: async (automationData) => {
    const newAutomation: Automation = {
      ...automationData,
      id: generateId(),
      executions: 0,
    }
    
    // Persistir no Redis via API (precisamos criar essa rota)
    await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAutomation),
    });

    set((state) => ({ automations: [...state.automations, newAutomation] }))
  },
  
  updateAutomation: (id, updates) => {
    set((state) => ({
      automations: state.automations.map((automation) =>
        automation.id === id ? { ...automation, ...updates } : automation
      ),
    }))
  },
  
  deleteAutomation: (id) => {
    set((state) => ({
      automations: state.automations.filter((automation) => automation.id !== id),
    }))
  },
  
  toggleAutomation: (id) => {
    set((state) => ({
      automations: state.automations.map((automation) =>
        automation.id === id ? { ...automation, isActive: !automation.isActive } : automation
      ),
    }))
  },
  
  // WhatsApp Actions
  connectBot: async (id) => {
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: id }),
      });
      if (!response.ok) throw new Error('Falha ao iniciar conexão');
      
      set((state) => ({
        bots: state.bots.map((bot) => 
          bot.id === id ? { ...bot, status: 'connecting' } : bot
        )
      }));
    } catch (error) {
      console.error('Erro ao conectar bot:', error);
      throw error;
    }
  },

  sendMessage: async (botId, phone, message) => {
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId, phone, message }),
      });
      if (!response.ok) throw new Error('Falha ao enviar mensagem');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  },
  
  // Search & Filter Actions
  setSearchTerm: (term) => set({ searchTerm: term }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  
  // Computed
  getStats: () => {
    const { bots, conversations, contacts } = get()
    const activeBots = bots.filter((b) => b.status === "online").length
    return {
      totalBots: bots.length,
      activeBots,
      todayConversations: conversations.length,
      totalContacts: contacts.length,
      responseRate: 94.5,
    }
  },
  
  getFilteredBots: () => {
    const { bots, searchTerm, statusFilter } = get()
    return bots.filter((bot) => {
      const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bot.phone.includes(searchTerm)
      const matchesStatus = statusFilter === "all" || bot.status === statusFilter
      return matchesSearch && matchesStatus
    })
  },
}),
    {
      name: "whatsapp-bot-manager",
      storage: customStorage as any,
      partialize: (state) => ({
        bots: state.bots,
        contacts: state.contacts,
        automations: state.automations,
        conversations: state.conversations,
      }),
    }
  )
)
