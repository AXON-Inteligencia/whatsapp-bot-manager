"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAppStore } from "@/lib/store"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  Globe,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Link as LinkIcon,
  Users,
  Zap,
  Download,
  Bot
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface GroupLink {
  url: string
  title: string
  description: string
  source: string
  members?: number
}

export default function SearchGroupsPage() {
  const bots = useAppStore((state) => state.bots)
  const [keyword, setKeyword] = useState("")
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<GroupLink[]>([])
  const [searched, setSearched] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())

  // Estados de Extração
  const [extractModalOpen, setExtractModalOpen] = useState(false)
  const [extractingUrl, setExtractingUrl] = useState("")
  const [selectedBotId, setSelectedBotId] = useState("")
  const [extracting, setExtracting] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)

  const onlineBots = bots.filter((b) => b.status === "online")

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error("Digite uma palavra-chave para buscar (ex: 'academia', 'vendas')")
      return
    }

    setLoading(true)
    setSearched(true)
    setGroups([])
    setSelectedGroups(new Set())

    try {
      const res = await fetch("/api/whatsapp/search-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), limit: 50 }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erro ao buscar grupos")
        return
      }

      setGroups(data.groups || [])

      if (!data.groups?.length) {
        toast.info(`Nenhum grupo encontrado para "${keyword}". Tente outro termo.`)
      } else {
        toast.success(`${data.groups.length} grupos encontrados para "${keyword}"`)
      }
    } catch (err: any) {
      toast.error("Erro de conexão: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (url: string) => {
    const newSelected = new Set(selectedGroups)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      newSelected.add(url)
    }
    setSelectedGroups(newSelected)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Link copiado!")
  }

  const handleBulkCopy = () => {
    const links = groups
      .filter((g) => selectedGroups.has(g.url))
      .map((g) => g.url)
      .join("\n")

    navigator.clipboard.writeText(links)
    toast.success(`${selectedGroups.size} links copiados!`)
  }

  const handleExtractMembers = async () => {
    if (!selectedBotId) {
      toast.error("Selecione um bot online para entrar no grupo.")
      return
    }
    setExtracting(true)
    setExtractedData(null)
    
    try {
      const res = await fetch("/api/whatsapp/extract-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: selectedBotId, inviteLink: extractingUrl }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        toast.error(data.error || "Erro ao extrair contatos")
        return
      }
      
      setExtractedData(data)
      toast.success(`${data.participantsCount} contatos extraídos com sucesso!`)
      
      // Save contacts to AppStore and LocalStorage for campaign
      const formattedContacts = data.participants
        .filter((p: any) => p.phone)
        .map((p: any) => ({
          phone: p.phone,
          name: `Contato Grupo ${data.groupName || ""}`,
          status: "pending"
        }))
        
      if (formattedContacts.length > 0) {
        const existingStr = localStorage.getItem("axon_campaign_results") || "[]"
        let existing = []
        try { existing = JSON.parse(existingStr) } catch(e){}
        const merged = [...existing, ...formattedContacts]
        localStorage.setItem("axon_campaign_results", JSON.stringify(merged))
      }
    } catch (err: any) {
      toast.error("Erro de conexão: " + err.message)
    } finally {
      setExtracting(false)
    }
  }

  const openExtractModal = (url: string) => {
    setExtractingUrl(url)
    setExtractModalOpen(true)
    setExtractedData(null)
  }

  return (
    <DashboardLayout title="Busca Global de Grupos" description="Encontre grupos de WhatsApp em toda a internet">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/groups" className="gap-2 flex items-center">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Grupos
          </Link>
        </Button>
      </div>

      {/* Busca */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Buscar Grupos na Internet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Palavra-chave (tema do grupo)</Label>
            <div className="flex gap-2">
              <Input
                placeholder='Ex: "academia", "vendas", "investimentos", "marketing"...'
                className="bg-secondary border-border flex-1"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading || !keyword.trim()}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O sistema buscará em sites especializados e Google Dorks para encontrar grupos públicos
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
            <Zap className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-500">
              <strong>Dica:</strong> Use termos específicos para melhores resultados. Ex: "academia perto de mim", "grupo de vendas online", "investimentos 2026"
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {searched && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                Links de Grupos Encontrados
                {groups.length > 0 && (
                  <Badge variant="secondary">{groups.length} grupos</Badge>
                )}
              </CardTitle>
              {groups.length > 0 && (
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {selectedGroups.size} selecionados
                  </Badge>
                  {selectedGroups.size > 0 && (
                    <Button size="sm" variant="outline" onClick={handleBulkCopy} className="gap-1">
                      <Copy className="w-3 h-3" />
                      Copiar Selecionados
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Buscando grupos na internet...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Globe className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">Nenhum grupo encontrado</p>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Tente outro termo de busca ou seja mais específico
                </p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedGroups.size === groups.length && groups.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGroups(new Set(groups.map((g) => g.url)))
                            } else {
                              setSelectedGroups(new Set())
                            }
                          }}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>Link do Grupo</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedGroups.has(group.url)}
                            onChange={() => toggleGroup(group.url)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <code className="text-xs bg-secondary px-2 py-1 rounded font-mono break-all">
                              {group.url}
                            </code>
                            <p className="text-xs text-muted-foreground">{group.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {group.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => copyToClipboard(group.url)}
                              title="Copiar link"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              asChild
                              title="Abrir em nova aba"
                            >
                              <a href={group.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 px-2 text-[10px] bg-primary/20 text-primary hover:bg-primary/30"
                              onClick={() => openExtractModal(group.url)}
                              title="Extrair membros"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Extrair
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      {!searched && (
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Como funciona
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Digite uma palavra-chave (tema do grupo)</li>
                  <li>✓ O sistema busca em múltiplas fontes</li>
                  <li>✓ Receba links de grupos públicos</li>
                  <li>✓ Copie ou abra os links</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Próximo passo
                </h3>
                <p className="text-sm text-muted-foreground">
                  Depois de encontrar os grupos, você pode entrar neles com seu bot e depois usar a seção "Grupos" para extrair os membros e criar campanhas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Extração */}
      <Dialog open={extractModalOpen} onOpenChange={setExtractModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Extrair Membros do Grupo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Link do Grupo</Label>
              <Input value={extractingUrl} readOnly className="bg-secondary/50 text-xs text-muted-foreground font-mono" />
            </div>
            
            {!extractedData ? (
              <div className="space-y-2">
                <Label>Selecione o Bot Extrator</Label>
                <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione um bot online" />
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
                <p className="text-xs text-muted-foreground mt-2">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  O bot selecionado entrará no grupo silenciosamente para capturar a lista de membros.
                </p>
                <Button 
                  className="w-full mt-4" 
                  onClick={handleExtractMembers}
                  disabled={extracting || !selectedBotId}
                >
                  {extracting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando no grupo e extraindo...</>
                  ) : (
                    <><Bot className="w-4 h-4 mr-2" /> Iniciar Extração</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <div>
                  <h3 className="font-semibold text-green-500">{extractedData.groupName}</h3>
                  <p className="text-sm text-muted-foreground">{extractedData.participantsCount} membros extraídos com sucesso!</p>
                </div>
                <div className="pt-2">
                  <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <Link href="/campaigns">
                      Ir para Nova Campanha
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
