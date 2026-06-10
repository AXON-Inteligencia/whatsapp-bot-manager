"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { QrCode, MessageSquare, Rocket } from "lucide-react"
import { toast } from "sonner"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [prompt, setPrompt] = useState("Você é um especialista em atendimento. Sua missão é ser educado, prestativo e sempre buscar fechar a venda de forma natural.")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const completed = localStorage.getItem("axonflow_onboarding_complete")
    if (completed === "true") {
      router.push("/dashboard")
    }
  }, [router])

  if (!isClient) return null

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleFinish = () => {
    localStorage.setItem("axonflow_onboarding_complete", "true")
    toast.success("Configuração concluída!")
    router.push("/dashboard")
  }

  const progress = (step / 3) * 100

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
            Bem-vindo ao AxonFlow
          </h1>
          <p className="text-zinc-400">Vamos configurar sua máquina de vendas em 3 passos simples.</p>
        </div>

        <Progress value={progress} className="h-2 mb-8 bg-zinc-800" />

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardContent className="p-8">
            {step === 1 && (
              <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                  <QrCode className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Passo 1: Conecte seu WhatsApp</h2>
                <p className="text-zinc-400">
                  Para começar, você precisará escanear o QR Code no seu painel para vincular o número que a IA usará para atender seus clientes.
                </p>
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 text-sm text-zinc-300">
                  Você fará isso na aba "Bots" logo após finalizar este guia.
                </div>
                <Button onClick={handleNext} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white">
                  Entendi, próximo passo
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold text-white text-center">Passo 2: Treine seu Cérebro</h2>
                <p className="text-zinc-400 text-center">
                  Como você quer que seu assistente se comporte? Preparamos um modelo vencedor para você começar:
                </p>
                <Textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-black/50 border-white/10 text-zinc-200 min-h-[120px]"
                />
                <Button onClick={handleNext} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white">
                  Continuar
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 mb-4">
                  <Rocket className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Passo 3: Tudo Pronto!</h2>
                <p className="text-zinc-400">
                  Sua conta está configurada. Agora você será redirecionado para o seu painel de controle onde poderá ler o QR Code e ver a mágica acontecer.
                </p>
                <Button onClick={handleFinish} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 text-white">
                  Ir para o Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
