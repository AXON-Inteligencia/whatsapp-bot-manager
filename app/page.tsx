"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 2500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D0F]"
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
            className="object-contain drop-shadow-[0_0_30px_rgba(0,230,118,0.6)]"
            priority
          />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[#00E676]/30 blur-[60px] rounded-full"
        />
      </motion.div>
    </motion.div>
  )
}

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true)
  const [navScrolled, setNavScrolled] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const wppBodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Navbar scroll
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Intersection Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
        }
      })
    }, { threshold: 0.12 })
    
    document.querySelectorAll('.reveal, .feature-card, .step, .price-card').forEach(el => observer.observe(el))
    
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // WhatsApp mockup
    const conv = [
      { type: 'bot', text: 'Olá! 👋 Sou a assistente virtual da empresa. Como posso te ajudar hoje?', delay: 1200 },
      { type: 'bot', text: 'Temos o plano Pro por R$ 197/mês com até 3 bots e 5.000 mensagens. É o mais vendido! 🔥', delay: 2600 },
      { type: 'user', text: 'Que funcionalidades tem no Pro?', delay: 4200 },
      { type: 'bot', text: 'No Pro você tem: Roteador de Atendimento, Disparo de Campanhas, WhatsApp + Instagram e Suporte Prioritário! ✅', delay: 5800 },
      { type: 'user', text: 'Perfeito! Como eu começo?', delay: 7600 },
      { type: 'bot', text: 'Clique em "Assinar Plano Pro" abaixo e configure em menos de 5 minutos! 🚀', delay: 9000 },
    ]
    
    let convIndex = 0
    let timeoutId: NodeJS.Timeout

    const addMsg = (m: any) => {
      if (!wppBodyRef.current) return
      const div = document.createElement('div')
      div.className = 'msg msg-' + (m.type === 'bot' ? 'bot' : 'user')
      div.innerHTML = m.text + '<div class="msg-time">' + (m.type === 'bot' ? 'AxonFlow' : 'Você') + '</div>'
      wppBodyRef.current.appendChild(div)
      wppBodyRef.current.scrollTop = wppBodyRef.current.scrollHeight
    }

    const runConv = () => {
      if (convIndex >= conv.length) {
        timeoutId = setTimeout(() => {
          if (wppBodyRef.current) {
            wppBodyRef.current.innerHTML = '<div class="msg msg-user">Oi! Vi o anúncio de vocês. Quanto custa o plano pro?<div class="msg-time">Você</div></div>'
          }
          convIndex = 0
          runConv()
        }, 3000)
        return
      }
      const delay = convIndex === 0 ? conv[0].delay : conv[convIndex].delay - conv[convIndex - 1].delay
      timeoutId = setTimeout(() => {
        addMsg(conv[convIndex])
        convIndex++
        runConv()
      }, delay)
    }

    timeoutId = setTimeout(runConv, 800)

    return () => clearTimeout(timeoutId)
  }, [])

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index)
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <div className={`landing-wrapper ${showSplash ? 'h-screen overflow-hidden' : ''}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showSplash ? 0 : 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <nav id="navbar" className={navScrolled ? 'scrolled' : ''}>
        <div className="nav-inner">
          <Link href="#" className="nav-logo">Axon<span>Flow</span></Link>
          <ul className="nav-links">
            <li><a href="#features">Funcionalidades</a></li>
            <li><a href="#how">Como Funciona</a></li>
            <li><a href="#pricing">Planos</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <div className="nav-ctas">
            <a href="https://flow.axoninteligencia.com.br/login" className="btn-ghost">Login</a>
            <a href="/register" className="btn-primary">Começar Grátis</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-pill">IA treinada com a sua voz</div>
            <h1>Seu funcionário mais dedicado <span className="highlight">nunca dorme.</span></h1>
            <p className="hero-sub">O AxonFlow conecta uma IA ao seu WhatsApp e Instagram — fechando vendas no automático, 24h por dia, 7 dias por semana.</p>
            <div className="hero-ctas">
              <a href="/register" className="btn-primary" style={{ padding: '14px 28px', fontSize: '15px' }}>Criar conta grátis →</a>
              <a href="#how" className="btn-ghost" style={{ padding: '14px 28px', fontSize: '15px' }}>Ver como funciona</a>
            </div>
            <div className="hero-proof">
              <div className="hero-proof-dots">
                <div className="proof-dot">⚡</div>
                <div className="proof-dot">C</div>
                <div className="proof-dot">M</div>
                <div className="proof-dot">R</div>
              </div>
              <span>+500 empresas automatizando hoje</span>
            </div>
          </div>
          <div className="wpp-phone" id="wpp-mockup">
            <div className="wpp-header">
              <div className="wpp-avatar">🤖</div>
              <div>
                <div className="wpp-name">AxonFlow Bot</div>
                <div className="wpp-status">● Online agora</div>
              </div>
            </div>
            <div className="wpp-body" id="wpp-body" ref={wppBodyRef}>
              <div className="msg msg-user">Oi! Vi o anúncio de vocês. Quanto custa o plano pro?<div className="msg-time">Você</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <div className="logos-section">
        <div className="logos-label">Confiado por negócios de todos os setores</div>
        <div style={{ overflow: 'hidden' }}>
          <div className="logos-track">
            <span className="logo-item">🏠 Imobiliárias</span>
            <span className="logo-item">🍕 Restaurantes</span>
            <span className="logo-item">💊 Clínicas</span>
            <span className="logo-item">👗 E-commerce</span>
            <span className="logo-item">🚗 Concessionárias</span>
            <span className="logo-item">💇 Salões</span>
            <span className="logo-item">🎓 Educação</span>
            <span className="logo-item">🏋️ Academias</span>
            <span className="logo-item">🏠 Imobiliárias</span>
            <span className="logo-item">🍕 Restaurantes</span>
            <span className="logo-item">💊 Clínicas</span>
            <span className="logo-item">👗 E-commerce</span>
            <span className="logo-item">🚗 Concessionárias</span>
            <span className="logo-item">💇 Salões</span>
            <span className="logo-item">🎓 Educação</span>
            <span className="logo-item">🏋️ Academias</span>
          </div>
        </div>
      </div>

      {/* PROBLEMA vs SOLUÇÃO */}
      <section>
        <div className="section-inner">
          <div className="reveal">
            <div className="section-eyebrow">O problema</div>
            <h2 className="section-title">Chega de perder vendas por<br/>falta de resposta rápida</h2>
          </div>
          <div className="problem-grid">
            <div className="problem-card reveal">
              <div className="card-label bad">❌ Sem AxonFlow</div>
              <div className="list-item"><span className="list-icon x">✕</span><span>Responde clientes no WhatsApp à meia-noite pelo celular</span></div>
              <div className="list-item"><span className="list-icon x">✕</span><span>Perde vendas porque demorou 30 min para responder</span></div>
              <div className="list-item"><span className="list-icon x">✕</span><span>Funcionário esquece de fazer o follow-up</span></div>
              <div className="list-item"><span className="list-icon x">✕</span><span>Clientes percebem que é um bot genérico e sem personalidade</span></div>
              <div className="list-item"><span className="list-icon x">✕</span><span>Não consegue escalar sem contratar mais pessoas</span></div>
            </div>
            <div className="solution-card reveal" style={{ transitionDelay: '.15s' }}>
              <div className="card-label good">✓ Com AxonFlow</div>
              <div className="list-item"><span className="list-icon check">✓</span><span>Bot responde instantaneamente, 24h, sem você precisar estar online</span></div>
              <div className="list-item"><span className="list-icon check">✓</span><span>Zero vendas perdidas por falta de resposta rápida</span></div>
              <div className="list-item"><span className="list-icon check">✓</span><span>Follow-up automático no momento certo, sem falhas</span></div>
              <div className="list-item"><span className="list-icon check">✓</span><span>IA que soa exatamente como você — indetectável</span></div>
              <div className="list-item"><span className="list-icon check">✓</span><span>Escala infinita sem aumentar sua equipe</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ background: 'var(--bg2)' }}>
        <div className="section-inner">
          <div className="reveal">
            <div className="section-eyebrow">Funcionalidades</div>
            <h2 className="section-title">Tudo que você precisa para<br/>vender no automático</h2>
            <p className="section-sub">Cada funcionalidade foi criada para resolver um problema real de quem atende pelo WhatsApp.</p>
          </div>
          <div className="features-grid" id="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎙️</div>
              <div className="feature-title">Ouvido Biônico</div>
              <div className="feature-desc">Transcreve áudios automaticamente. Seu bot entende clientes que preferem falar ao invés de digitar.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🥷</div>
              <div className="feature-title">AI Stealth Spin</div>
              <div className="feature-desc">Cada resposta soa diferente da anterior. Seus clientes não percebem que estão falando com uma IA.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <div className="feature-title">WhatsApp + Instagram</div>
              <div className="feature-desc">Um único painel, dois canais. Configure uma vez e atenda clientes de onde eles preferirem.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔀</div>
              <div className="feature-title">Roteador de Atendimento</div>
              <div className="feature-desc">Direciona para o humano certo no momento certo, quando o cliente realmente precisa de atenção especial.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📣</div>
              <div className="feature-title">Disparo de Campanhas</div>
              <div className="feature-desc">Envie mensagens em massa para toda sua base de clientes com alta taxa de entrega e abertura.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <div className="feature-title">Modelos de IA Avançados</div>
              <div className="feature-desc">Suporte nativo a <strong>Groq, Gemini e demais agentes de IA</strong>. Treine o bot com seus próprios textos, FAQ e estilo de comunicação. (O uso das IAs é opcional e cobrado como adicional fora do plano escolhido).</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="section-inner">
          <div className="reveal">
            <div className="section-eyebrow">Como funciona</div>
            <h2 className="section-title">Da configuração à venda<br/>em menos de 1 hora</h2>
          </div>
          <div className="steps-container" id="steps">
            <div className="step">
              <div className="step-num">01</div>
              <div className="step-content">
                <div className="step-title">Crie seu bot</div>
                <div className="step-desc">Dê um nome, personalidade e carregue os textos da sua empresa. A IA aprende tudo sobre o seu negócio em minutos e começa a responder como você.</div>
              </div>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <div className="step-content">
                <div className="step-title">Conecte seus canais</div>
                <div className="step-desc">WhatsApp e Instagram conectados em menos de 2 minutos. Sem código, sem técnico, sem complicação. Só seguir o passo a passo.</div>
              </div>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <div className="step-content">
                <div className="step-title">Venda no automático</div>
                <div className="step-desc">Seu bot começa a responder e fechar negócios imediatamente. Você monitora tudo pelo painel e intervém só quando quiser.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section style={{ background: 'var(--bg2)' }}>
        <div className="section-inner">
          <div className="reveal">
            <div className="section-eyebrow">Depoimentos</div>
            <h2 className="section-title">Quem já usa não volta atrás</h2>
          </div>
          <div className="testimonials-wrapper">
            <div className="testimonials-track">
              {[
                { text: "Meu WhatsApp virou uma máquina de vendas. Em 3 dias o bot já tinha recuperado o valor do investimento inteiro.", name: "Carlos Mendes", role: "Imobiliária Mendes, SP", img: "https://i.pravatar.cc/150?u=carlos" },
                { text: "O bot soa exatamente como minha equipe. Vários clientes me perguntaram se era a 'Carol' respondendo. É incrível.", name: "Ana Paula", role: "Clínica Estética Renova", img: "https://i.pravatar.cc/150?u=anapaula" },
                { text: "Aumentei 40% no faturamento sem contratar ninguém. O AxonFlow atende mais clientes do que toda minha equipe junta.", name: "Rafael Santos", role: "E-commerce de Moda", img: "https://i.pravatar.cc/150?u=rafael" },
                { text: "Antes eu passava horas respondendo no WhatsApp. Hoje acordo e já tenho agendamentos confirmados. Mudou minha vida.", name: "Mariana Lima", role: "Studio de Pilates, MG", img: "https://i.pravatar.cc/150?u=mariana" },
                { text: "Surreal a facilidade de configuração. Subi meu PDF de vendas e a IA aprendeu todos os meus produtos na hora.", name: "Diego Ferreira", role: "Agência de Marketing", img: "https://i.pravatar.cc/150?u=diego" },
                { text: "Meus clientes elogiam a rapidez no atendimento. O bot nunca dorme e sempre é educado, mesmo de madrugada.", name: "Juliana Costa", role: "Restaurante e Delivery", img: "https://i.pravatar.cc/150?u=juliana" },
                { text: "Meu WhatsApp virou uma máquina de vendas. Em 3 dias o bot já tinha recuperado o valor do investimento inteiro.", name: "Carlos Mendes", role: "Imobiliária Mendes, SP", img: "https://i.pravatar.cc/150?u=carlos" },
                { text: "O bot soa exatamente como minha equipe. Vários clientes me perguntaram se era a 'Carol' respondendo. É incrível.", name: "Ana Paula", role: "Clínica Estética Renova", img: "https://i.pravatar.cc/150?u=anapaula" },
                { text: "Aumentei 40% no faturamento sem contratar ninguém. O AxonFlow atende mais clientes do que toda minha equipe junta.", name: "Rafael Santos", role: "E-commerce de Moda", img: "https://i.pravatar.cc/150?u=rafael" },
                { text: "Antes eu passava horas respondendo no WhatsApp. Hoje acordo e já tenho agendamentos confirmados. Mudou minha vida.", name: "Mariana Lima", role: "Studio de Pilates, MG", img: "https://i.pravatar.cc/150?u=mariana" },
                { text: "Surreal a facilidade de configuração. Subi meu PDF de vendas e a IA aprendeu todos os meus produtos na hora.", name: "Diego Ferreira", role: "Agência de Marketing", img: "https://i.pravatar.cc/150?u=diego" },
                { text: "Meus clientes elogiam a rapidez no atendimento. O bot nunca dorme e sempre é educado, mesmo de madrugada.", name: "Juliana Costa", role: "Restaurante e Delivery", img: "https://i.pravatar.cc/150?u=juliana" },
              ].map((t, i) => (
                <motion.div 
                  key={i}
                  className="testimonial"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (i % 6) * 0.1 }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5, 
                    rotateX: 5, 
                    boxShadow: "0 20px 40px rgba(0,230,118,0.1)",
                    borderColor: "rgba(0,230,118,0.4)"
                  }}
                  style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                >
                  <div className="stars" style={{ transform: 'translateZ(20px)' }}>★★★★★</div>
                  <p className="testimonial-text" style={{ transform: 'translateZ(30px)' }}>"{t.text}"</p>
                  <div className="testimonial-author" style={{ transform: 'translateZ(40px)' }}>
                    <div className="author-avatar" style={{ overflow: 'hidden', padding: 0, border: '2px solid rgba(0,230,118,0.3)' }}>
                      <img src={t.img} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div className="author-name">{t.name}</div>
                      <div className="author-role">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="section-inner">
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 0 }}>
            <div className="section-eyebrow" style={{ textAlign: 'center' }}>Planos</div>
            <h2 className="section-title" style={{ textAlign: 'center', margin: '0 auto 12px' }}>Invista no seu crescimento</h2>
            <p className="section-sub" style={{ textAlign: 'center', margin: '0 auto' }}>Sem contrato. Cancele quando quiser. Suporte 100% em português.</p>
          </div>
          <div className="pricing-grid" id="pricing-grid">
            <div className="price-card">
              <div className="price-name">Starter</div>
              <div className="price-amount">R$ 97</div>
              <div className="price-period">por mês</div>
              <hr className="price-divider"/>
              <ul className="price-features">
                <li>1 Bot Ativo</li>
                <li>1.000 Mensagens/mês</li>
                <li>WhatsApp + Instagram</li>
                <li>Suporte via Email</li>
                <li>Dashboard completo</li>
              </ul>
              <a href="/register" className="btn-price secondary">Começar Starter</a>
            </div>
            <div className="price-card featured">
              <div className="price-badge">⭐ Mais Vendido</div>
              <div className="price-name">Pro</div>
              <div className="price-amount">R$ 197</div>
              <div className="price-period">por mês</div>
              <hr className="price-divider"/>
              <ul className="price-features">
                <li>Até 3 Bots Ativos</li>
                <li>5.000 Mensagens/mês</li>
                <li>Roteador de Atendimento</li>
                <li>Disparo de Campanhas</li>
                <li>AI Stealth Spin</li>
                <li>Suporte Prioritário</li>
              </ul>
              <a href="/register" className="btn-price primary-btn">Assinar Plano Pro</a>
            </div>
            <div className="price-card">
              <div className="price-name">Enterprise</div>
              <div className="price-amount">R$ 497</div>
              <div className="price-period">por mês</div>
              <hr className="price-divider"/>
              <ul className="price-features">
                <li>Bots Ilimitados</li>
                <li>Mensagens Ilimitadas</li>
                <li>AI Stealth Spin Anti-Ban</li>
                <li>Suporte VIP 24/7</li>
                <li>Onboarding Dedicado</li>
                <li>API Access</li>
              </ul>
              <a href="/register" className="btn-price secondary">Começar Enterprise</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ background: 'var(--bg2)' }}>
        <div className="section-inner" style={{ maxWidth: '720px' }}>
          <div className="reveal" style={{ textAlign: 'center' }}>
            <div className="section-eyebrow" style={{ textAlign: 'center' }}>FAQ</div>
            <h2 className="section-title" style={{ textAlign: 'center' }}>Perguntas frequentes</h2>
          </div>
          <div className="faq-list">
            {[
              { q: 'Preciso saber programar para usar o AxonFlow?', a: 'Não. O AxonFlow foi criado para empreendedores, não para programadores. Toda a configuração é feita por uma interface visual intuitiva. Se você sabe usar o WhatsApp, você sabe usar o AxonFlow.' },
              { q: 'O bot funciona com qualquer tipo de negócio?', a: 'Sim. Já temos clientes em mais de 20 segmentos: imobiliárias, clínicas, restaurantes, e-commerces, salões, academias, concessionárias e muito mais. A IA se adapta à linguagem e ao processo de vendas de cada nicho.' },
              { q: 'Meus clientes vão perceber que é uma IA?', a: 'Dificilmente. Nossa tecnologia AI Stealth Spin garante que cada resposta soe diferente e natural. Você treina o bot com seus próprios textos e personalidade, então ele fala como você — não como um robô genérico.' },
              { q: 'Como é feita a integração com o WhatsApp?', a: 'Você conecta seu número de WhatsApp Business pelo painel do AxonFlow em menos de 2 minutos, escaneando um QR Code. Sem precisar de API oficial (que é cara e burocrática) para começar.' },
              { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem multas e sem burocracia. Você pode cancelar sua assinatura a qualquer momento pelo próprio painel. Acreditamos que você fica porque quer, não porque é obrigado.' },
              { q: 'O que acontece se eu ultrapassar o limite de mensagens?', a: 'Você recebe uma notificação antes de atingir o limite e pode fazer upgrade do plano com um clique. Nunca cortamos seu serviço sem aviso — seu negócio não para.' },
            ].map((item, idx) => (
              <div key={idx} className={`faq-item ${faqOpen === idx ? 'open' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(idx)}>
                  {item.q}<span className="faq-chevron">▼</span>
                </div>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <div className="cta-final">
        <div className="cta-final-inner reveal">
          <h2>Seu concorrente já está<br/>usando IA. <span style={{ color: 'var(--neon)' }}>E você?</span></h2>
          <p>Comece grátis hoje. Configure em minutos. Venda no automático amanhã.</p>
          <a href="/register" className="btn-cta">Criar minha conta grátis →</a>
          <div className="cta-note">✦ Sem cartão de crédito · Cancele quando quiser · Suporte em português</div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-logo">Axon<span>Flow</span></div>
          <div className="footer-tagline">Automação Inteligente para o seu negócio</div>
          <div className="footer-links">
            <a href="#">Privacidade</a><a href="#">Termos de Uso</a><a href="#">Contato</a><a href="#">Blog</a>
          </div>
          <div className="footer-copy">© 2026 AxonFlow Inteligência. Todos os direitos reservados.</div>
        </div>
      </footer>
        </motion.div>
      </div>
    </>
  )
}
