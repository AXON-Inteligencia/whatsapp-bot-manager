"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

const data = [
  { name: "Vendas", value: 94.2, color: "oklch(0.72 0.19 142)" },
  { name: "Suporte", value: 98.1, color: "oklch(0.65 0.15 250)" },
  { name: "Marketing", value: 0, color: "oklch(0.4 0 0)" },
  { name: "Financeiro", value: 91.5, color: "oklch(0.75 0.18 50)" },
  { name: "Agenda", value: 87.3, color: "oklch(0.6 0.2 330)" },
]

export function PerformanceChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Performance por Bot</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Taxa de resposta (%)</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 260)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.6 0 0)", fontSize: 12 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.6 0 0)", fontSize: 12 }}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.15 0.005 260)",
                  border: "1px solid oklch(0.25 0.01 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                }}
                formatter={(value: number) => [`${value}%`, "Taxa de resposta"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
