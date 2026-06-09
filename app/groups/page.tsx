"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAppStore } from "@/lib/store"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Users, 
  Download,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Group,
  RefreshCw,
  Globe
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import Papa from "papaparse"

interface GroupResult {
  id: string
  name: string
  description: string
  participantCount: number
  createdAt: string | null
  owner: string
}

interface GroupMember {
  id: string
  phone: string
  isAdmin: boolean
  role: string
}

export default function GroupsPage() {
  const bots = useAppStore((state) => state.bots)
  const addContact = useAppStore((state) => state.addContact)
  const contacts = useAppStore((state) => state.contacts)

  const [selectedBotId, setSelectedBotId] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<GroupResult[]>([])
  const [searched, setSearched] = useState(false)

  const [selectedGroup, setSelectedGroup] = useState<GroupResult | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [importingMembers, setImportingMembers] = useState(false)

  const onlineBots = bots.filter((b) => b.status === "online")

  const handleSearch = async () => {
    if (!selectedBotId) {
      toast.error("Selecione um bot conectado para buscar grupos")
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const params = new URLSearchParams({ botId: selectedBotId })
      if (searchQuery.trim()) params.append("query", searchQuery.trim())

      const res = await fetch(`/api/whatsapp/groups?${params}`)
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erro ao buscar grupos")
        setGroups([])
        return
      }

      setGroups(data.groups || [])

      if (data.groups?.length === 0) {
        toast.info(searchQuery ? `Nenhum grupo encontrado para "${searchQuery}"` : "Nenhum grupo encontrado")
      } else {
        toast.success(`${data.groups.length} grupos encontrados`)
      }
    } catch (err: any) {
      toast.error("Erro de conexão: " + err.message)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewMembers = async (group: GroupResult) => {
    setSelectedGroup(group)
    setMembers([])
    setIsMembersOpen(true)
    setLoadingMembers(true)

    try {
      const res = await fetch("/api/whatsapp/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: selectedBotId, groupId: group.id }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erro ao buscar membros")
        return
      }

      setMembers(data.members || [])
    } catch (err: any) {
      toast.error("Erro ao buscar membros: " + err.message)
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleImportMembers = () => {
    if (members.length === 0) return
    setImportingMembers(true)

    let added = 0
    for (const member of members) {
      const phone = "+" + member.phone.replace(/\D/g, "")
      const exists = contacts.find((c) => c.phone.replace(/\D/g, "") === member.phone.replace(/\D/g, ""))
      if (!exists) {
        addContact({
          name: member.phone,
          phone,
          tags: [selectedGroup?.name || "grupo", member.isAdmin ? "admin" : "membro"],
        })
        added++
      }
    }

    setImportingMembers(false)
    toast.success(`${added} membros importados para Contatos! (${members.length - added} já existiam)`)
    setIsMembersOpen(false)
  }

  const handleExportMembers = () => {
    if (members.length === 0) return

    const data = members.map((m) => ({
      phone: "+" + m.phone.replace(/\D/g, ""),
      whatsapp_id: m.id,
      role: m.role,
      is_admin: m.isAdmin ? "Sim" : "Não",
      group: selectedGroup?.name || "",
    }))

    const csv = Papa.unparse(data)
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `membros_${selectedGroup?.name?.replace(/\s+/g, "_") || "grupo"}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`${members.length} membros exportados para CSV!`)
  }

  return (
    <DashboardLayout title="Busca de Grupos" description="Encontre grupos do WhatsApp e extraia contatos">
      <div className="flex items-center gap-2 mb-4">
        <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Link href="/groups/search">
            <Globe className="w-4 h-4" />
            Buscar Grupos na Internet
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/groups/extract">
            <Download className="w-4 h-4" />
            Extrair Membros
          </Link>
        </Button>
      </div>
      {/* Configuração de Busca */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Group className="w-4 h-4 text-primary" />
            Buscar Grupos do WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-48">
              <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione o bot" />
                </SelectTrigger>
                <SelectContent>
                  {onlineBots.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum bot online</SelectItem>
                  ) : (
                    onlineBots.map((bot) => (
                      <SelectItem key={bot.id} value={bot.id}>
                        {bot.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder='Ex: "academia", "vendas", "marketing", "investimentos"...'
                className="pl-9 bg-secondary border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading || !selectedBotId}
              className="gap-2 min-w-[120px]"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Buscando...</>
              ) : (
                <><Search className="w-4 h-4" /> Buscar Grupos</>
              )}
            </Button>
          </div>

          {onlineBots.length === 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-yellow-500 bg-yellow-500/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Nenhum bot online. Vá em <strong>Bots</strong> e conecte seu WhatsApp via QR Code primeiro.</span>
            </div>
          )}

          <div className="mt-3 text-xs text-muted-foreground">
            <strong>Como funciona:</strong> Esta ferramenta busca todos os grupos do WhatsApp em que o bot está participando e filtra pelo termo pesquisado. Para encontrar grupos de um tema específico, o bot precisa estar nesses grupos.
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {searched && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Grupos Encontrados
                {groups.length > 0 && (
                  <Badge variant="secondary">{groups.length} grupos</Badge>
                )}
              </CardTitle>
              {groups.length > 0 && (
                <Button variant="outline" size="sm" className="gap-2 h-8" onClick={handleSearch}>
                  <RefreshCw className="w-3 h-3" />
                  Atualizar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Buscando grupos no WhatsApp...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Group className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">Nenhum grupo encontrado</p>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  {searchQuery
                    ? `Não foram encontrados grupos com "${searchQuery}". Tente outro termo.`
                    : "O bot não está em nenhum grupo ainda."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Nome do Grupo</TableHead>
                    <TableHead className="hidden md:table-cell">Descrição</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {group.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{group.id.split("@")[0]}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">
                        {group.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Users className="w-3 h-3" />
                          {group.participantCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {group.createdAt
                          ? new Date(group.createdAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 h-8 text-xs"
                          onClick={() => handleViewMembers(group)}
                        >
                          <Users className="w-3 h-3" />
                          Ver Membros
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Membros */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Membros: {selectedGroup?.name}
            </DialogTitle>
            <DialogDescription>
              {loadingMembers
                ? "Carregando membros..."
                : `${members.length} membros encontrados no grupo`}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto border border-border rounded-lg">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Telefone</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member, i) => {
                    const phone = "+" + member.phone.replace(/\D/g, "")
                    const alreadyContact = contacts.find(
                      (c) => c.phone.replace(/\D/g, "") === member.phone.replace(/\D/g, "")
                    )
                    return (
                      <TableRow key={i} className="border-border">
                        <TableCell className="font-mono text-sm">{phone}</TableCell>
                        <TableCell>
                          {member.isAdmin ? (
                            <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Membro</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {alreadyContact ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" title="Já é contato" />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {!loadingMembers && members.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span>{members.filter(m => contacts.find(c => c.phone.replace(/\D/g, "") === m.phone.replace(/\D/g, ""))).length} já são seus contatos</span>
            </div>
          )}

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsMembersOpen(false)}>
              Fechar
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportMembers}
              disabled={loadingMembers || members.length === 0}
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
            <Button
              className="gap-2"
              onClick={handleImportMembers}
              disabled={loadingMembers || members.length === 0 || importingMembers}
            >
              {importingMembers ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Importar para Contatos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
