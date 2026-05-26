"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, CheckCheck, MessageSquare, AlertTriangle, FileText, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  titre: string
  message: string
  lien: string | null
  lu: boolean
  createdAt: string
}

const ICONS: Record<string, typeof Bell> = {
  COMMENT: MessageSquare,
  URGENT: AlertTriangle,
  COURRIER: FileText,
}

const COLORS: Record<string, string> = {
  COMMENT: "text-blue-500",
  URGENT: "text-red-500",
  COURRIER: "text-emerald-500",
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch("/api/notifications", { cache: "no-store" })
    if (res.ok) setNotifications(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
    load()
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifications((n) => n.map((x) => x.id === id ? { ...x, lu: true } : x))
  }

  const unreadCount = notifications.filter((n) => !n.lu).length

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-gray-500 text-sm">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""} sur {notifications.length}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAll} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Tout marquer lu
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((n) => {
                const Icon = ICONS[n.type] ?? Bell
                const color = COLORS[n.type] ?? "text-gray-500"
                const content = (
                  <div
                    className={cn(
                      "flex gap-3 p-4 transition-colors",
                      !n.lu && "bg-blue-50/50 dark:bg-blue-950/20",
                      "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    )}
                    onClick={() => !n.lu && markOne(n.id)}
                  >
                    <div className={cn("p-2 rounded-lg bg-white dark:bg-gray-800", color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{n.titre}</p>
                        {!n.lu && <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { locale: fr, addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
                return (
                  <li key={n.id}>
                    {n.lien ? <Link href={n.lien}>{content}</Link> : content}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
