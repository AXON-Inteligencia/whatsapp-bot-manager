"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const AUTH_KEY = "whatsapp-admin-auth"

export default function HelpPage() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(AUTH_KEY)
      if (!stored) {
        router.replace("/login")
        return
      }
    }
  }, [router])

  const faqs = [
    {
      question: "Como criar um novo bot?",
      answer: "Acesse a seção 'Bots' no menu lateral e clique em 'Novo Bot'. Preencha as informações necessárias como nome, descrição e número de WhatsApp.",
    },
    {
      question: "Como gerenciar conversas?",
      answer: "Na seção 'Conversas', você pode visualizar todas as conversas ativas, histórico de mensagens e responder diretamente aos clientes.",
    },
    {
      question: "Como criar automações?",
      answer: "Acesse 'Automações' e clique em 'Nova Automação'. Configure gatilhos e ações para automatizar respostas e fluxos de trabalho.",
    },
    {
      question: "Como importar contatos?",
      answer: "Na seção 'Contatos', clique em 'Importar' e selecione um arquivo CSV com os dados dos contatos (Nome, Telefone, Email).",
    },
    {
      question: "Como visualizar analytics?",
      answer: "A seção 'Analytics' mostra métricas detalhadas sobre mensagens, taxa de resposta, performance dos bots e muito mais.",
    },
    {
      question: "Como gerenciar usuários?",
      answer: "Na seção 'Admin', você pode criar novos usuários, definir permissões e gerenciar acesso à plataforma.",
    },
  ]

  const guides = [
    {
      title: "Guia de Início Rápido",
      description: "Aprenda o básico sobre como usar o AxonFlow em poucos minutos.",
    },
    {
      title: "Configuração de Bots",
      description: "Passo a passo completo para configurar e conectar seus bots ao WhatsApp.",
    },
    {
      title: "Automações Avançadas",
      description: "Crie automações complexas com múltiplos gatilhos e ações.",
    },
    {
      title: "Integração com APIs",
      description: "Integre seus bots com APIs externas para funcionalidades avançadas.",
    },
  ]

  return (
    <DashboardLayout
      title="Ajuda"
      description="Centro de ajuda e documentação do AxonFlow."
    >
      <div className="flex flex-col gap-8">
        {/* Seção de Guias */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Guias de Uso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guides.map((guide, index) => (
              <Card key={index} className="bg-card border-border cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">{guide.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{guide.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Seção de FAQs */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Perguntas Frequentes (FAQ)</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base text-primary">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Seção de Contato */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Precisa de mais ajuda?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se você não encontrou a resposta que procurava, entre em contato com nosso time de suporte.
            </p>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Email:</strong>{" "}
                <a href="mailto:suporte@axon-ia.com" className="text-primary hover:underline">
                  suporte@axon-ia.com
                </a>
              </p>
              <p className="text-sm">
                <strong>WhatsApp:</strong>{" "}
                <a href="https://wa.me/5511999999999" className="text-primary hover:underline">
                  +55 11 99999-9999
                </a>
              </p>
              <p className="text-sm">
                <strong>Horário de atendimento:</strong> Segunda a Sexta, 9h às 18h (Horário de Brasília)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Versão */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <strong>Versão:</strong> 1.0.0
            </p>
            <p className="text-sm">
              <strong>Última atualização:</strong> 09 de Maio de 2026
            </p>
            <p className="text-sm">
              <strong>Status:</strong> <span className="text-green-400">Operacional</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
