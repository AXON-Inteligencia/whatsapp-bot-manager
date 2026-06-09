"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAppStore } from "@/lib/store"
import { useState, useEffect, useRef } from "react"
import useSWR from "swr"
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

const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return "Agora";
  const date = new Date(dateStr);
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

export default function ConversationsPage() {
  const bots = useAppStore((state) => state.bots)
  
  // SWR para fazer o Polling Automático (Atualiza a cada 3 segundos)
  const { data: realConversations, mutate } = useSWR('/api/conversations', fetcher, { 
    refreshInterval: 3000,
    fallbackData: []
  });

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [botFilter, setBotFilter] = useState<string>("all")
  const [messageInput, setMessageInput] = useState("")
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // Rolagem automática para baixo quando chega mensagem nova
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [realConversations, selectedConversation]);

  const conversations = realConversations || [];

  const filteredConversations = conversations.filter((conv: any) => {
    const matchesSearch = conv.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBot = botFilter === "all" || conv.botId === botFilter
    return matchesSearch && matchesBot
  });

  const selectedConv = conversations.find((c: any) => c.id === selectedConversation)

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id)
    // Aqui você também pode chamar uma API de Mark As Read para zerar conv.unreadCount
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConv) return;
    
    const tempMessage = messageInput;
    setMessageInput("");

    // Otimista: adiciona na tela antes de chegar no servidor
    mutate(conversations.map((c: any) => {
      if (c.id === selectedConv.id) {
        return {
          ...c,
          messages: [...c.messages, {
            id: Math.random().toString(),
            content: tempMessage,
            sender: 'bot',
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
          }]
        }
      }
      return c;
    }), false);

    // Chamar API para enviar via WhatsApp (você pode implementar a rota POST /api/conversations/send)
    // await fetch('/api/conversations/send', { method: 'POST', body: JSON.stringify({ botId: selectedConv.botId, to: selectedConv.contactPhone, text: tempMessage }) });
  }

  return (
    <DashboardLayout title="Conversas (Ao Vivo)" description="Atendimento em tempo real com integração automática da IA.">
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
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Nenhuma conversa registrada. As mensagens aparecerão aqui automaticamente quando o WhatsApp receber novas mensagens.
                </div>
              ) : filteredConversations.map((conv: any) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/50 transition-colors",
                    selectedConversation === conv.id && "bg-secondary",
                    conv.unreadCount > 0 && "bg-primary/5"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold flex-shrink-0 text-primary">
                    {conv.contactName?.substring(0, 2).toUpperCase() || "??"}
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
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-primary">
                    {selectedConv.contactName?.substring(0, 2).toUpperCase() || "??"}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{selectedConv.contactName}</h3>
                    <p className="text-sm text-muted-foreground">+{selectedConv.contactPhone}</p>
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
              <div 
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto space-y-4"
              >
                {selectedConv.messages?.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.sender === "bot" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm",
                        msg.sender === "bot"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className={cn(
                        "flex items-center gap-1 mt-1",
                        msg.sender === "bot" ? "justify-end" : "justify-start"
                      )}>
                        <span className={cn(
                          "text-[10px]",
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

              {/* Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex gap-2">
                  <Input
                    placeholder="Intervir no atendimento da IA..."
                    className="bg-secondary border-border"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                  />
                  <Button size="icon" onClick={handleSendMessage} className="shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Quando você responde manualmente, a IA ainda está ativa. Se desejar, desligue-a na aba de Agentes.
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground">Selecione uma conversa</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Aguardando novas mensagens... (Atualizando ao vivo)
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
