"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  MessageSquare, 
  Users, 
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useState } from "react"

// Mock data for analytics
const messagesData = [
  { date: "01/05", enviadas: 1200, recebidas: 1450 },
  { date: "02/05", enviadas: 1350, recebidas: 1280 },
  { date: "03/05", enviadas: 1500, recebidas: 1620 },
  { date: "04/05", enviadas: 1420, recebidas: 1380 },
  { date: "05/05", enviadas: 1680, recebidas: 1720 },
  { date: "06/05", enviadas: 1550, recebidas: 1490 },
  { date: "07/05", enviadas: 1890, recebidas: 1850 },
]

const botsPerformance = [
  { name: "Bot Vendas", mensagens: 1234, taxa: 98.5 },
  { name: "Bot Suporte", mensagens: 892, taxa: 96.2 },
  { name: "Bot Financeiro", mensagens: 567, taxa: 94.8 },
  { name: "Bot Agendamento", mensagens: 345, taxa: 92.1 },
  { name: "Bot Marketing", mensagens: 234, taxa: 89.5 },
]

const responseTimeData = [
  { hora: "00h", tempo: 2.1 },
  { hora: "04h", tempo: 1.8 },
  { hora: "08h", tempo: 3.5 },
  { hora: "12h", tempo: 4.2 },
  { hora: "16h", tempo: 3.8 },
  { hora: "20h", tempo: 2.9 },
]

const conversationTypes = [
  { name: "Vendas", value: 35, color: "hsl(142, 70%, 45%)" },
  { name: "Suporte", value: 28, color: "hsl(220, 70%, 50%)" },
  { name: "Agendamento", value: 20, color: "hsl(45, 90%, 55%)" },
  { name: "Outros", value: 17, color: "hsl(280, 60%, 55%)" },
]

const topContacts = [
  { name: "Maria Silva", messages: 156, lastContact: "Hoje" },
  { name: "Joao Santos", messages: 134, lastContact: "Ontem" },
  { name: "Ana Costa", messages: 98, lastContact: "Hoje" },
  { name: "Carlos Oliveira", messages: 87, lastContact: "2 dias" },
  { name: "Patricia Lima", messages: 76, lastContact: "Hoje" },
]

export default function AnalyticsPage() {
  const bots = useAppStore((state) => state.bots)
  const contacts = useAppStore((state) => state.contacts)
  const conversations = useAppStore((state) => state.conversations)
  const [period, setPeriod] = useState("7d")

  const totalMessages = bots.reduce((acc, b) => acc + b.messages, 0)
  const avgResponseRate = (bots.filter(b => b.status === "online").reduce((acc, b) => acc + parseFloat(b.uptime), 0) / Math.max(bots.filter(b => b.status === "online").length, 1)).toFixed(1)

  return (
    <DashboardLayout title="Analytics" description="Metricas e estatisticas detalhadas">
      {/* Period Filter */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px] bg-secondary border-border">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Ultimas 24 horas</SelectItem>
            <SelectItem value="7d">Ultimos 7 dias</SelectItem>
            <SelectItem value="30d">Ultimos 30 dias</SelectItem>
            <SelectItem value="90d">Ultimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <Badge className="bg-primary/10 text-primary border-0 gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +12%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{totalMessages.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Mensagens hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <Users className="w-5 h-5 text-chart-2" />
              </div>
              <Badge className="bg-primary/10 text-primary border-0 gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +8%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{contacts.length}</p>
              <p className="text-sm text-muted-foreground">Contatos ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <TrendingUp className="w-5 h-5 text-chart-3" />
              </div>
              <Badge className="bg-destructive/10 text-destructive border-0 gap-1">
                <ArrowDownRight className="w-3 h-3" />
                -2%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{avgResponseRate}%</p>
              <p className="text-sm text-muted-foreground">Taxa de resposta</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-chart-4/10">
                <Clock className="w-5 h-5 text-chart-4" />
              </div>
              <Badge className="bg-primary/10 text-primary border-0 gap-1">
                <ArrowUpRight className="w-3 h-3" />
                -15%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">2.8s</p>
              <p className="text-sm text-muted-foreground">Tempo medio resposta</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages Over Time */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Mensagens ao longo do tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={messagesData}>
                  <defs>
                    <linearGradient id="colorEnviadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRecebidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="enviadas"
                    stroke="hsl(142, 70%, 45%)"
                    fillOpacity={1}
                    fill="url(#colorEnviadas)"
                    name="Enviadas"
                  />
                  <Area
                    type="monotone"
                    dataKey="recebidas"
                    stroke="hsl(220, 70%, 50%)"
                    fillOpacity={1}
                    fill="url(#colorRecebidas)"
                    name="Recebidas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Types */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Tipos de conversa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conversationTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {conversationTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {conversationTypes.map((type) => (
                <div key={type.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {type.name} ({type.value}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot Performance */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Performance por bot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={botsPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="mensagens" 
                    fill="hsl(142, 70%, 45%)" 
                    radius={[0, 4, 4, 0]}
                    name="Mensagens"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Tempo de resposta (segundos)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={responseTimeData}>
                  <defs>
                    <linearGradient id="colorTempo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(45, 90%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(45, 90%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hora" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tempo"
                    stroke="hsl(45, 90%, 55%)"
                    fillOpacity={1}
                    fill="url(#colorTempo)"
                    name="Tempo (s)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Contacts */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Contatos mais ativos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {topContacts.map((contact, index) => (
              <div key={contact.name} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                    index === 0 ? "bg-chart-3/10 text-chart-3" :
                    index === 1 ? "bg-muted text-muted-foreground" :
                    index === 2 ? "bg-chart-5/10 text-chart-5" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.messages} mensagens</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-secondary border-0">
                  {contact.lastContact}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
