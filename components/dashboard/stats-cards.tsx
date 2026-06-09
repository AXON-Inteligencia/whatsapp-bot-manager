"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Bot, MessageSquare, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function StatsCards() {
  const getStats = useAppStore((state) => state.getStats)
  const stats = getStats()

  const cards = [
    {
      title: "Bots Ativos",
      value: stats.activeBots,
      total: stats.totalBots,
      suffix: `de ${stats.totalBots}`,
      change: "+2",
      trend: "up" as const,
      icon: Bot,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Conversas Hoje",
      value: stats.todayConversations,
      change: "+23%",
      trend: "up" as const,
      icon: MessageSquare,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Total de Contatos",
      value: stats.totalContacts.toLocaleString(),
      change: "+156",
      trend: "up" as const,
      icon: Users,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Taxa de Resposta",
      value: `${stats.responseRate}%`,
      change: "-1.2%",
      trend: "down" as const,
      icon: TrendingUp,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className={cn("p-2.5 rounded-lg", card.bgColor)}>
                <card.icon className={cn("w-5 h-5", card.color)} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                card.trend === "up" ? "text-primary" : "text-destructive"
              )}>
                {card.trend === "up" ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {card.change}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{card.value}</span>
                {card.suffix && (
                  <span className="text-sm text-muted-foreground">{card.suffix}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
