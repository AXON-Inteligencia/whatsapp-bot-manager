"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { MessagesChart } from "@/components/dashboard/messages-chart"
import { BotsList } from "@/components/dashboard/bots-list"
import { RecentConversations } from "@/components/dashboard/recent-conversations"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { QuickActions } from "@/components/dashboard/quick-actions"

export default function DashboardPage() {
  return (
    <DashboardLayout 
      title="Dashboard" 
      description="Bem-vindo de volta! Aqui esta um resumo dos seus bots."
    >
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MessagesChart />
        <PerformanceChart />
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BotsList />
        <RecentConversations />
      </div>
    </DashboardLayout>
  )
}
