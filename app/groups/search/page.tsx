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
  Zap
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
    </DashboardLayout>
  )
}
