export type BotStatus = "online" | "offline" | "connecting"

export interface Bot {
  id: string
  name: string
  phone: string
  status: BotStatus
  messages: number
  uptime: string
  createdAt: Date
  description?: string
  aiSettings?: {
    enabled: boolean
    apiKey?: string
    systemPrompt?: string // Legacy
    salesPrompt?: string
    supportPrompt?: string
  }
}

export interface Conversation {
  id: string
  contactName: string
  contactPhone: string
  lastMessage: string
  timestamp: Date
  unreadCount: number
  botId: string
  botName: string
}

export type FunnelStage = 'new_lead' | 'negotiating' | 'closed' | 'support'

export interface Contact {
  id: string
  name: string
  phone: string
  email?: string
  tags: string[]
  lastContact: Date
  totalMessages: number
  funnelStage?: FunnelStage
}

export interface Automation {
  id: string
  name: string
  description: string
  trigger: string
  botId: string
  isActive: boolean
  executions: number
  lastExecution?: Date
}

export interface DashboardStats {
  totalBots: number
  activeBots: number
  todayConversations: number
  totalContacts: number
  responseRate: number
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: "admin" | "user"
  plan?: "free" | "basic" | "pro" | "max"
  paymentStatus?: "pending" | "active" | "cancelled"
}
