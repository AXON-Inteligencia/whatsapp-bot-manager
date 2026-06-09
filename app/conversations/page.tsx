"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAppStore } from "@/lib/store"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  Send,
  Phone,
  MoreVertical,
  CheckCheck,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Agora"
  if (diffMins < 60) return `${diffMins}min`
  if (diffHours < 24) return `${diffHours}h`
  return `${diffDays}d`
}

// Mock messages for selected conversation
const mockMessages = [
  { id: 1, content: "Ola! Gostaria de saber mais sobre os planos disponiveis", sender: "contact", time: "10:30" },
  { id: 2, content: "Ola! Claro, temos varios planos que podem atender suas necessidades. Qual o seu objetivo principal?", sender: "bot", time: "10:31" },
  { id: 3, content: "Preciso de um plano para minha empresa pequena, com ate 10 funcionarios", sender: "contact", time: "10:33" },
  { id: 4, content: "Perfeito! Para empresas desse porte, recomendo nosso Plano Business. Inclui ate 15 usuarios, suporte prioritario e integracao com sistemas externos.", sender: "bot", time: "10:33" },
  { id: 5, content: "Qual o valor mensal?", sender: "contact", time: "10:35" },
]

export default function ConversationsPage() {
  const conversations = useAppStore((state) => state.conversations)
  const bots = useAppStore((state) => state.bots)
  const markAsRead = useAppStore((state) => state.markConversationAsRead)
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [botFilter, setBotFilter] = useState<string>("all")
  const [messageInput, setMessageInput] = useState("")

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBot = botFilter === "all" || conv.botId === botFilter
    return matchesSearch && matchesBot
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id)
    markAsRead(id)
  }

  return (
    <DashboardLayout title="Conversas" description="Visualize e gerencie todas as conversas">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Conversations List */}
        <Card className="bg-card border-border lg:col-span-1 flex flex-col">
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                className="pl-9 bg-secondary border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={botFilter} onValueChange={setBotFilter}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Filtrar por bot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os bots</SelectItem>
                {bots.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id}>
                    {bot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/50 transition-colors",
                    selectedConversation === conv.id && "bg-secondary",
                    conv.unreadCount > 0 && "bg-primary/5"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {conv.contactName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "font-medium truncate",
                        conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {conv.contactName}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTimeAgo(conv.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {conv.lastMessage}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-secondary border-0 text-muted-foreground">
                        {conv.botName}
                      </Badge>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="bg-card border-border lg:col-span-2 flex flex-col">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                    {selectedConv.contactName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{selectedConv.contactName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedConv.contactPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-secondary border-0">
                    {selectedConv.botName}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {mockMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender === "bot" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          msg.sender === "bot"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-foreground rounded-bl-md"
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          msg.sender === "bot" ? "justify-end" : "justify-start"
                        )}>
                          <span className={cn(
                            "text-xs",
                            msg.sender === "bot" ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {msg.time}
                          </span>
                          {msg.sender === "bot" && (
                            <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    className="bg-secondary border-border"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && messageInput.trim()) {
                        setMessageInput("")
                      }
                    }}
                  />
                  <Button size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground">Selecione uma conversa</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Escolha uma conversa da lista para visualizar
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
