"use client"

import { useEffect } from "react"
import { DashboardSidebar } from "./sidebar"
import { DashboardHeader } from "./header"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  useEffect(() => {
    // Faz um ping a cada 5 minutos (300.000 ms) para evitar que o Render hiberne
    const interval = setInterval(() => {
      fetch('/api/ping').catch(() => {});
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-background via-background to-primary/5">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10 pointer-events-none animate-float"></div>
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6 z-0">
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground text-glow">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-2 text-lg">{description}</p>
              )}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
