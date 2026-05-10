"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
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
import { 
  Search,
  Users,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Share2
} from "lucide-react"
import { toast } from "sonner"
import { Bot } from "@/lib/types"

interface Group {
  id: string
  name: string
  description: string
  participantCount: number
  createdAt: string | null
  owner: string
}

interface Member {
  id: string
  phone: string
  isAdmin: boolean
  role: string
}

interface GroupExtractorProps {
  bots: Bot[]
  onMembersExtracted?: (members: Member[], groupName: string) => void
}

export function GroupExtractor({ bots, onMembersExtracted }: GroupExtractorProps) {
  const [selectedBotId, setSelectedBotId] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [showMembersDialog, setShowMembersDialog] = useState(false)
  const [extractProgress, setExtractProgress] = useState(0)

  const onlineBots = bots.filter((b) => b.status === "online")

  const searchGroups = useCallback(async () => {
    if (!selectedBotId) {
      toast.error("Selecione um bot")
      return
    }

    setIsLoadingGroups(true)
    try {
      const res = await fetch(
        `/api/whatsapp/groups?botId=${selectedBotId}&query=${encodeURIComponent(searchQuery)}`
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao buscar grupos")
      }

      const data = await res.json()
      setGroups(data.groups || [])
      toast.success(`${data.total} grupos encontrados`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoadingGroups(false)
    }
  }, [selectedBotId, searchQuery])

  const extractMembers = useCallback(async (group: Group) => {
    if (!selectedBotId) {
      toast.error("Selecione um bot")
      return
    }

    setSelectedGroup(group)
    setIsLoadingMembers(true)
    setExtractProgress(0)

    try {
      const res = await fetch("/api/whatsapp/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: selectedBotId,
          groupId: group.id,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao extrair membros")
      }

      const data = await res.json()
      setMembers(data.members || [])
      setExtractProgress(100)
      setShowMembersDialog(true)
      toast.success(`${data.total} membros extraídos`)

      onMembersExtracted?.(data.members, group.name)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoadingMembers(false)
    }
  }, [selectedBotId, onMembersExtracted])

  const exportToCSV = useCallback(() => {
    if (members.length === 0) {
      toast.error("Nenhum membro para exportar")
      return
    }

    const csv = [
      ["Telefone", "Admin", "Função"].join(","),
      ...members.map((m) => [m.phone, m.isAdmin ? "Sim" : "Não", m.role].join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `membros_${selectedGroup?.name || "grupo"}_${Date.now()}.csv`
    link.click()

    toast.success("Arquivo exportado com sucesso!")
  }, [members, selectedGroup])

  const copyPhonesToClipboard = useCallback(() => {
    if (members.length === 0) {
      toast.error("Nenhum membro para copiar")
      return
    }

    const phones = members.map((m) => m.phone).join("\n")
    navigator.clipboard.writeText(phones)
    toast.success(`${members.length} telefones copiados!`)
  }, [members])

  const getGroupLink = useCallback(async (group: Group) => {
    if (!selectedBotId) {
      toast.error("Selecione um bot")
      return
    }

    try {
      const res = await fetch("/api/whatsapp/groups/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: selectedBotId,
          groupId: group.id,
        }),
      })

      if (!res.ok) {
        throw new Error("Erro ao obter link do grupo")
      }

      const data = await res.json()
      const link = data.link

      navigator.clipboard.writeText(link)
      toast.success("Link do grupo copiado!")
    } catch (error: any) {
      toast.error(error.message)
    }
  }, [selectedBotId])

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Grupos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot-select">Bot WhatsApp</Label>
            <Select value={selectedBotId} onValueChange={setSelectedBotId}>
              <SelectTrigger id="bot-select" className="bg-secondary border-border">
                <SelectValue placeholder="Selecione um bot" />
              </SelectTrigger>
              <SelectContent>
                {onlineBots.length > 0 ? (
                  onlineBots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name} ({bot.phone})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum bot online
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search">Buscar grupos</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Nome do grupo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchGroups()}
                className="bg-secondary border-border"
              />
              <Button
                onClick={searchGroups}
                disabled={isLoadingGroups || !selectedBotId}
                className="gap-2"
              >
                {isLoadingGroups ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups List */}
      {groups.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Grupos Encontrados ({groups.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {group.participantCount} membros
                        </span>
                        {group.createdAt && (
                          <span>
                            Criado em {new Date(group.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => getGroupLink(group)}
                        className="gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Link
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => extractMembers(group)}
                        disabled={isLoadingMembers}
                        className="gap-2"
                      >
                        {isLoadingMembers ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Extrair
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Membros de {selectedGroup?.name} ({members.length})
            </DialogTitle>
            <DialogDescription>
              {members.filter((m) => m.isAdmin).length} administradores
            </DialogDescription>
          </DialogHeader>

          {isLoadingMembers && (
            <div className="space-y-2">
              <Progress value={extractProgress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Extraindo membros...
              </p>
            </div>
          )}

          {!isLoadingMembers && members.length > 0 && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Função</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.slice(0, 20).map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono text-sm">
                          {member.phone}
                        </TableCell>
                        <TableCell>
                          {member.isAdmin ? (
                            <Badge className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Sim
                            </Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{member.role}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {members.length > 20 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... e mais {members.length - 20} membros
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={copyPhonesToClipboard}
              disabled={members.length === 0}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              Copiar Telefones
            </Button>
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={members.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
            <Button onClick={() => setShowMembersDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
