"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAppStore } from "@/lib/store"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  Send, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Upload,
  Megaphone,
  AlertCircle,
  Play,
  Pause
} from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"

interface CampaignResult {
  phone: string
  name?: string
  status: "pending" | "sent" | "error"
  error?: string
}

export default function CampaignsPage() {
  const bots = useAppStore((state) => state.bots)
  const contacts = useAppStore((state) => state.contacts)

  const [selectedBotId, setSelectedBotId] = useState("")
  const [message, setMessage] = useState("")
  const [delayMs, setDelayMs] = useState(3000)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [filterTag, setFilterTag] = useState("all")
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<CampaignResult[]>([])
  const [campaignDone, setCampaignDone] = useState(false)
  const abortRef = useRef(false)

  const onlineBots = bots.filter((b) => b.status === "online")
  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags)))

  const filteredContacts = filterTag === "all"
    ? contacts
    : contacts.filter((c) => c.tags.includes(filterTag))

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedContacts(filteredContacts.map((c) => c.id))
    } else {
      setSelectedContacts([])
    }
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const phones = (result.data as any[])
          .map((row) => row.phone || row.Phone || row.telefone || row.Telefone || row.numero || row.Numero)
          .filter(Boolean)

        if (phones.length === 0) {
          toast.error("Nenhum número encontrado. Certifique-se que o CSV tem uma coluna 'phone' ou 'telefone'.")
          return
        }

        // Adiciona contatos importados como resultados pendentes
        const importedResults: CampaignResult[] = phones.map((phone: string) => ({
          phone,
          name: (result.data as any[]).find(
            (r) => r.phone === phone || r.telefone === phone
          )?.name || (result.data as any[]).find(
            (r) => r.phone === phone || r.telefone === phone
          )?.nome || phone,
          status: "pending",
        }))

        setResults(importedResults)
        toast.success(`${phones.length} números importados do CSV`)
      },
      error: () => toast.error("Erro ao ler o arquivo CSV"),
    })

    e.target.value = ""
  }

  const startCampaign = async () => {
    if (!selectedBotId) {
      toast.error("Selecione um bot para disparar")
      return
    }
    if (!message.trim()) {
      toast.error("Digite a mensagem da campanha")
      return
    }

    // Determina quais contatos usar
    let campaignContacts: CampaignResult[] = []

    if (results.length > 0) {
      // Usa contatos importados via CSV
      campaignContacts = results.map((r) => ({ ...r, status: "pending" }))
    } else if (selectedContacts.length > 0) {
      // Usa contatos selecionados da lista
      campaignContacts = selectedContacts.map((id) => {
        const c = contacts.find((c) => c.id === id)!
        return { phone: c.phone, name: c.name, status: "pending" }
      })
    } else {
      toast.error("Selecione contatos ou importe um CSV")
      return
    }

    setRunning(true)
    setCampaignDone(false)
    abortRef.current = false
    setResults(campaignContacts)
    setProgress(0)

    let sent = 0
    const total = campaignContacts.length

    for (let i = 0; i < total; i++) {
      if (abortRef.current) break

      const contact = campaignContacts[i]

      try {
        const res = await fetch("/api/whatsapp/bulk-send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            botId: selectedBotId,
            contacts: [contact.phone],
            message,
            delayMs: 0, // delay controlado aqui no front
          }),
        })

        const data = await res.json()

        if (res.ok && data.sent > 0) {
          campaignContacts[i] = { ...contact, status: "sent" }
          sent++
        } else {
          campaignContacts[i] = { ...contact, status: "error", error: data.error || "Falha no envio" }
        }
      } catch (err: any) {
        campaignContacts[i] = { ...contact, status: "error", error: err.message }
      }

      setResults([...campaignContacts])
      setProgress(Math.round(((i + 1) / total) * 100))

      // Delay entre mensagens
      if (i < total - 1 && delayMs > 0 && !abortRef.current) {
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }

    setRunning(false)
    setCampaignDone(true)
    toast.success(`Campanha concluída! ${sent}/${total} mensagens enviadas.`)
  }

  const stopCampaign = () => {
    abortRef.current = true
    setRunning(false)
    toast.info("Campanha pausada")
  }

  const sentCount = results.filter((r) => r.status === "sent").length
  const errorCount = results.filter((r) => r.status === "error").length
  const pendingCount = results.filter((r) => r.status === "pending").length

  return (
    <DashboardLayout title="Campanhas" description="Disparo em massa de mensagens WhatsApp">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuração da Campanha */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                Configurar Campanha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bot para disparo</Label>
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
                {onlineBots.length === 0 && (
                  <p className="text-xs text-yellow-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Conecte um bot primeiro em "Bots"
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Digite a mensagem que será enviada para todos os contatos..."
                  className="bg-secondary border-border min-h-[120px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{message.length} caracteres</p>
              </div>

              <div className="space-y-2">
                <Label>Intervalo entre mensagens</Label>
                <Select value={String(delayMs)} onValueChange={(v) => setDelayMs(Number(v))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1 segundo</SelectItem>
                    <SelectItem value="2000">2 segundos</SelectItem>
                    <SelectItem value="3000">3 segundos (recomendado)</SelectItem>
                    <SelectItem value="5000">5 segundos</SelectItem>
                    <SelectItem value="10000">10 segundos (mais seguro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Importar contatos via CSV</Label>
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-3 hover:bg-secondary/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {results.length > 0 ? `${results.length} contatos carregados` : "Clique para importar CSV"}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleImportCSV}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  CSV deve ter coluna "phone" ou "telefone"
                </p>
              </div>

              {running ? (
                <Button variant="destructive" className="w-full gap-2" onClick={stopCampaign}>
                  <Pause className="w-4 h-4" />
                  Pausar Campanha
                </Button>
              ) : (
                <Button
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  onClick={startCampaign}
                  disabled={!selectedBotId || !message.trim()}
                >
                  <Play className="w-4 h-4" />
                  {campaignDone ? "Disparar Novamente" : "Iniciar Disparo"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          {(running || campaignDone) && (
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-500">{sentCount}</p>
                    <p className="text-xs text-muted-foreground">Enviadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-500">{errorCount}</p>
                    <p className="text-xs text-muted-foreground">Erros</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-yellow-500">{pendingCount}</p>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Seleção de Contatos */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Selecionar Contatos
                  {selectedContacts.length > 0 && (
                    <Badge variant="secondary">{selectedContacts.length} selecionados</Badge>
                  )}
                </CardTitle>
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="w-[150px] bg-secondary border-border h-8 text-xs">
                    <SelectValue placeholder="Filtrar por tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as tags</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {results.length > 0 ? (
                // Mostra resultados da campanha
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Contato</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell className="font-medium">{r.name || r.phone}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{r.phone}</TableCell>
                        <TableCell>
                          {r.status === "sent" && (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Enviado
                            </Badge>
                          )}
                          {r.status === "error" && (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 gap-1" title={r.error}>
                              <XCircle className="w-3 h-3" /> Erro
                            </Badge>
                          )}
                          {r.status === "pending" && (
                            <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1">
                              <Clock className="w-3 h-3" /> Pendente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                // Mostra lista de contatos para seleção
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={(v) => handleSelectAll(!!v)}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="hidden sm:table-cell">Tags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        className="border-border cursor-pointer"
                        onClick={() => toggleContact(contact.id)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedContacts.includes(contact.id)}
                            onCheckedChange={() => toggleContact(contact.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{contact.phone}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {contact.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredContacts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum contato encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
