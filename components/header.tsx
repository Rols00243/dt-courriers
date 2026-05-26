"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { InstallButton } from "@/components/install-button"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/badges", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setCount(data.notifications ?? 0)
        }
      } catch {}
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-10 flex items-center justify-end gap-2 px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
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
