import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { History } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"

const ACTION_LABELS: Record<string, string> = {
  CREATE_COURRIER: "Création de courrier",
  UPDATE_COURRIER: "Modification de courrier",
  DELETE_COURRIER: "Suppression de courrier",
  ADD_COMMENT: "Commentaire ajouté",
}

const ACTION_COLORS: Record<string, string> = {
  CREATE_COURRIER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  UPDATE_COURRIER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  DELETE_COURRIER: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  ADD_COMMENT: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
}

export default async function HistoriquePage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true, email: true } },
      courrier: { select: { id: true, numero: true, objet: true } },
    },
  })

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
          <History className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Historique d&apos;activité</h1>
          <p className="text-gray-500 text-sm">{logs.length} action(s) récente(s)</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Journal d&apos;activité</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune activité enregistrée</p>
          ) : (
            <div className="space-y-3">
              {logs.map((l) => (
                <div key={l.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${ACTION_COLORS[l.action] ?? "bg-gray-100 text-gray-700"} flex-shrink-0`}>
                    {ACTION_LABELS[l.action] ?? l.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{l.user.name}</span>
                      {" — "}
                      <span className="text-gray-600 dark:text-gray-400">{l.details}</span>
                    </p>
                    {l.courrier && (
                      <Link
                        href={`/dashboard/courriers/${l.courrier.id}`}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {l.courrier.numero} - {l.courrier.objet}
                      </Link>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(l.createdAt), "dd MMMM yyyy 'à' HH:mm:ss", { locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
