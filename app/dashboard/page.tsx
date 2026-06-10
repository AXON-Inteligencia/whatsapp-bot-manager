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

  const handleSubscribe = async (planName: string) => {
    setIsCheckoutLoading(true)
    try {
      const email = "contato@empresa.com" // Em produção, pegue o email do usuário logado do estado global ou JWT
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email, plan: planName })
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
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Desbloqueie o Poder do AxonFlow</h2>
            <p className="text-zinc-400">Você está no plano gratuito (apenas visualização). Escolha um plano para ativar seus robôs e começar a vender no automático.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <Card className="bg-black/40 border-zinc-800 relative overflow-hidden flex flex-col hover:border-zinc-700 transition-colors">
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">Starter</h3>
                  <p className="text-sm text-zinc-400">Ideal para iniciantes</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">R$ 97</span>
                  <span className="text-zinc-500">/mês</span>
                </div>
                <ul className="space-y-3 mb-6 flex-1 text-sm text-zinc-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1 Bot Ativo</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1.000 Mensagens/mês</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Suporte via Email</li>
                </ul>
                <Button 
                  onClick={() => handleSubscribe('starter')}
                  disabled={isCheckoutLoading}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  {isCheckoutLoading ? "Aguarde..." : "Assinar Starter"}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-gradient-to-b from-purple-900/20 to-blue-900/20 border-purple-500/50 relative overflow-hidden flex flex-col shadow-[0_0_30px_rgba(168,85,247,0.1)]">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white">Pro</h3>
                    <p className="text-sm text-zinc-400">Para negócios em expansão</p>
                  </div>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">R$ 197</span>
                  <span className="text-zinc-500">/mês</span>
                </div>
                <ul className="space-y-3 mb-6 flex-1 text-sm text-zinc-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Até 3 Bots Ativos</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 5.000 Mensagens/mês</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Roteador de Atendimento</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Disparo de Campanhas</li>
                </ul>
                <Button 
                  onClick={() => handleSubscribe('pro')}
                  disabled={isCheckoutLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white shadow-lg"
                >
                  {isCheckoutLoading ? "Aguarde..." : "Assinar Pro"}
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-black/40 border-zinc-800 relative overflow-hidden flex flex-col hover:border-zinc-700 transition-colors">
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">Enterprise</h3>
                  <p className="text-sm text-zinc-400">Operações em grande escala</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">R$ 497</span>
                  <span className="text-zinc-500">/mês</span>
                </div>
                <ul className="space-y-3 mb-6 flex-1 text-sm text-zinc-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Bots Ilimitados</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mensagens Ilimitadas</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> AI Stealth Spin (Anti-Ban)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Suporte Prioritário VIP</li>
                </ul>
                <Button 
                  onClick={() => handleSubscribe('enterprise')}
                  disabled={isCheckoutLoading}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  {isCheckoutLoading ? "Aguarde..." : "Assinar Enterprise"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
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
