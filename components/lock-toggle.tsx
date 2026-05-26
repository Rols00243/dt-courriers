"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Unlock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LockToggle({
  courrierId,
  locked,
  canUnlock,
}: {
  courrierId: string
  locked: boolean
  canUnlock: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (locked && !canUnlock) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5">
        <Lock className="h-3.5 w-3.5" />
        Verrouillé
      </Button>
    )
  }

  async function toggle() {
    setLoading(true)
    await fetch(`/api/courriers/${courrierId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verrouille: !locked }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <Button
      variant={locked ? "outline" : "ghost"}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
        locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
      {locked ? "Déverrouiller" : "Verrouiller"}
    </Button>
  )
}
