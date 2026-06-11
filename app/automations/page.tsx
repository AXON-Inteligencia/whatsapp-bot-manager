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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    salesPrompt: "",
    supportPrompt: ""
  })

  const openEditDialog = (bot: Bot) => {
    setFormData({
      enabled: bot.aiSettings?.enabled || false,
      apiKey: bot.aiSettings?.apiKey || "",
      systemPrompt: bot.aiSettings?.systemPrompt || "",
      salesPrompt: bot.aiSettings?.salesPrompt || "",
      supportPrompt: bot.aiSettings?.supportPrompt || ""
    })
    setEditingBot(bot)
  }

  const handleUpdate = async () => {
    if (!editingBot) return

    try {
      await updateBot(editingBot.id, {
        aiSettings: {
          enabled: formData.enabled,
          apiKey: formData.apiKey,
          systemPrompt: formData.systemPrompt,
          salesPrompt: formData.salesPrompt,
          supportPrompt: formData.supportPrompt
        }
      })
      
      setEditingBot(null)
      toast.success("Cérebro de IA atualizado com sucesso!")
    } catch (error) {
      toast.error("Erro ao atualizar configurações")
    }
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
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
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
              <Label className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Treinamento dos Cérebros (Vendas & Suporte)
              </Label>
              <Tabs defaultValue="sales" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="sales">🎯 Vendas</TabsTrigger>
                  <TabsTrigger value="support">🛠 Suporte</TabsTrigger>
                </TabsList>
                <TabsContent value="sales">
                  <Textarea
                    placeholder="Aja como um vendedor experiente. Seja educado, tire dúvidas sobre o sistema e tente sempre fechar a venda..."
                    value={formData.salesPrompt || formData.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, salesPrompt: e.target.value })}
                    className="min-h-[120px] resize-y mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Comportamento do Cérebro de Vendas.
                  </p>
                </TabsContent>
                <TabsContent value="support">
                  <Textarea
                    placeholder="Aja como um técnico de suporte amigável. Ajude o cliente a resolver problemas e forneça passo a passos claros..."
                    value={formData.supportPrompt}
                    onChange={(e) => setFormData({ ...formData, supportPrompt: e.target.value })}
                    className="min-h-[120px] resize-y mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Comportamento do Cérebro de Suporte técnico.
                  </p>
                </TabsContent>
              </Tabs>
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
