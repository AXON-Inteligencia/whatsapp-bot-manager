"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import Link from "next/link"

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Agora"
  if (diffMins < 60) return `${diffMins}min`
  if (diffHours < 24) return `${diffHours}h`
  return `${diffDays}d`
}

export function RecentConversations() {
  const conversations = useAppStore((state) => state.conversations)
  const markAsRead = useAppStore((state) => state.markConversationAsRead)

  const sortedConversations = [...conversations].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  )

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">Conversas Recentes</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {conversations.filter((c) => c.unreadCount > 0).length} nao lidas
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary" asChild>
          <Link href="/conversations">Ver todas</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {sortedConversations.slice(0, 5).map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => markAsRead(conversation.id)}
              className={cn(
                "w-full flex items-start gap-4 px-6 py-4 text-left hover:bg-secondary/50 transition-colors",
                conversation.unreadCount > 0 && "bg-primary/5"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {conversation.contactName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "font-medium truncate",
                      conversation.unreadCount > 0
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {conversation.contactName}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTimeAgo(conversation.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {conversation.lastMessage}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs bg-secondary border-0">
                    {conversation.botName}
                  </Badge>
                  {conversation.unreadCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
