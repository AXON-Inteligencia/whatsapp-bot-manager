"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, Mic, Smartphone, ChevronDown, CheckCircle2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-purple-500/30 font-sans">
      
      {/* Header */}
      <header className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">A</div>
          <span className="font-bold text-xl tracking-tight">AxonFlow</span>
        </div>
        <div className="flex gap-4">
          <a href="https://dashboard.axoninteligencia.com.br/register">
            <Button className="bg-white text-black hover:bg-zinc-200">Criar meu Acesso</Button>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 text-center max-w-5xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300 mb-8">
          <span>🤖 Powered by Llama 3.3 · Groq · Next.js</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
          Seu funcionário mais dedicado <br/>
          trabalha 24h, nunca falta e <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">nunca erra.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mb-12">
          O AxonFlow conecta uma IA treinada com a voz da sua empresa direto no seu WhatsApp e Instagram — respondendo, qualificando e fechando vendas por você no automático.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <a href="https://dashboard.axoninteligencia.com.br/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 transition-opacity">
              Começar gratuitamente
            </Button>
          </a>
          <Link href="#demo">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10 text-white">
              Ver demonstração
            </Button>
          </Link>
        </div>
        <p className="text-sm text-zinc-500 mt-6">Sem cartão de crédito · Ativo em 5 minutos · Cancele quando quiser</p>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <p className="text-center text-sm text-zinc-500 mb-6 uppercase tracking-wider font-semibold">
          Mais de 200 empresas brasileiras já automatizaram seu atendimento
        </p>
        <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
          {/* Placeholders para Logos */}
          <div className="text-xl font-bold font-serif italic">Company Alpha</div>
          <div className="text-xl font-bold font-sans tracking-tighter">TECHCORP</div>
          <div className="text-xl font-bold font-mono">GLOBAL.io</div>
          <div className="text-xl font-bold font-serif">Studio Design</div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Ouvido Biônico</h3>
            <p className="text-zinc-400">Transcreve áudios automaticamente. Seu bot entende clientes que preferem falar ao invés de digitar — sem perder nenhuma mensagem.</p>
          </div>
          
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-6">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Stealth Spin</h3>
            <p className="text-zinc-400">Cada resposta soa diferente da anterior. Nunca repetitivo, sempre natural. Seus clientes não percebem que estão falando com uma IA.</p>
          </div>
          
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-xl flex items-center justify-center mb-6">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">WhatsApp + Instagram</h3>
            <p className="text-zinc-400">Um único painel, dois canais. Configure uma vez e atenda clientes de onde eles preferirem, com a mesma qualidade de inteligência.</p>
          </div>
        </div>
      </section>

      {/* Router Demo */}
      <section id="demo" className="py-24 px-4 bg-gradient-to-b from-transparent to-purple-900/10 border-t border-white/5 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Dois cérebros. Um para vender. Um para resolver.</h2>
          <p className="text-xl text-zinc-400 mb-16">O AxonFlow identifica automaticamente a intenção de cada mensagem e aciona o assistente certo.</p>
          
          <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-50"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              
              <div className="bg-white/10 p-4 rounded-lg border border-white/20 w-full md:w-1/3 text-left">
                <span className="text-xs text-zinc-400">Cliente 1</span>
                <p className="mt-2 text-sm font-medium">"Qual o valor do plano semestral?"</p>
              </div>
              
              <div className="flex-1 flex justify-center w-full">
                <div className="px-6 py-3 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-semibold text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4" /> Roteador IA
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full md:w-1/3">
                <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500/30 text-left">
                  <span className="text-xs text-blue-300 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Cérebro de Vendas</span>
                  <p className="mt-2 text-sm text-zinc-300">"Opa! O semestral tá saindo por..."</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4 max-w-lg mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Um preço. Tudo incluso.</h2>
          <p className="text-zinc-400">Comece hoje e cancele quando quiser.</p>
        </div>

        <div className="p-8 rounded-3xl bg-white/5 border border-purple-500/30 backdrop-blur-xl relative shadow-[0_0_50px_rgba(168,85,247,0.15)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
            Plano Pro
          </div>
          <div className="text-center mb-8">
            <span className="text-5xl font-bold">R$ 297</span>
            <span className="text-zinc-400">/mês</span>
          </div>

          <ul className="space-y-4 mb-8">
            {[
              "WhatsApp + Instagram conectados",
              "Roteador Inteligente de Intenção",
              "Ouvido Biônico (transcrição de áudio)",
              "AI Stealth Spin",
              "Painel de analytics",
              "Suporte prioritário"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-zinc-300">
                <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Link href="/register">
            <Button className="w-full h-14 text-base bg-white text-black hover:bg-zinc-200">
              Começar agora
            </Button>
          </Link>
          <p className="text-center text-sm text-zinc-500 mt-4">7 dias grátis. Sem cartão de crédito.</p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 text-center border-t border-white/5 bg-gradient-to-b from-[#0A0A0F] to-[#1a0533]">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">Pronto para ter um funcionário que nunca dorme?</h2>
        <Link href="/register">
          <Button size="lg" className="h-16 px-10 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white shadow-2xl shadow-purple-500/25">
            Criar minha conta grátis
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-md flex items-center justify-center font-bold text-xs">A</div>
          <span className="font-bold">AxonFlow</span>
        </div>
        <div className="flex gap-6 text-sm text-zinc-500 mb-4">
          <Link href="#" className="hover:text-white">Política de Privacidade</Link>
          <Link href="#" className="hover:text-white">Termos de Uso</Link>
          <Link href="#" className="hover:text-white">Contato</Link>
        </div>
        <p className="text-xs text-zinc-600">© 2026 AxonFlow. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
