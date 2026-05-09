"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Bot, 
  MessageSquare, 
  Download, 
  Upload, 
  RefreshCw, 
  QrCode,
  FileText,
  Zap
} from "lucide-react"

const actions = [
  {
    name: "Novo Bot",
    icon: Bot,
    description: "Criar um novo bot",
    variant: "default" as const,
  },
  {
    name: "Broadcast",
    icon: MessageSquare,
    description: "Enviar mensagem em massa",
    variant: "outline" as const,
  },
  {
    name: "QR Code",
    icon: QrCode,
    description: "Reconectar dispositivo",
    variant: "outline" as const,
  },
  {
    name: "Automação",
    icon: Zap,
    description: "Criar fluxo automático",
    variant: "outline" as const,
  },
  {
    name: "Importar",
    icon: Upload,
    description: "Importar contatos",
    variant: "outline" as const,
  },
  {
    name: "Exportar",
    icon: Download,
    description: "Exportar relatório",
    variant: "outline" as const,
  },
  {
    name: "Sincronizar",
    icon: RefreshCw,
    description: "Sincronizar dados",
    variant: "outline" as const,
  },
  {
    name: "Logs",
    icon: FileText,
    description: "Ver logs do sistema",
    variant: "outline" as const,
  },
]

export function QuickActions() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Ações Rápidas</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Acesse funcionalidades comuns</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Button
              key={action.name}
              variant={action.variant}
              className="h-auto flex-col gap-2 py-4 px-3"
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{action.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
