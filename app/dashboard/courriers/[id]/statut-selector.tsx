"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { STATUT_LABELS, STATUT_COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"

const statuts = ["EN_ATTENTE", "EN_COURS", "TRAITE", "ARCHIVE", "URGENT"] as const

export function StatutSelector({
  courrierId,
  currentStatut,
}: {
  courrierId: string
  currentStatut: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(currentStatut)

  async function updateStatut(statut: string) {
    if (statut === selected) return
    setLoading(true)
    setSelected(statut)

    await fetch(`/api/courriers/${courrierId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    })

    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {statuts.map((s) => (
        <button
          key={s}
          onClick={() => updateStatut(s)}
          disabled={loading}
          className={cn(
            "w-full text-left px-3 py-2 rounded-lg text-sm font-medium border transition-all",
            selected === s
              ? `${STATUT_COLORS[s]} border-transparent`
              : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          )}
        >
          {STATUT_LABELS[s]}
        </button>
      ))}
    </div>
  )
}
