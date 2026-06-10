"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const AUTH_KEY = "whatsapp-admin-auth"

export default function SettingsPage() {
  const router = useRouter()
  const [theme, setTheme] = useState("dark")
  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [language, setLanguage] = useState("pt-BR")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Carregar configurações do localStorage
      const savedTheme = localStorage.getItem("theme") || "dark"
      const savedNotifications = localStorage.getItem("notifications") === "true"
      const savedEmailNotifications = localStorage.getItem("emailNotifications") === "true"
      const savedLanguage = localStorage.getItem("language") || "pt-BR"

      setTheme(savedTheme)
      setNotifications(savedNotifications)
      setEmailNotifications(savedEmailNotifications)
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSaveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)

    // Salvar configurações no localStorage
    localStorage.setItem("theme", theme)
    localStorage.setItem("notifications", notifications.toString())
    localStorage.setItem("emailNotifications", emailNotifications.toString())
    localStorage.setItem("language", language)

    setMessage("Configurações salvas com sucesso!")
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <DashboardLayout
      title="Configurações"
      description="Gerencie as preferências e configurações da sua conta."
    >
      <div className="flex flex-col gap-6">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Tema */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Tema</Label>
                <select
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-3 py-2 mt-1 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Idioma */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Idioma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="language">Idioma preferido</Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 mt-1 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (USA)</option>
                  <option value="es-ES">Español (España)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Integração Instagram (Fase 2) */}
          <Card className="bg-card border-border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent text-xl font-bold">Instagram</span>
                Integração Oficial (Meta)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaToken">Page Access Token (Meta Developers)</Label>
                <Input
                  id="metaToken"
                  type="password"
                  placeholder="EAAI..."
                  className="mt-1 bg-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="instaAccountId">Instagram Business Account ID</Label>
                <Input
                  id="instaAccountId"
                  type="text"
                  placeholder="178414..."
                  className="mt-1 bg-background border-border"
                />
              </div>
              <Button type="button" variant="outline" className="w-full sm:w-auto border-purple-500/50 hover:bg-purple-500/10 text-purple-400">
                Testar Conexão
              </Button>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  id="notifications"
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="notifications" className="cursor-pointer">
                  Ativar notificações no navegador
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="emailNotifications"
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="emailNotifications" className="cursor-pointer">
                  Receber notificações por email
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Conta */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Versão do Aplicativo</Label>
                <p className="text-sm text-muted-foreground mt-1">v1.0.0</p>
              </div>
              <div>
                <Label>Última atualização</Label>
                <p className="text-sm text-muted-foreground mt-1">09 de Maio de 2026</p>
              </div>
            </CardContent>
          </Card>

          {/* Mensagem de Sucesso */}
          {message && (
            <div className="p-4 bg-green-900/20 border border-green-700 rounded-md">
              <p className="text-sm text-green-400">{message}</p>
            </div>
          )}

          {/* Botão de Salvar */}
          <div className="flex gap-3">
            <Button type="submit" className="w-full sm:w-auto">
              Salvar Configurações
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
