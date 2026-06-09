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
  Zap,
  Play,
  Pause,
  Trash2,
  Edit,
  Clock,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function formatTimeAgo(date: Date | undefined): string {
  if (!date) return "Nunca"
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return `${diffMins}min atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  return `${diffDays}d atrás`
}

const triggerOptions = [
  "Novo contato",
  "Nova mensagem",
  "Fora do horário",
  "Agendado",
  "Fim do atendimento",
  "Palavra-chave",
]

export default function AutomationsPage() {
  const automations = useAppStore((state) => state.automations)
  const bots = useAppStore((state) => state.bots)
  const addAutomation = useAppStore((state) => state.addAutomation)
  const updateAutomation = useAppStore((state) => state.updateAutomation)
  const deleteAutomation = useAppStore((state) => state.deleteAutomation)
  const toggleAutomation = useAppStore((state) => state.toggleAutomation)

  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "",
    botId: "",
  })

  const filteredAutomations = automations.filter((automation) =>
    automation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    automation.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const automationToEdit = editingAutomation ? automations.find(a => a.id === editingAutomation) : null

  const handleCreate = () => {
    if (!formData.name || !formData.trigger || !formData.botId) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }
    addAutomation({
      name: formData.name,
      description: formData.description,
      trigger: formData.trigger,
      botId: formData.botId,
      isActive: true,
    })
    setFormData({ name: "", description: "", trigger: "", botId: "" })
    setIsCreateOpen(false)
    toast.success("Automação criada com sucesso!")
  }

  const handleUpdate = () => {
    if (!editingAutomation || !formData.name || !formData.trigger || !formData.botId) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }
    updateAutomation(editingAutomation, {
      name: formData.name,
      description: formData.description,
      trigger: formData.trigger,
      botId: formData.botId,
    })
    setEditingAutomation(null)
    setFormData({ name: "", description: "", trigger: "", botId: "" })
    toast.success("Automação atualizada com sucesso!")
  }

  const openEditDialog = (automationId: string) => {
    const automation = automations.find(a => a.id === automationId)
    if (automation) {
      setFormData({
        name: automation.name,
        description: automation.description,
        trigger: automation.trigger,
        botId: automation.botId,
      })
      setEditingAutomation(automationId)
    }
  }

  const getBotName = (botId: string) => {
    return bots.find(b => b.id === botId)?.name || "Bot removido"
  }

  const activeAutomations = automations.filter(a => a.isActive).length
  const totalExecutions = automations.reduce((acc, a) => acc + a.executions, 0)

  return (
    <DashboardLayout title="Automações" description="Configure fluxos automatizados para seus bots">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 sm:max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar automações..."
            className="pl-9 bg-secondary border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Automação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar automação</DialogTitle>
              <DialogDescription>
                Configure uma nova automação para seus bots.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da automação</Label>
                <Input
                  id="name"
                  placeholder="Ex: Boas-vindas"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o que esta automação faz..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger">Gatilho</Label>
                <Select 
                  value={formData.trigger} 
                  onValueChange={(v) => setFormData({ ...formData, trigger: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um gatilho" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerOptions.map((trigger) => (
                      <SelectItem key={trigger} value={trigger}>
                        {trigger}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bot">Bot</Label>
                <Select 
                  value={formData.botId} 
                  onValueChange={(v) => setFormData({ ...formData, botId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um bot" />
                  </SelectTrigger>
                  <SelectContent>
                    {bots.map((bot) => (
                      <SelectItem key={bot.id} value={bot.id}>
                        {bot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeAutomations}</p>
              <p className="text-sm text-muted-foreground">Automacoes ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-chart-2/10">
              <TrendingUp className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalExecutions.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Execucoes totais</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-chart-3/10">
              <Clock className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold">{automations.length}</p>
              <p className="text-sm text-muted-foreground">Total de automacoes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAutomations.map((automation) => (
          <Card 
            key={automation.id} 
            className={cn(
              "bg-card border-border transition-colors",
              automation.isActive && "border-l-4 border-l-primary"
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      automation.isActive ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Zap className={cn(
                        "w-5 h-5",
                        automation.isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{automation.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{automation.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={automation.isActive}
                    onCheckedChange={() => toggleAutomation(automation.id)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => toggleAutomation(automation.id)}>
                        {automation.isActive ? (
                          <>
                            <Pause className="w-4 h-4" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(automation.id)}>
                        <Edit className="w-4 h-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="gap-2 text-destructive"
                        onClick={() => setDeleteId(automation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Badge variant="outline" className="bg-secondary border-0">
                  {automation.trigger}
                </Badge>
                <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-0">
                  {getBotName(automation.botId)}
                </Badge>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-sm">
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{automation.executions.toLocaleString()}</span> execucoes
                </span>
                <span className="text-muted-foreground">
                  Ultima: {formatTimeAgo(automation.lastExecution)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAutomations.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-muted-foreground">Nenhuma automação encontrada</p>
            <Button className="mt-4 gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Criar primeira automação
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAutomation} onOpenChange={() => setEditingAutomation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar automacao</DialogTitle>
            <DialogDescription>
              Atualize as configuracoes de {automationToEdit?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descricao</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Gatilho</Label>
              <Select 
                value={formData.trigger} 
                onValueChange={(v) => setFormData({ ...formData, trigger: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerOptions.map((trigger) => (
                    <SelectItem key={trigger} value={trigger}>
                      {trigger}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bot</Label>
              <Select 
                value={formData.botId} 
                onValueChange={(v) => setFormData({ ...formData, botId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAutomation(null)}>
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
            <AlertDialogTitle>Excluir automacao?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A automacao sera permanentemente excluida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteAutomation(deleteId)
                setDeleteId(null)
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
