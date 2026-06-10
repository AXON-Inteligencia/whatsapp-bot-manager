"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { MessagesChart } from "@/components/dashboard/messages-chart"
import { BotsList } from "@/components/dashboard/bots-list"
import { RecentConversations } from "@/components/dashboard/recent-conversations"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, Sparkles, CheckCircle2 } from "lucide-react"

export default function DashboardPage() {
  const [userPlan, setUserPlan] = useState<string | null>(null)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)

  useEffect(() => {
    setUserPlan(localStorage.getItem("axonflow_user_plan") || "free")
  }, [])

  const handleSubscribe = async () => {
    setIsCheckoutLoading(true)
    try {
      const email = "contato@empresa.com" // Em produção, pegue o email do usuário logado do estado global ou JWT
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl // Redireciona para o Mercado Pago
        }
      } else {
        console.error("Falha ao gerar link de pagamento")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  return (
    <DashboardLayout 
      title="Dashboard" 
      description="Bem-vindo de volta! Aqui esta um resumo dos seus bots."
    >
      {userPlan === "free" && (
        <Card className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/50 mb-8 relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="w-32 h-32" />
          </div>
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white">Desbloqueie o AxonFlow Pro</h2>
              </div>
              <p className="text-zinc-300 max-w-xl mb-4">
                Você está no plano gratuito. Para criar múltiplos robôs, ativar a Inteligência Artificial avançada, o Roteador de Vendas e o Stealth Spin, você precisa assinar um plano.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-zinc-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400"/> Múltiplos Bots</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400"/> Integração Instagram</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400"/> AI Stealth Spin Anti-Ban</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400"/> Roteador (Vendas/Suporte)</li>
              </ul>
            </div>
            <div className="flex flex-col items-center gap-3 bg-black/40 p-6 rounded-2xl border border-white/10 shrink-0">
              <span className="text-sm text-zinc-400 uppercase tracking-wider font-bold">Plano Pro</span>
              <div className="text-3xl font-bold text-white">R$ 297<span className="text-sm font-normal text-zinc-400">/mês</span></div>
              <Button 
                onClick={handleSubscribe}
                disabled={isCheckoutLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white shadow-lg mt-2"
              >
                {isCheckoutLoading ? "Gerando PIX..." : "Assinar Agora"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MessagesChart />
        <PerformanceChart />
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BotsList />
        <RecentConversations />
      </div>
    </DashboardLayout>
  )
}
