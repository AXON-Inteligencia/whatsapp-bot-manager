"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { MessagesChart } from "@/components/dashboard/messages-chart"
import { BotsList } from "@/components/dashboard/bots-list"
import { RecentConversations } from "@/components/dashboard/recent-conversations"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { AdminVisitors } from "@/components/dashboard/admin-visitors"

export default function DashboardPage() {
  return (
    <DashboardLayout 
      title="Dashboard" 
      description="Visão geral e monitoramento em tempo real do seu negócio."
    >
      <AdminVisitors />
      <ActivityFeed />

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
