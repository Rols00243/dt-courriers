"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { InstallButton } from "@/components/install-button"
import { Bell, Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { usePoll } from "@/lib/use-poll"
import { Badge } from "@/components/ui/badge"
import { useSidebar } from "@/components/sidebar-context"

export function Header() {
  const [count, setCount] = useState(0)
  const { toggle } = useSidebar()

  usePoll(async () => {
    try {
      const res = await fetch("/api/badges", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setCount(data.notifications ?? 0)
      }
    } catch {}
  }, 60000)

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 px-4 md:px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      {/* Bouton hamburger — visible uniquement sur mobile (<md) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggle}
        className="md:hidden w-9 h-9 p-0"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      {/* Bouton recherche — simule le raccourci Ctrl+K */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const ev = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
          window.dispatchEvent(ev)
        }}
        className="gap-2 text-gray-500 hidden md:flex hover:text-gray-700 dark:hover:text-gray-300"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Rechercher</span>
        <kbd className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Ctrl K</kbd>
      </Button>

      <InstallButton />
      <Link href="/dashboard/notifications">
        <Button variant="ghost" size="sm" className="w-9 h-9 p-0 relative">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-red-500 text-white border-0">
              {count}
            </Badge>
          )}
        </Button>
      </Link>
      <ThemeToggle />
    </header>
  )
}
