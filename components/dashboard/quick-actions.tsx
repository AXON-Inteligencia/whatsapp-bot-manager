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
  Zap,
  Megaphone,
  UsersRound
} from "lucide-react"
import Link from "next/link"

const actions = [
  {
    name: "Novo Bot",
    icon: Bot,
    description: "Criar um novo bot",
    variant: "default" as const,
    href: "/bots",
  },
  {
    name: "Campanhas",
    icon: Megaphone,
    description: "Disparo em massa",
    variant: "outline" as const,
    href: "/campaigns",
  },
  {
    name: "Grupos",
    icon: UsersRound,
    description: "Buscar grupos WhatsApp",
    variant: "outline" as const,
    href: "/groups",
  },
  {
    name: "Automação",
    icon: Zap,
    description: "Criar fluxo automático",
    variant: "outline" as const,
    href: "/automations",
  },
  {
    name: "Contatos",
    icon: Upload,
    description: "Importar contatos",
    variant: "outline" as const,
    href: "/contacts",
  },
  {
    name: "Analytics",
    icon: Download,
    description: "Ver relatórios",
    variant: "outline" as const,
    href: "/analytics",
  },
  {
    name: "QR Code",
    icon: QrCode,
    description: "Reconectar dispositivo",
    variant: "outline" as const,
    href: "/bots",
  },
  {
    name: "Logs",
    icon: FileText,
    description: "Ver logs do sistema",
    variant: "outline" as const,
    href: "/admin",
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
              asChild
            >
              <Link href={action.href}>
                <action.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{action.name}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
