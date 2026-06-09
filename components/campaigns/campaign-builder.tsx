"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Send, 
  Upload,
  AlertCircle,
  Play,
  Pause,
  Link as LinkIcon,
  Shield,
  Zap
} from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"
import { Bot, Contact } from "@/lib/types"

interface CampaignResult {
  phone: string
  name?: string
  status: "pending" | "sent" | "error" | "queued"
  error?: string
  jobId?: string
}

interface CampaignBuilderProps {
  bots: Bot[]
  contacts: Contact[]
}

export function CampaignBuilder({ bots, contacts }: CampaignBuilderProps) {
  const [selectedBotId, setSelectedBotId] = useState("")
  const [message, setMessage] = useState("")
  const [delayMs, setDelayMs] = useState(3000)
  const [insertGroupLink, setInsertGroupLink] = useState(false)
  const [groupLinkUrl, setGroupLinkUrl] = useState("")
  const [insertEvery, setInsertEvery] = useState(5)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<CampaignResult[]>([])
  const [campaignDone, setCampaignDone] = useState(false)
  const [useQueue, setUseQueue] = useState(true) // Usar fila BullMQ por padrão
  const abortRef = useRef(false)

  const onlineBots = bots.filter((b) => b.status === "online")

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

        const importedResults: CampaignResult[] = phones.map((phone: string) => ({
          phone,
          name: (result.data as any[]).find(
            (r) => r.phone === phone || r.telefone === phone
          )?.name || phone,
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
    if (results.length === 0) {
      toast.error("Importe contatos via CSV ou selecione contatos")
      return
    }

    setRunning(true)
    setCampaignDone(false)
    abortRef.current = false
    setProgress(0)

    // Se usar fila, enviar tudo de uma vez
    if (useQueue) {
      try {
        const campaignContacts = results.map((r) => r.phone)

        const res = await fetch("/api/whatsapp/bulk-send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            botId: selectedBotId,
            contacts: campaignContacts,
            message,
            delayMs,
            useQueue: true,
          }),
        })

        if (!res.ok) {
          throw new Error("Falha ao enviar campanha")
        }

        const data = await res.json()

        // Atualizar resultados com jobId
        setResults((prev) =>
          prev.map((r) => ({
            ...r,
            status: "queued",
            jobId: data.jobId,
          }))
        )

        toast.success(`Campanha adicionada à fila! Job ID: ${data.jobId}`)
        setProgress(100)
        setCampaignDone(true)
        setRunning(false)
      } catch (error: any) {
        toast.error(error.message || "Erro ao enviar campanha")
        setRunning(false)
      }
    } else {
      // Envio síncrono (fallback)
      let sent = 0
      const total = results.length

      for (let i = 0; i < total; i++) {
        if (abortRef.current) break

        const contact = results[i]
        let messageToSend = message

        if (insertGroupLink && groupLinkUrl && (i + 1) % insertEvery === 0) {
          messageToSend = `${message}\n\n🔗 Junte-se ao nosso grupo:\n${groupLinkUrl}`
        }

        try {
          const res = await fetch("/api/whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              botId: selectedBotId,
              phone: contact.phone,
              message: messageToSend,
            }),
          })

          if (res.ok) {
            sent++
            setResults((prev) =>
              prev.map((r) =>
                r.phone === contact.phone ? { ...r, status: "sent" } : r
              )
            )
          } else {
            const errorData = await res.json()
            setResults((prev) =>
              prev.map((r) =>
                r.phone === contact.phone
                  ? { ...r, status: "error", error: errorData.error }
                  : r
              )
            )
          }
        } catch (err: any) {
          setResults((prev) =>
            prev.map((r) =>
              r.phone === contact.phone
                ? { ...r, status: "error", error: err.message }
                : r
            )
          )
        }

        setProgress(((i + 1) / total) * 100)

        // Delay anti-ban com variação aleatória
        const randomDelay = delayMs + Math.random() * (delayMs * 0.3)
        await new Promise((resolve) => setTimeout(resolve, randomDelay))
      }

      setRunning(false)
      setCampaignDone(true)
      toast.success(`Campanha concluída! ${sent}/${total} mensagens enviadas`)
    }
  }

  const pauseCampaign = () => {
    abortRef.current = true
    setRunning(false)
    toast.info("Campanha pausada")
  }

  const sentCount = results.filter((r) => r.status === "sent" || r.status === "queued").length
  const errorCount = results.filter((r) => r.status === "error").length

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Configurar Campanha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bot Selection */}
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

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite a mensagem que será enviada..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-24 bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} caracteres
            </p>
          </div>

          {/* Delay Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delay">Delay entre mensagens (ms)</Label>
              <Input
                id="delay"
                type="number"
                min="1000"
                max="60000"
                step="500"
                value={delayMs}
                onChange={(e) => setDelayMs(parseInt(e.target.value))}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo: 1s | Máximo: 60s
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insert-every">Inserir link a cada</Label>
              <Input
                id="insert-every"
                type="number"
                min="1"
                max="100"
                value={insertEvery}
                onChange={(e) => setInsertEvery(parseInt(e.target.value))}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">
                mensagens
              </p>
            </div>
          </div>

          {/* Group Link */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="insert-link"
                checked={insertGroupLink}
                onChange={(e) => setInsertGroupLink(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="insert-link" className="cursor-pointer">
                Inserir link do grupo nas mensagens
              </Label>
            </div>
            {insertGroupLink && (
              <Input
                placeholder="https://chat.whatsapp.com/..."
                value={groupLinkUrl}
                onChange={(e) => setGroupLinkUrl(e.target.value)}
                className="bg-secondary border-border"
              />
            )}
          </div>

          {/* Queue Option */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use-queue"
                checked={useQueue}
                onChange={(e) => setUseQueue(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="use-queue" className="cursor-pointer flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Usar fila de processamento (BullMQ)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              {useQueue
                ? "A campanha será adicionada à fila e processada em background com anti-ban automático"
                : "A campanha será processada em tempo real no navegador"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Import */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Contatos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
              id="csv-input"
            />
            <Button
              asChild
              variant="outline"
              className="cursor-pointer"
            >
              <label htmlFor="csv-input" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Selecionar CSV
              </label>
            </Button>
            <p className="text-sm text-muted-foreground">
              {results.length > 0
                ? `${results.length} contatos carregados`
                : "Nenhum arquivo selecionado"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Progress */}
      {(running || campaignDone) && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Progresso da Campanha</span>
              <Badge variant="outline">
                {sentCount}/{results.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{sentCount}</p>
                <p className="text-sm text-muted-foreground">Enviadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {results.filter((r) => r.status === "pending" || r.status === "queued").length}
                </p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                <p className="text-sm text-muted-foreground">Erros</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={startCampaign}
          disabled={running || !selectedBotId || !message.trim() || results.length === 0}
          className="gap-2 flex-1"
        >
          <Play className="w-4 h-4" />
          Iniciar Campanha
        </Button>
        {running && (
          <Button
            onClick={pauseCampaign}
            variant="outline"
            className="gap-2"
          >
            <Pause className="w-4 h-4" />
            Pausar
          </Button>
        )}
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Telefone</th>
                    <th className="text-left py-2 px-2">Nome</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 10).map((result, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 px-2 font-mono text-xs">{result.phone}</td>
                      <td className="py-2 px-2">{result.name || "-"}</td>
                      <td className="py-2 px-2">
                        <Badge
                          variant="outline"
                          className={
                            result.status === "sent"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : result.status === "queued"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : result.status === "error"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }
                        >
                          {result.status === "sent" ? "✓ Enviada" : result.status === "queued" ? "⏳ Na fila" : result.status === "error" ? "✗ Erro" : "⏱ Pendente"}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {result.error || result.jobId || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {results.length > 10 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  ... e mais {results.length - 10} contatos
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
