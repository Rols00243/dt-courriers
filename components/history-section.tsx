"use client"

import { useEffect, useState } from "react"
import { History, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface AuditLog {
  id: string
  action: string
  details: string | null
  createdAt: string
  user: { name: string | null; email: string }
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_COURRIER: "Création",
  UPDATE_COURRIER: "Modification",
  DELETE_COURRIER: "Suppression",
  ADD_COMMENT: "Commentaire",
  LOCK_COURRIER: "Verrouillage",
  UNLOCK_COURRIER: "Déverrouillage",
}

export function HistorySection({ courrierId }: { courrierId: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/audit?courrierId=${courrierId}`)
      .then((r) => r.json())
      .then((d) => { setLogs(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [courrierId])

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucun historique</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {logs.map((l) => (
        <div key={l.id} className="border-l-2 border-blue-200 dark:border-blue-800 pl-3 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {ACTION_LABELS[l.action] ?? l.action}
            </span>
            <span className="text-[10px] text-gray-400">
              {format(new Date(l.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">par {l.user.name}</p>
          {l.details && (
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{l.details}</p>
          )}
        </div>
      ))}
    </div>
  )
}
