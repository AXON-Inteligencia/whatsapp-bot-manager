"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check, CreditCard, Sparkles, Zap, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const plans = [
  {
    name: "Starter",
    price: 97,
    priceStr: "R$ 97",
    description: "Perfeito para pequenos negócios e autônomos.",
    features: [
      "1 Bot Conectado",
      "Envio de 1.000 mensagens/mês",
      "Extrator de Grupos Google",
      "Suporte via Email",
    ],
    current: false,
  },
  {
    name: "Pro",
    price: 197,
    priceStr: "R$ 197",
    description: "Para empresas que querem vender no automático.",
    features: [
      "Até 5 Bots Conectados",
      "Envio de 10.000 mensagens/mês",
      "Extrator de Grupos Google",
      "Agentes de IA (Gemini)",
      "Sistema Anti-Ban Avançado",
      "Suporte Prioritário",
    ],
    popular: true,
    current: false,
  },
  {
    name: "Enterprise",
    price: 497,
    priceStr: "R$ 497",
    description: "Operações em grande escala e multi-atendentes.",
    features: [
      "Bots Ilimitados",
      "Mensagens Ilimitadas",
      "Agentes de IA Ilimitados",
      "API para Integrações",
      "Gerente de Conta Dedicado",
    ],
    current: false,
  }
]

export default function BillingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    try {
      setLoadingPlan(plan.name);
      
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: plan.name,
          value: plan.price
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar checkout');
      }

      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <DashboardLayout title="Faturamento" description="Gerencie sua assinatura, limites e métodos de pagamento.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Current Usage Stats */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Uso do Plano Atual (Starter)</CardTitle>
            <CardDescription>Acompanhe o consumo dos seus limites mensais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Mensagens Enviadas</span>
                <span className="text-muted-foreground">420 / 1.000</span>
              </div>
              <Progress value={42} className="h-2 bg-secondary" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Bots Conectados</span>
                <span className="text-muted-foreground">1 / 1</span>
              </div>
              <Progress value={100} className="h-2 bg-secondary" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Respostas de Inteligência Artificial</span>
                <span className="text-muted-foreground">Bloqueado no plano Starter</span>
              </div>
              <Progress value={0} className="h-2 bg-secondary" />
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Método de Pagamento</CardTitle>
            <CardDescription>Forma de cobrança padrão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="p-2 bg-background rounded shadow-sm">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Mastercard terminado em 4242</p>
                <p className="text-xs text-muted-foreground">Expira em 12/2028</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Atualizar Cartão</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Faça upgrade e libere todo o potencial</h2>
          <p className="text-muted-foreground mt-2">Escolha o plano ideal para escalar suas vendas automáticas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative flex flex-col bg-card border-border transition-all duration-300 hover:border-primary/50 ${
                plan.popular ? "border-primary shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-[1.02]" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                  <Sparkles className="w-3 h-3" /> MAIS ESCOLHIDO
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.priceStr}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSubscribe(plan)}
                  variant={plan.current ? "secondary" : (plan.popular ? "default" : "outline")} 
                  className="w-full gap-2"
                  disabled={plan.current || loadingPlan !== null}
                >
                  {loadingPlan === plan.name ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Gerando link...</>
                  ) : plan.current ? (
                    "Plano Atual"
                  ) : (
                    <><Zap className="w-4 h-4" /> Assinar {plan.name}</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
