"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { Check } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ name: "", email: "", password: "", plan: "starter" })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          role: "user", 
          paymentStatus: "pending" 
        }),
      })

      if (res.ok) {
        toast.success("Conta criada! Redirecionando para pagamento...")
        // Remover hack antigo, o cookie já está sendo setado pela API
        localStorage.setItem("axonflow_user_plan", formData.plan)
        setTimeout(() => router.push("/faturamento"), 1500)
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Erro ao criar conta")
      }
    } catch (error) {
      toast.error("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans py-12 px-4">
      {/* Imagem de Fundo Elegante */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login-logo.png"
          alt="Background"
          fill
          className="object-cover opacity-20 blur-sm scale-110"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/90" />
      </div>

      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col items-center p-8 border border-white relative z-10">
        <div className="mb-6 relative w-24 h-24 transform transition-transform hover:scale-110 duration-500">
          <div className="absolute inset-0 bg-green-500/10 rounded-full blur-xl animate-pulse"></div>
          <Image
            src="/login-logo.png"
            alt="Axon Inteligência Logo"
            fill
            className="object-contain relative z-10"
            priority
          />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2 text-emerald-700">Criar sua Conta</h1>
          <p className="text-slate-500 font-medium">Escolha seu plano e comece a automatizar suas vendas</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {/* Esquerda: Dados Pessoais */}
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">1. Seus Dados</h2>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 ml-1">Nome Completo</label>
                <input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-slate-800"
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 ml-1">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-slate-800"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 ml-1">Senha</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-white/50 border border-slate-200 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Direita: Seleção de Plano */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">2. Escolha o Plano</h2>
              <div className="grid grid-cols-1 gap-3">
                {/* Starter */}
                <label className={`relative flex cursor-pointer rounded-2xl border p-4 shadow-sm transition-all ${formData.plan === 'starter' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white/50 hover:bg-slate-50'}`}>
                  <input type="radio" name="plan" value="starter" className="sr-only" checked={formData.plan === 'starter'} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-bold text-slate-900">Plano Starter</span>
                      <span className="mt-1 flex items-center text-xs text-slate-500">1 Bot Ativo • 1.000 Mensagens</span>
                      <span className="mt-2 text-lg font-bold text-emerald-600">R$ 97<span className="text-xs text-slate-500 font-medium">/mês</span></span>
                    </span>
                  </span>
                  {formData.plan === 'starter' && <Check className="h-5 w-5 text-emerald-600" />}
                </label>

                {/* Pro */}
                <label className={`relative flex cursor-pointer rounded-2xl border p-4 shadow-sm transition-all ${formData.plan === 'pro' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white/50 hover:bg-slate-50'}`}>
                  <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Mais Vendido</div>
                  <input type="radio" name="plan" value="pro" className="sr-only" checked={formData.plan === 'pro'} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-bold text-slate-900">Plano Pro</span>
                      <span className="mt-1 flex items-center text-xs text-slate-500">3 Bots Ativos • 5.000 Mensagens</span>
                      <span className="mt-2 text-lg font-bold text-emerald-600">R$ 197<span className="text-xs text-slate-500 font-medium">/mês</span></span>
                    </span>
                  </span>
                  {formData.plan === 'pro' && <Check className="h-5 w-5 text-emerald-600" />}
                </label>

                {/* Enterprise */}
                <label className={`relative flex cursor-pointer rounded-2xl border p-4 shadow-sm transition-all ${formData.plan === 'enterprise' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white/50 hover:bg-slate-50'}`}>
                  <input type="radio" name="plan" value="enterprise" className="sr-only" checked={formData.plan === 'enterprise'} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-bold text-slate-900">Plano Enterprise</span>
                      <span className="mt-1 flex items-center text-xs text-slate-500">Bots e Mensagens Ilimitados</span>
                      <span className="mt-2 text-lg font-bold text-emerald-600">R$ 497<span className="text-xs text-slate-500 font-medium">/mês</span></span>
                    </span>
                  </span>
                  {formData.plan === 'enterprise' && <Check className="h-5 w-5 text-emerald-600" />}
                </label>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-8 flex flex-col items-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Finalizar Cadastro"
              )}
            </button>
            <div className="mt-6 text-center text-sm font-medium text-slate-500">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition-all">
                Faça login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
