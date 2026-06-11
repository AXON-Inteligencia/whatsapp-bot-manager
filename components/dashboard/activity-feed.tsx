"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Bot, MessageSquare, UserPlus, Megaphone } from "lucide-react"

const activities = [
  { id: 1, type: 'bot', text: 'Bot de Vendas respondeu a 5 clientes simultâneos.', time: 'Agora mesmo', icon: Bot, color: 'text-blue-500' },
  { id: 2, type: 'contact', text: 'Novo lead capturado (Carlos Mendes).', time: 'Há 5 minutos', icon: UserPlus, color: 'text-green-500' },
  { id: 3, type: 'message', text: 'Aviso: Cliente aguardando atendimento humano.', time: 'Há 12 minutos', icon: MessageSquare, color: 'text-yellow-500' },
  { id: 4, type: 'campaign', text: 'Campanha "Promoção de Inverno" concluída com sucesso.', time: 'Há 1 hora', icon: Megaphone, color: 'text-purple-500' },
]

export function ActivityFeed() {
  return (
    <Card className="bg-card border-border mb-6">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
          Atividade em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {activities.map((activity) => (
            <div key={activity.id} className="p-4 flex items-start gap-4 hover:bg-secondary/20 transition-colors">
              <div className={`p-2 rounded-full bg-secondary ${activity.color}`}>
                <activity.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{activity.text}</p>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
