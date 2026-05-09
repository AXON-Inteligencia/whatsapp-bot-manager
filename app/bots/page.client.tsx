"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAppStore } from "@/lib/store"
import { Suspense, useState } from "react"
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
  const bots = useAppStore((state) => state.bots)
  const addBot = useAppStore((state) => state.addBot)
  const updateBot = useAppStore((state) => state.updateBot)
  const deleteBot = useAppStore((state) => state.deleteBot)
  const toggleBotStatus = useAppStore((state) => state.toggleBotStatus)
  const searchTerm = useAppStore((state) => state.searchTerm)
  const setSearchTerm = useAppStore((state) => state.setSearchTerm)
  const statusFilter = useAppStore((state) => state.statusFilter)
  const setStatusFilter = useAppStore((state) => state.setStatusFilter)
  const getFilteredBots = useAppStore((state) => state.getFilteredBots)

  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBot, setEditingBot] = useState<string | null>(editId)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [activeBotId, setActiveBotId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    description: "",
    status: "offline" as BotStatus,
  })

  const filteredBots = getFilteredBots()
  const botToEdit = editingBot ? bots.find(b => b.id === editingBot) : null

  const handleCreate = () => {
    if (!formData.name || !formData.phone) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }
    addBot({
      name: formData.name,
      phone: formData.phone,
      description: formData.description,
      status: formData.status,
    })
    setFormData({ name: "", phone: "", description: "", status: "offline" })
    setIsCreateOpen(false)
    toast.success("Bot criado com sucesso!")
  }

  const handleUpdate = () => {
    if (!editingBot || !formData.name || !formData.phone) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }
    updateBot(editingBot, {
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

  const pollQrCode = async (botId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/whatsapp/qr?botId=${botId}`)
        const data = await res.json()
        if (data.qr) {
          setQrCode(data.qr)
        }
        if (data.status === 'online') {
          setQrCode(null)
          setIsQrOpen(false)
          clearInterval(interval)
          toast.success("WhatsApp conectado com sucesso!")
          // Atualizar estado local se necessário
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
            <div className="p-2 rounded-lg bg-chart-2/10">
              <MessageSquare className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {bots.reduce((acc, b) => acc + b.messages, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Mensagens hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-chart-3/10">
              <TrendingUp className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold">98.2%</p>
              <p className="text-sm text-muted-foreground">Uptime médio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBots.map((bot) => (
          <Card 
            key={bot.id} 
            className={cn(
              "bg-card border-border hover:border-primary/50 transition-colors",
              bot.status === "online" && "border-l-4 border-l-primary"
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold",
                      bot.status === "online"
                        ? "bg-primary/10 text-primary"
                        : bot.status === "connecting"
                        ? "bg-chart-3/10 text-chart-3"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {bot.name.charAt(4)?.toUpperCase() || bot.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{bot.name}</h3>
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
                    <DropdownMenuItem className="gap-2" onClick={() => {
                      if (bot.status === "offline") {
                        useAppStore.getState().connectBot(bot.id)
                        setActiveBotId(bot.id)
                        setIsQrOpen(true)
                        pollQrCode(bot.id)
                        toast.info("Iniciando conexão...")
                      } else {
                        toggleBotStatus(bot.id)
                        toast.success(`Bot ${bot.status === "online" ? "desativado" : "ativado"} com sucesso!`)
                      }
                    }}>
                      <Power className="w-4 h-4" />
                      {bot.status === "offline" ? "Conectar WhatsApp" : bot.status === "online" ? "Desativar" : "Ativar"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => {
                      setActiveBotId(bot.id)
                      setIsQrOpen(true)
                      pollQrCode(bot.id)
                    }}>
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(bot.id)}>
                      <Settings className="w-4 h-4" />
                      Configurar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="gap-2 text-destructive"
                      onClick={() => setDeleteId(bot.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {bot.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {bot.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-0",
                    bot.status === "online"
                      ? "bg-primary/10 text-primary"
                      : bot.status === "connecting"
                      ? "bg-chart-3/10 text-chart-3"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {bot.status === "online"
                    ? "Online"
                    : bot.status === "connecting"
                    ? "Conectando..."
                    : "Offline"}
                </Badge>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{bot.messages.toLocaleString()}</span> msg
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{bot.uptime}</span> up
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredBots.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-muted-foreground">Nenhum bot encontrado</p>
            <Button className="mt-4 gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Criar primeiro bot
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingBot} onOpenChange={() => setEditingBot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar bot</DialogTitle>
            <DialogDescription>
              Atualize as informações do bot {botToEdit?.name}.
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
              <Label htmlFor="edit-phone">Numero de telefone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
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
            <Button onClick={handleUpdate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bot?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O bot será permanentemente excluído junto com todas as suas configurações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteBot(deleteId)
                  toast.success("Bot excluído com sucesso!")
                }
                setDeleteId(null)
              }}
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
