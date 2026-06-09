"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { time: "00:00", recebidas: 120, enviadas: 98 },
  { time: "03:00", recebidas: 45, enviadas: 32 },
  { time: "06:00", recebidas: 89, enviadas: 76 },
  { time: "09:00", recebidas: 320, enviadas: 290 },
  { time: "12:00", recebidas: 456, enviadas: 412 },
  { time: "15:00", recebidas: 389, enviadas: 356 },
  { time: "18:00", recebidas: 478, enviadas: 445 },
  { time: "21:00", recebidas: 267, enviadas: 234 },
  { time: "Agora", recebidas: 198, enviadas: 167 },
]

export function MessagesChart() {
  return (
    <Card className="bg-card border-border col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">Mensagens</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Tráfego de mensagens nas últimas 24 horas
          </p>
        </div>
        <Select defaultValue="24h">
          <SelectTrigger className="w-32 bg-secondary border-0">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Recebidas</span>
            <span className="text-sm font-semibold text-foreground">2,362</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-2" />
            <span className="text-sm text-muted-foreground">Enviadas</span>
            <span className="text-sm font-semibold text-foreground">2,110</span>
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRecebidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.72 0.19 142)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.72 0.19 142)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEnviadas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.15 250)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.15 250)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 260)" vertical={false} />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.6 0 0)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.6 0 0)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.15 0.005 260)",
                  border: "1px solid oklch(0.25 0.01 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                }}
              />
              <Area
                type="monotone"
                dataKey="recebidas"
                stroke="oklch(0.72 0.19 142)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRecebidas)"
              />
              <Area
                type="monotone"
                dataKey="enviadas"
                stroke="oklch(0.65 0.15 250)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEnviadas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
