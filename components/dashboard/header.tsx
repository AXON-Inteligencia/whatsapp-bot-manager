"use client"

import { Bell, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

import { useEffect, useState } from "react"

export function DashboardHeader() {
  const [avatarUrl, setAvatarUrl] = useState("/avatar.png")

  useEffect(() => {
    const saved = localStorage.getItem('axon_user_avatar')
    if (saved) setAvatarUrl(saved)
  }, [])

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar bots, conversas..."
            className="pl-10 bg-secondary border-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Bot</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Bot &quot;Vendas&quot; offline</span>
              <span className="text-xs text-muted-foreground">Há 5 minutos</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">100 novas conversas hoje</span>
              <span className="text-xs text-muted-foreground">Há 1 hora</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Atualização do sistema</span>
              <span className="text-xs text-muted-foreground">Há 2 horas</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarUrl} alt="Avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = (e: any) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  const url = reader.result as string
                  const img = document.querySelector('.h-9.w-9 img') as HTMLImageElement
                  if (img) img.src = url
                  localStorage.setItem('axon_user_avatar', url)
                }
                reader.readAsDataURL(file)
              }
              input.click()
            }}>
              Alterar Minha Foto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert("Em breve: Tela de Perfil")}>Perfil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert("Em breve: Configurações do Painel")}>Configurações</DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert("Em breve: Módulo de Faturamento")}>Faturamento</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => window.location.href = "/"}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
