"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAppStore } from "@/lib/store"
import { useState, useRef } from "react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Mail,
  Phone,
  MessageSquare,
  Trash2,
  Edit,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import Papa from "papaparse"

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return `${diffMins}min atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays < 7) return `${diffDays}d atrás`
  return date.toLocaleDateString("pt-BR")
}

export default function ContactsPage() {
  const contacts = useAppStore((state) => state.contacts)
  const addContact = useAppStore((state) => state.addContact)
  const updateContact = useAppStore((state) => state.updateContact)
  const deleteContact = useAppStore((state) => state.deleteContact)
  const importContacts = useAppStore((state) => state.importContacts)

  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)
  const importFileRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    tags: "",
  })

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const contactToEdit = editingContact ? contacts.find(c => c.id === editingContact) : null

  const handleCreate = () => {
    if (!formData.name || !formData.phone) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }
    addContact({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
    })
    setFormData({ name: "", phone: "", email: "", tags: "" })
    setIsCreateOpen(false)
    toast.success("Contato adicionado com sucesso!")
  }

  const handleUpdate = () => {
    if (!editingContact || !formData.name || !formData.phone) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }
    updateContact(editingContact, {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
    })
    setEditingContact(null)
    setFormData({ name: "", phone: "", email: "", tags: "" })
    toast.success("Contato atualizado com sucesso!")
  }

  const openEditDialog = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId)
    if (contact) {
      setFormData({
        name: contact.name,
        phone: contact.phone,
        email: contact.email || "",
        tags: contact.tags.join(", "),
      })
      setEditingContact(contactId)
    }
  }

  // ─── IMPORTAR CSV ──────────────────────────────────────────────
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data as any[]
        if (rows.length === 0) {
          toast.error("Arquivo CSV vazio ou sem dados válidos")
          return
        }

        const parsed = rows.map((row) => ({
          name: row.name || row.nome || row.Name || row.Nome || "",
          phone: row.phone || row.telefone || row.Phone || row.Telefone || row.numero || row.Numero || "",
          email: row.email || row.Email || "",
          tags: row.tags || row.Tags || "",
        })).filter((r) => r.phone)

        if (parsed.length === 0) {
          toast.error("Nenhum número de telefone encontrado. Certifique-se que o CSV tem uma coluna 'phone' ou 'telefone'.")
          return
        }

        setImportPreview(parsed)
        setIsImportOpen(true)
      },
      error: () => toast.error("Erro ao ler o arquivo CSV"),
    })

    e.target.value = ""
  }

  const confirmImport = () => {
    let added = 0
    for (const row of importPreview) {
      const exists = contacts.find(c => c.phone === row.phone)
      if (!exists) {
        addContact({
          name: row.name || row.phone,
          phone: row.phone,
          email: row.email || undefined,
          tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        })
        added++
      }
    }
    setIsImportOpen(false)
    setImportPreview([])
    toast.success(`${added} contatos importados com sucesso! (${importPreview.length - added} duplicados ignorados)`)
  }

  // ─── EXPORTAR CSV ──────────────────────────────────────────────
  const handleExport = () => {
    if (contacts.length === 0) {
      toast.error("Nenhum contato para exportar")
      return
    }

    const data = contacts.map((c) => ({
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      tags: c.tags.join(", "),
      totalMessages: c.totalMessages,
      lastContact: c.lastContact instanceof Date 
        ? c.lastContact.toLocaleDateString("pt-BR")
        : new Date(c.lastContact).toLocaleDateString("pt-BR"),
    }))

    const csv = Papa.unparse(data, {
      columns: ["name", "phone", "email", "tags", "totalMessages", "lastContact"],
    })

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `contatos_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`${contacts.length} contatos exportados!`)
  }

  // ─── EXPORTAR XLSX (via CSV com BOM para Excel) ────────────────
  const handleExportExcel = () => {
    if (contacts.length === 0) {
      toast.error("Nenhum contato para exportar")
      return
    }

    const headers = ["Nome", "Telefone", "Email", "Tags", "Total Mensagens", "Último Contato"]
    const rows = contacts.map((c) => [
      c.name,
      c.phone,
      c.email || "",
      c.tags.join(", "),
      c.totalMessages,
      c.lastContact instanceof Date 
        ? c.lastContact.toLocaleDateString("pt-BR")
        : new Date(c.lastContact).toLocaleDateString("pt-BR"),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `contatos_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`${contacts.length} contatos exportados para Excel!`)
  }

  return (
    <DashboardLayout title="Contatos" description="Gerencie sua lista de contatos">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 sm:max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
            className="pl-9 bg-secondary border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Botão Importar */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => importFileRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </Button>
          <input
            ref={importFileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportFile}
          />

          {/* Botão Exportar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar como CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar para Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar contato</DialogTitle>
                <DialogDescription>
                  Preencha as informações do novo contato.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    placeholder="+55 11 99999-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    placeholder="cliente, vip, marketing"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{contacts.length}</p>
              <p className="text-sm text-muted-foreground">Total de contatos</p>
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
                {contacts.reduce((acc, c) => acc + c.totalMessages, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Mensagens totais</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-chart-3/10">
              <Mail className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {contacts.filter(c => c.email).length}
              </p>
              <p className="text-sm text-muted-foreground">Com email</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Contato</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="hidden sm:table-cell">Tags</TableHead>
                <TableHead className="hidden md:table-cell">Mensagens</TableHead>
                <TableHead className="hidden lg:table-cell">Último contato</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                        {contact.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground md:hidden">{contact.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {contact.phone}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {contact.email || "-"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs bg-secondary border-0">
                          {tag}
                        </Badge>
                      ))}
                      {contact.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs bg-secondary border-0">
                          +{contact.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {contact.totalMessages.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatTimeAgo(contact.lastContact instanceof Date ? contact.lastContact : new Date(contact.lastContact))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Iniciar conversa
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(contact.id)}>
                          <Edit className="w-4 h-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="gap-2 text-destructive"
                          onClick={() => setDeleteId(contact.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredContacts.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum contato encontrado</p>
              <Button className="mt-4 gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                Adicionar contato
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar contato</DialogTitle>
            <DialogDescription>
              Atualize as informações de {contactToEdit?.name}.
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
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContact(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Confirmar Importação
            </DialogTitle>
            <DialogDescription>
              {importPreview.length} contatos encontrados no arquivo. Revise antes de importar.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importPreview.slice(0, 20).map((row, i) => {
                  const duplicate = contacts.find(c => c.phone === row.phone)
                  return (
                    <TableRow key={i} className={cn("border-border", duplicate && "opacity-50")}>
                      <TableCell className="text-sm">{row.name || "-"}</TableCell>
                      <TableCell className="text-sm font-mono">{row.phone}</TableCell>
                      <TableCell className="text-sm">{row.email || "-"}</TableCell>
                      <TableCell className="text-sm">{row.tags || "-"}</TableCell>
                      <TableCell>
                        {duplicate ? (
                          <AlertCircle className="w-4 h-4 text-yellow-500" title="Duplicado" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {importPreview.length > 20 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                ... e mais {importPreview.length - 20} contatos
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Novos contatos</span>
            <AlertCircle className="w-4 h-4 text-yellow-500 ml-3" />
            <span>Duplicados (serão ignorados)</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsImportOpen(false); setImportPreview([]) }}>
              Cancelar
            </Button>
            <Button onClick={confirmImport}>
              Importar {importPreview.filter(r => !contacts.find(c => c.phone === r.phone)).length} contatos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contato será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteContact(deleteId)
                  toast.success("Contato excluído com sucesso!")
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
  )
}
