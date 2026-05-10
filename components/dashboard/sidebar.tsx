"use client"

import { cn } from "@/lib/utils"
import {
  Bot,
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  Zap,
  ShieldCheck,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  UsersRound,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Bots", href: "/bots", icon: Bot },
  { name: "Conversas", href: "/conversations", icon: MessageSquare },
  { name: "Contatos", href: "/contacts", icon: Users },
  { name: "Campanhas", href: "/campaigns", icon: Megaphone },
  { name: "Grupos", href: "/groups", icon: UsersRound },
  { name: "Automações", href: "/automations", icon: Zap },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Usuários", href: "/admin/users", icon: Users },
]

const bottomNav = [
  { name: "Configurações", href: "/settings", icon: Settings },
  { name: "Ajuda", href: "/help", icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Verifica se o usuário é admin através do localStorage ou cookie (opcional)
    const auth = localStorage.getItem("whatsapp-admin-auth")
    if (auth) {
      const user = JSON.parse(auth)
      setIsAdmin(user.role === "admin")
    } else {
      setIsAdmin(true) // Fallback para mostrar enquanto carrega se necessário
    }
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    localStorage.removeItem("whatsapp-admin-auth")
    router.push("/login")
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 z-30",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-4 px-6 h-20 border-b border-slate-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-100">
            <Bot className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-lg tracking-tight">AxonFlow</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Inteligência</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            
            // Só mostra a aba Usuários se for admin
            if (item.name === "Usuários" && !isAdmin) return null;

            const LinkContent = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-emerald-600" : "group-hover:text-slate-900")} />
                {!collapsed && <span className="font-semibold text-sm">{item.name}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{LinkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-900 text-white border-none rounded-lg px-3 py-1.5 text-xs font-bold">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return LinkContent
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="px-4 py-6 border-t border-slate-100 space-y-2">
          {bottomNav.map((item) => {
            const isActive = pathname === item.href
            const LinkContent = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all",
                  isActive && "bg-slate-50 text-slate-900"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-semibold text-sm">{item.name}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{LinkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-900 text-white border-none rounded-lg px-3 py-1.5 text-xs font-bold">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return LinkContent
          })}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all",
              collapsed ? "justify-center" : ""
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-semibold text-sm">Sair</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
