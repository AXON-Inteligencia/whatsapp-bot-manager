"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAppStore } from "@/lib/store"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Users, 
  Download,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  ArrowLeft,
  Megaphone
} from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"
import Link from "next/link"

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

export default function GroupExtractPage() {
  const bots = useAppStore((state) => state.bots)
  const addContact = useAppStore((state) => state.addContact)
  const contacts = useAppStore((state) => state.contacts)

  const [selectedBotId, setSelectedBotId] = useState("")
  const [groupIdInput, setGroupIdInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<GroupResult[]>([])
  const [searched, setSearched] = useState(false)

  const [selectedGroup, setSelectedGroup] = useState<GroupResult | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [importingMembers, setImportingMembers] = useState(false)

  const onlineBots = bots.filter((b) => b.status === "online")

  const handleSearchGroups = async () => {
    if (!selectedBotId) {
      toast.error("Selecione um bot conectado")
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams({ botId: selectedBotId })
      if (searchQuery.trim()) params.append("query", searchQuery.trim())
      const res = await fetch(`/api/whatsapp/groups?${params}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Erro ao buscar grupos"); setGroups([]); return }
      setGroups(data.groups || [])
      if (!data.groups?.length) toast.info("Nenhum grupo encontrado")
      else toast.success(`${data.groups.length} grupos encontrados`)
    } catch (err: any) {
      toast.error("Erro: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExtractMembers = async (group: GroupResult) => {
    setSelectedGroup(group)
    setMembers([])
    setLoadingMembers(true)
    try {
      const res = await fetch("/api/whatsapp/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: selectedBotId, groupId: group.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Erro ao extrair membros"); return }
      setMembers(data.members || [])
      toast.success(`${data.members?.length || 0} membros extraídos de "${group.name}"`)
    } catch (err: any) {
      toast.error("Erro: " + err.message)
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleImportAllToContacts = () => {
    if (!members.length) return
    setImportingMembers(true)
    let added = 0
    for (const member of members) {
      const phone = "+" + member.phone.replace(/\D/g, "")
      const exists = contacts.find((c) => c.phone.replace(/\D/g, "") === member.phone.replace(/\D/g, ""))
      if (!exists) {
        addContact({
          name: phone,
          phone,
          tags: [selectedGroup?.name || "grupo", member.isAdmin ? "admin-grupo" : "membro-grupo"],
        })
        added++
      }
    }
    setImportingMembers(false)
    toast.success(`${added} contatos importados! Agora você pode criar uma campanha para eles.`)
  }

  const handleExportCSV = () => {
    if (!members.length) return
    const data = members.map((m) => ({
      nome: m.phone,
      telefone: "+" + m.phone.replace(/\D/g, ""),
      whatsapp_id: m.id,
      funcao: m.isAdmin ? "Admin" : "Membro",
      grupo: selectedGroup?.name || "",
    }))
    const csv = Papa.unparse(data)
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `membros_${(selectedGroup?.name || "grupo").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Planilha com ${members.length} membros exportada!`)
  }

  return (
    <DashboardLayout title="Extrair Membros de Grupos" description="Extraia contatos de grupos do WhatsApp para planilha ou campanha">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/groups" className="gap-2 flex items-center">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Grupos
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Busca de Grupos */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                1. Buscar Grupos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Bot conectado</Label>
                <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione o bot" />
                  </SelectTrigger>
                  <SelectContent>
                    {onlineBots.length === 0 ? (
                      <SelectItem value="none" disabled>Nenhum bot online</SelectItem>
                    ) : (
                      onlineBots.map((bot) => (
                        <SelectItem key={bot.id} value={bot.id}>{bot.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filtrar por nome (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder='Ex: "academia", "vendas"...'
                    className="bg-secondary border-border"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchGroups()}
                  />
                  <Button onClick={handleSearchGroups} disabled={loading || !selectedBotId}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {onlineBots.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 rounded p-2">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  Conecte um bot em "Bots" primeiro
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de grupos */}
          {searched && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Grupos ({groups.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : groups.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">Nenhum grupo encontrado</p>
                ) : (
                  <div className="divide-y divide-border">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className={`flex items-center justify-between px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors ${selectedGroup?.id === group.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                        onClick={() => handleExtractMembers(group)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {group.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{group.name}</p>
                            <p className="text-xs text-muted-foreground">{group.participantCount} membros</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0">
                          Extrair
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Membros Extraídos */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  2. Membros Extraídos
                  {members.length > 0 && (
                    <Badge variant="secondary">{members.length}</Badge>
                  )}
                </CardTitle>
                {selectedGroup && (
                  <Badge variant="outline" className="text-xs max-w-[150px] truncate">
                    {selectedGroup.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingMembers ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Extraindo membros...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Users className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {searched ? "Clique em um grupo para extrair os membros" : "Busque grupos primeiro"}
                  </p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Telefone</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member, i) => {
                        const phone = "+" + member.phone.replace(/\D/g, "")
                        const isContact = contacts.find(
                          (c) => c.phone.replace(/\D/g, "") === member.phone.replace(/\D/g, "")
                        )
                        return (
                          <TableRow key={i} className="border-border">
                            <TableCell className="font-mono text-sm">{phone}</TableCell>
                            <TableCell>
                              {member.isAdmin ? (
                                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">Admin</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Membro</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {isContact && <CheckCircle2 className="w-3 h-3 text-green-500" title="Já é contato" />}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações com os membros */}
          {members.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">3. O que fazer com os membros?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground mb-2">
                  {members.filter(m => contacts.find(c => c.phone.replace(/\D/g, "") === m.phone.replace(/\D/g, ""))).length} já são contatos •{" "}
                  {members.filter(m => !contacts.find(c => c.phone.replace(/\D/g, "") === m.phone.replace(/\D/g, ""))).length} novos
                </div>

                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={handleExportCSV}
                >
                  <Download className="w-4 h-4" />
                  Exportar Planilha CSV ({members.length} membros)
                </Button>

                <Button
                  className="w-full gap-2"
                  onClick={handleImportAllToContacts}
                  disabled={importingMembers}
                >
                  {importingMembers ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Importar para Contatos
                </Button>

                <Button
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  asChild
                >
                  <Link href="/campaigns">
                    <Megaphone className="w-4 h-4" />
                    Criar Campanha para estes Contatos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
