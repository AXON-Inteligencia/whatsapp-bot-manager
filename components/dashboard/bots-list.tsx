"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Power, Settings, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import { useState } from "react"
import Link from "next/link"

export function BotsList() {
  const bots = useAppStore((state) => state.bots)
  const toggleBotStatus = useAppStore((state) => state.toggleBotStatus)
  const deleteBot = useAppStore((state) => state.deleteBot)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const onlineBots = bots.filter((b) => b.status === "online").length

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-medium">Meus Bots</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {onlineBots} de {bots.length} online
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary" asChild>
            <Link href="/bots">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {bots.slice(0, 5).map((bot) => (
              <div
                key={bot.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
                      bot.status === "online"
                        ? "bg-primary/10 text-primary"
                        : bot.status === "connecting"
                        ? "bg-chart-3/10 text-chart-3"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {bot.name.charAt(4).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{bot.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs border-0",
                          bot.status === "online"
                            ? "bg-primary/10 text-primary"
                            : bot.status === "connecting"
                            ? "bg-chart-3/10 text-chart-3"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {bot.status === "online"
                          ? "Online"
                          : bot.status === "connecting"
                          ? "Conectando..."
                          : "Offline"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{bot.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-foreground">
                      {bot.messages.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">mensagens/dia</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-foreground">{bot.uptime}</p>
                    <p className="text-xs text-muted-foreground">uptime</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => toggleBotStatus(bot.id)}>
                        <Power className="w-4 h-4" />
                        {bot.status === "online" ? "Desligar" : "Ligar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" asChild>
                        <Link href={`/bots?edit=${bot.id}`}>
                          <Settings className="w-4 h-4" />
                          Configurar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="gap-2 text-destructive"
                        onClick={() => setDeleteId(bot.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bot?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. O bot sera permanentemente excluido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteBot(deleteId)
                setDeleteId(null)
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
