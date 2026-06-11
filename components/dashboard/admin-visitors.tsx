"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"
import { useEffect, useState } from "react"

export function AdminVisitors() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [visitors, setVisitors] = useState(12)

  useEffect(() => {
    const role = localStorage.getItem("axonflow_role")
    if (role === "admin") {
      setIsAdmin(true)
    }

    // Simulador realista de visitantes em tempo real
    const interval = setInterval(() => {
      setVisitors(prev => {
        // Flutuação de -2 a +2
        const change = Math.floor(Math.random() * 5) - 2
        let newValue = prev + change
        if (newValue < 5) newValue = 5
        if (newValue > 35) newValue = 35
        return newValue
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (!isAdmin) return null

  return (
    <Card className="bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border-emerald-500/30 mb-6">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/20 relative">
            <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full"></div>
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-100/70 uppercase tracking-wider">Acesso de Administrador</p>
            <p className="text-lg font-bold text-white flex items-center gap-2">
              Usuários ativos no site agora
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-4xl font-extrabold text-emerald-400 tabular-nums tracking-tighter shadow-emerald-500/20 drop-shadow-lg">
            {visitors}
          </span>
          <span className="ml-2 text-sm text-emerald-200/50">pessoas</span>
        </div>
      </CardContent>
    </Card>
  )
}
