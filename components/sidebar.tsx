"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  FileText, LayoutDashboard, PlusCircle, Archive,
  Users, LogOut, Mail, ChevronRight, History, Settings,
  Inbox, Send, Bell, UserCog, Activity, BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { usePoll } from "@/lib/use-poll"

interface NavItem {
  href: string
  icon: typeof FileText
  label: string
  badgeKey?: "enAttente" | "notifications"
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/dashboard/courriers", icon: Mail, label: "Tous les courriers", badgeKey: "enAttente" },
  { href: "/dashboard/courriers/entrants", icon: Inbox, label: "Courriers entrants" },
  { href: "/dashboard/courriers/sortants", icon: Send, label: "Courriers sortants" },
  { href: "/dashboard/courriers/nouveau", icon: PlusCircle, label: "Nouveau courrier" },
  { href: "/dashboard/archives", icon: Archive, label: "Archives" },
  { href: "/dashboard/notifications", icon: Bell, label: "Notifications", badgeKey: "notifications" },
  { href: "/dashboard/statistiques", icon: BarChart3, label: "Statistiques" },
  { href: "/dashboard/historique", icon: History, label: "Historique" },
]

const adminItems: NavItem[] = [
  { href: "/dashboard/utilisateurs", icon: Users, label: "Utilisateurs" },
  { href: "/dashboard/connexions", icon: Activity, label: "Connexions" },
  { href: "/dashboard/parametres", icon: Settings, label: "Paramètres" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [badges, setBadges] = useState({ enAttente: 0, notifications: 0 })

  usePoll(async () => {
    try {
      const res = await fetch("/api/badges", { cache: "no-store" })
      if (res.ok) setBadges(await res.json())
    } catch {}
  }, 60000)

  return (
    <aside className="flex flex-col w-64 bg-gray-900 dark:bg-gray-950 border-r border-gray-800 text-white min-h-screen">
      <div className="p-5 flex items-center gap-3 border-b border-gray-800">
        <div className="bg-blue-500 p-2 rounded-lg">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-sm">DT Courriers</h1>
          <p className="text-xs text-gray-400">Gestion documentaire</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2">Navigation</p>
        {navItems.map((item) => {
          const active = pathname === item.href
          const badge = item.badgeKey ? badges[item.badgeKey] : 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {badge > 0 && (
                <Badge variant="outline" className="ml-auto bg-red-500 border-red-500 text-white text-[10px] h-5 px-1.5">
                  {badge}
                </Badge>
              )}
              {active && badge === 0 && <ChevronRight className="h-3 w-3" />}
            </Link>
          )
        })}

        {session?.user.role === "ADMIN" && (
          <>
            <Separator className="my-3 bg-gray-800" />
            <p className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2">Administration</p>
            {adminItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-600 text-white text-xs">
              {session?.user.name?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user.name}</p>
            <p className="text-xs text-gray-400 truncate">{session?.user.role}</p>
          </div>
        </div>
        <Link href="/dashboard/profil">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-300 hover:text-white hover:bg-gray-800 justify-start gap-2 mb-1"
          >
            <UserCog className="h-4 w-4" />
            Mon profil
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-300 hover:text-white hover:bg-gray-800 justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </aside>
  )
}
