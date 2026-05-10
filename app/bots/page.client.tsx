"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAppStore } from "@/lib/store"
import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Power, 
  Settings, 
  Trash2,
  QrCode,
  MessageSquare,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BotStatus } from "@/lib/types"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"

export default function BotsPage() {
  const { 
    bots, 
    fetchBots, 
    addBot, 
    updateBot, 
    deleteBot, 
    searchTerm, 
    setSearchTerm, 
    statusFilter, 
    setStatusFilter, 
    getFilteredBots,
    isLoading 
  } = useAppStore()

  useEffect(() => {
    fetchBots()
  }, [fetchBots])

  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBot, setEditingBot] = useState<string | null>(editId)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isQrOpen, setIsQrOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    description: "",
    status: "offline" as BotStatus,
  })

  const filteredBots = getFilteredBots()

  const handleCreate = async () => {
    if (!formData.name || !formData.phone) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }
    await addBot({
      name: formData.name,
      phone: formData.phone,
      description: formData.description,
      status: formData.status,
    })
    setFormData({ name: "", phone: "", description: "", status: "offline" })
    setIsCreateOpen(false)
    toast.success("Bot criado com sucesso!")
  }

  const handleUpdate = async () => {
    if (!editingBot || !formData.name || !formData.phone) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }
    await updateBot(editingBot, {
      name: formData.name,
      phone: formData.phone,
      description: formData.description,
    })
    setEditingBot(null)
    setFormData({ name: "", phone: "", description: "", status: "offline" })
    toast.success("Bot atualizado com sucesso!")
  }

  const openEditDialog = (botId: string) => {
    const bot = bots.find(b => b.id === botId)
    if (bot) {
      setFormData({
        name: bot.name,
        phone: bot.phone,
        description: bot.description || "",
        status: bot.status,
      })
      setEditingBot(botId)
    }
  }

  const handleConnect = async (botId: string) => {
    setIsQrOpen(true)
    setQrCode(null)
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId }),
      })
      const data = await res.json()
      if (data.qr) {
        setQrCode(data.qr)
        pollQrCode(botId)
      }
    } catch (e) {
      toast.error("Erro ao iniciar conexão")
    }
  }

  const pollQrCode = (botId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/whatsapp/qr?botId=${botId}`)
        const data = await res.json()
        if (data.qr) setQrCode(data.qr)
        if (data.status === 'online') {
          setQrCode(null)
          setIsQrOpen(false)
          clearInterval(interval)
          fetchBots()
          toast.success("WhatsApp conectado com sucesso!")
        }
      } catch (e) {
        console.error(e)
      }
    }, 3000)
    return () => clearInterval(interval)
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <DashboardLayout title="Bots" description="Gerencie todos os seus bots de WhatsApp">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar bots..."
              className="pl-9 bg-secondary border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BotStatus | "all")}>
            <SelectTrigger className="w-[140px] bg-secondary border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="connecting">Conectando</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Bot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo bot</DialogTitle>
              <DialogDescription>
                Preencha as informações para criar um novo bot de WhatsApp.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do bot</Label>
                <Input
                  id="name"
                  placeholder="Ex: Bot Vendas"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Número de telefone</Label>
                <Input
                  id="phone"
                  placeholder="+55 11 99999-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva a função deste bot..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Criar bot</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Conectar WhatsApp</DialogTitle>
              <DialogDescription>
                Escaneie o QR Code abaixo com o seu WhatsApp para conectar o bot.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg">
              {qrCode ? (
                <div className="p-4 bg-white rounded-xl shadow-sm border">
                  <QRCodeSVG
                    value={qrCode}
                    size={256}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                    includeMargin={true}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                </div>
              )}
            </div>
            <DialogFooter className="sm:justify-center">
              <p className="text-xs text-muted-foreground text-center">
                Abra o WhatsApp &gt; Configurações &gt; Dispositivos Conectados &gt; Conectar um dispositivo
              </p>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Power className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bots.filter(b => b.status === "online").length}</p>
              <p className="text-sm text-muted-foreground">Bots online</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bots.reduce((acc, b) => acc + (b.messages || 0), 0)}</p>
              <p className="text-sm text-muted-foreground">Mensagens enviadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-sm text-muted-foreground">Uptime médio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bots Grid */}
      {isLoading ? (
        <div className="py-20 text-center">Carregando bots...</div>
      ) : filteredBots.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-border rounded-xl">
          <div className="p-4 bg-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Nenhum bot encontrado</h3>
          <p className="text-muted-foreground max-w-xs mx-auto mt-1">
            Crie seu primeiro bot para começar a automatizar seu atendimento.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => setIsCreateOpen(true)}>
            Criar Bot
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBots.map((bot) => (
            <Card key={bot.id} className="bg-card border-border hover:border-primary/50 transition-colors group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold",
                      bot.status === "online" ? "bg-green-500/10 text-green-500" : "bg-secondary text-muted-foreground"
                    )}>
                      {bot.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-none mb-1">{bot.name}</h3>
                      <p className="text-sm text-muted-foreground">{bot.phone}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(bot.id)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(bot.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Bot
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={
                      bot.status === "online" ? "default" : 
                      bot.status === "connecting" ? "secondary" : "outline"
                    } className={cn(
                      bot.status === "online" && "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-none",
                      bot.status === "connecting" && "animate-pulse"
                    )}>
                      {bot.status === "online" ? "Online" : 
                       bot.status === "connecting" ? "Conectando..." : "Offline"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-secondary/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Mensagens</p>
                      <p className="font-bold">{bot.messages || 0}</p>
                    </div>
                    <div className="bg-secondary/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                      <p className="font-bold">{bot.uptime || "0%"}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    {bot.status === "offline" ? (
                      <Button 
                        className="flex-1 gap-2" 
                        onClick={() => handleConnect(bot.id)}
                      >
                        <QrCode className="w-4 h-4" />
                        Conectar
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="flex-1 gap-2 text-destructive hover:text-destructive"
                        onClick={() => handleConnect(bot.id)}
                      >
                        <Power className="w-4 h-4" />
                        Desconectar
                      </Button>
                    )}
                    <Button variant="secondary" size="icon" asChild>
                      <a href={`/conversations?botId=${bot.id}`}>
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingBot} onOpenChange={(open) => !open && setEditingBot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar bot</DialogTitle>
            <DialogDescription>
              Altere as informações do seu bot de WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do bot</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Número de telefone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição (opcional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBot(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o bot
              e todas as sessões associadas a ele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteBot(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </DashboardLayout>
    </Suspense>
  )
}
