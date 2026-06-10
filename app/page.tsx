"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Brain, Mic, Smartphone, ChevronDown, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 2500) // 2.5 seconds splash screen
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#05050A]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative w-48 h-48 flex items-center justify-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-full h-full z-10"
        >
          <Image
            src="/login-logo.png"
            alt="AxonFlow Logo"
            fill
            className="object-contain drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]"
            priority
          />
        </motion.div>
        {/* Glow Effects */}
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-purple-600/30 blur-[60px] rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute inset-0 bg-blue-600/20 blur-[80px] rounded-full"
        />
      </motion.div>
    </motion.div>
  )
}

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <div className={`min-h-screen bg-[#05050A] text-white selection:bg-purple-500/30 font-sans overflow-x-hidden ${showSplash ? 'h-screen overflow-hidden' : ''}`}>
        
        {/* Ambient Background Lights */}
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showSplash ? 0 : 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {/* Header */}
          <header className="relative z-40 flex items-center justify-between p-6 max-w-7xl mx-auto backdrop-blur-md border-b border-white/5 bg-white/[0.01] sticky top-0 rounded-b-3xl">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src="/login-logo.png" alt="AxonFlow" fill className="object-contain" />
              </div>
              <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">AxonFlow</span>
            </div>
            <div className="flex gap-4">
              <a href="https://dashboard.axoninteligencia.com.br/login">
                <Button variant="ghost" className="text-zinc-300 hover:text-white hidden sm:flex">Login</Button>
              </a>
            </div>
          </header>

          {/* Hero Section */}
          <section className="relative pt-32 pb-20 px-4 text-center max-w-5xl mx-auto flex flex-col items-center z-10">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300 mb-8 backdrop-blur-sm shadow-[0_0_30px_rgba(168,85,247,0.15)]"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>O Futuro da Automação com Inteligência Artificial</span>
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight drop-shadow-2xl"
            >
              Seu funcionário mais dedicado <br/>
              trabalha 24h, nunca falta e <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400">nunca erra.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-2xl text-zinc-400 max-w-3xl mb-12 font-light"
            >
              O AxonFlow conecta uma IA treinada com a voz da sua empresa direto no seu WhatsApp e Instagram — fechando vendas por você no automático.
            </motion.p>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
            >
              <a href="https://dashboard.axoninteligencia.com.br/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 transition-all hover:scale-105 shadow-[0_0_40px_rgba(168,85,247,0.4)] border border-purple-400/30">
                  Criar conta gratuitamente
                </Button>
              </a>
              <Link href="#pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-all hover:scale-105">
                  Ver planos
                </Button>
              </Link>
            </motion.div>
          </section>

          {/* 3D Features Grid */}
          <section className="relative py-24 px-4 max-w-7xl mx-auto z-10">
            <div className="grid md:grid-cols-3 gap-8 perspective-1000">
              {[
                { icon: Mic, color: "blue", title: "Ouvido Biônico", desc: "Transcreve áudios automaticamente. Seu bot entende clientes que preferem falar ao invés de digitar." },
                { icon: Brain, color: "purple", title: "AI Stealth Spin", desc: "Cada resposta soa diferente da anterior. Seus clientes não percebem que estão falando com uma IA." },
                { icon: Smartphone, color: "pink", title: "WhatsApp + Insta", desc: "Um único painel, dois canais. Configure uma vez e atenda clientes de onde eles preferirem." }
              ].map((feat, i) => (
                <motion.div 
                  key={i}
                  initial={{ y: 50, opacity: 0, rotateX: 20 }}
                  whileInView={{ y: 0, opacity: 1, rotateX: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.2, type: "spring", stiffness: 100 }}
                  whileHover={{ y: -10, scale: 1.02, rotateY: 5 }}
                  className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] group"
                >
                  <div className={`w-14 h-14 bg-${feat.color}-500/20 text-${feat.color}-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.2)]`}>
                    <feat.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-md">{feat.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Pricing Section (Integrado do Dashboard) */}
          <section id="pricing" className="relative py-32 px-4 max-w-7xl mx-auto z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-xl">Invista no seu crescimento</h2>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto">Escolha o plano ideal para automatizar seu negócio. Cancele quando quiser.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center perspective-1000">
              {/* Starter Plan */}
              <motion.div
                initial={{ opacity: 0, x: -50, rotateY: -15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/[0.02] border border-zinc-800 rounded-3xl relative overflow-hidden flex flex-col backdrop-blur-xl p-8"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                  <p className="text-sm text-zinc-400">Ideal para iniciantes</p>
                </div>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-white">R$ 97</span>
                  <span className="text-zinc-500">/mês</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1 text-zinc-300">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> 1 Bot Ativo</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> 1.000 Mensagens/mês</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Suporte via Email</li>
                </ul>
                <a href="https://dashboard.axoninteligencia.com.br/register">
                  <Button className="w-full h-14 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-lg">Começar Starter</Button>
                </a>
              </motion.div>

              {/* Pro Plan (Destaque 3D) */}
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="bg-gradient-to-b from-purple-900/30 to-blue-900/30 border border-purple-500/50 rounded-3xl relative overflow-hidden flex flex-col backdrop-blur-2xl p-10 shadow-[0_30px_60px_rgba(168,85,247,0.3)] z-20"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-400 to-blue-400"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 blur-2xl rounded-full pointer-events-none"></div>
                
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">Pro</h3>
                    <p className="text-sm text-zinc-300">Para negócios em expansão</p>
                  </div>
                  <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30">MAIS VENDIDO</span>
                </div>
                <div className="mb-8">
                  <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-300">R$ 197</span>
                  <span className="text-zinc-400">/mês</span>
                </div>
                <ul className="space-y-4 mb-10 flex-1 text-zinc-200">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-400 drop-shadow-md" /> Até 3 Bots Ativos</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-400 drop-shadow-md" /> 5.000 Mensagens/mês</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-400 drop-shadow-md" /> Roteador de Atendimento</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-400 drop-shadow-md" /> Disparo de Campanhas</li>
                </ul>
                <a href="https://dashboard.axoninteligencia.com.br/register">
                  <Button className="w-full h-16 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white rounded-xl text-lg font-bold shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                    Assinar Plano Pro
                  </Button>
                </a>
              </motion.div>

              {/* Enterprise Plan */}
              <motion.div
                initial={{ opacity: 0, x: 50, rotateY: 15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/[0.02] border border-zinc-800 rounded-3xl relative overflow-hidden flex flex-col backdrop-blur-xl p-8"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                  <p className="text-sm text-zinc-400">Operações em grande escala</p>
                </div>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-white">R$ 497</span>
                  <span className="text-zinc-500">/mês</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1 text-zinc-300">
                  <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Bots Ilimitados</li>
                  <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Mensagens Ilimitadas</li>
                  <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-emerald-500" /> AI Stealth Spin (Anti-Ban)</li>
                  <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Suporte Prioritário VIP</li>
                </ul>
                <a href="https://dashboard.axoninteligencia.com.br/register">
                  <Button className="w-full h-14 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-lg">Começar Enterprise</Button>
                </a>
              </motion.div>
            </div>
          </section>

          {/* Footer */}
          <footer className="relative py-12 border-t border-white/5 text-center flex flex-col items-center z-10 bg-black/50 backdrop-blur-lg">
            <div className="relative w-8 h-8 mb-4">
              <Image src="/login-logo.png" alt="AxonFlow" fill className="object-contain grayscale opacity-50" />
            </div>
            <div className="flex gap-6 text-sm text-zinc-500 mb-6">
              <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
              <Link href="#" className="hover:text-white transition-colors">Termos</Link>
              <Link href="#" className="hover:text-white transition-colors">Contato</Link>
            </div>
            <p className="text-xs text-zinc-600">© 2026 AxonFlow Inteligência. Todos os direitos reservados.</p>
          </footer>
        </motion.div>
      </div>
    </>
  )
}
