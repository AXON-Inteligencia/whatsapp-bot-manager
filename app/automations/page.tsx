"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAppStore } from "@/lib/store"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Bot as BotIcon, 
  Settings,
  Sparkles,
  Key,
  MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Bot } from "@/lib/types"

export default function AutomationsPage() {
  const bots = useAppStore((state) => state.bots)
  const updateBot = useAppStore((state) => state.updateBot)

  const [editingBot, setEditingBot] = useState<Bot | null>(null)
  
  const [formData, setFormData] = useState({
    enabled: false,
    apiKey: "",
    systemPrompt: "",
  })

  const openEditDialog = (bot: Bot) => {
    setFormData({
      enabled: bot.aiSettings?.enabled || false,
      apiKey: bot.aiSettings?.apiKey || "",
      systemPrompt: bot.aiSettings?.systemPrompt || "Aja como um vendedor experiente do AxonFlow. Seu objetivo é responder dúvidas e convencer o cliente a assinar.",
    })
    setEditingBot(bot)
  }

  const handleUpdate = () => {
    if (!editingBot) return

    updateBot(editingBot.id, {
      aiSettings: {
        enabled: formData.enabled,
        apiKey: formData.apiKey,
        systemPrompt: formData.systemPrompt,
      }
    })
    
    setEditingBot(null)
    toast.success("Configurações de IA salvas com sucesso!")
  }

  return (
    <DashboardLayout title="Agentes de IA" description="Configure inteligência artificial para seus bots fecharem vendas sozinhos">
      {/* Informative Banner */}
      <Card className="bg-primary/5 border-primary/20 mb-6">
        <CardContent className="p-6 flex gap-4 items-start">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Cérebro IA Integrado (Google Gemini)</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">
              Transforme seus bots em vendedores automáticos. Cole sua chave de API gratuita do Google Gemini, ensine como o bot deve se comportar e deixe-o responder objeções, tirar dúvidas e fechar vendas no WhatsApp 24/7.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot) => (
          <Card 
            key={bot.id} 
            className={cn(
              "bg-card border-border transition-colors",
              bot.aiSettings?.enabled && "border-primary shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    bot.aiSettings?.enabled ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  )}>
                    <BotIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{bot.name}</h3>
                    <p className="text-sm text-muted-foreground">{bot.phone}</p>
                  </div>
                </div>
                <Badge variant={bot.aiSettings?.enabled ? "default" : "secondary"}>
                  {bot.aiSettings?.enabled ? "IA Ativa" : "Desativado"}
                </Badge>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Key className="w-4 h-4" />
                  {bot.aiSettings?.apiKey ? "Chave API configurada" : "Sem Chave API"}
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {bot.aiSettings?.systemPrompt || "Nenhum comportamento definido"}
                  </span>
                </div>
              </div>

              <Button 
                variant={bot.aiSettings?.enabled ? "secondary" : "default"} 
                className="w-full gap-2" 
                onClick={() => openEditDialog(bot)}
              >
                <Settings className="w-4 h-4" />
                Configurar Cérebro IA
              </Button>
            </CardContent>
          </Card>
        ))}

        {bots.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <p>Nenhum bot conectado.</p>
            <p className="text-sm mt-1">Conecte um bot primeiro para poder configurar a Inteligência Artificial.</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingBot} onOpenChange={(open) => !open && setEditingBot(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Configurar Cérebro IA para {editingBot?.name}
            </DialogTitle>
            <DialogDescription>
              Treine seu bot para fechar vendas e responder clientes automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div>
                <Label className="text-base">Ativar Inteligência Artificial</Label>
                <p className="text-sm text-muted-foreground">O bot começará a responder automaticamente todas as mensagens novas.</p>
              </div>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(c) => setFormData({ ...formData, enabled: c })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Chave de API do Groq Cloud (Gratuita)
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="gsk_..."
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Pegue sua chave gratuitamente no <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">Groq Console</a>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comportamento (Treinamento do Vendedor)
              </Label>
              <Textarea
                id="systemPrompt"
                placeholder="Aja como um vendedor experiente. Seja educado, tire dúvidas sobre o sistema AxonFlow e tente sempre fechar a venda do Plano Pro no valor de R$97. Nunca invente informações."
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                className="min-h-[120px] resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Descreva detalhadamente como o bot deve agir, quais produtos ele vende, o preço, e as regras que ele não pode quebrar.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBot(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
