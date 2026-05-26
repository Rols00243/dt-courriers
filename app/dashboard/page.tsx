import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Mail, CheckCircle, Clock, Archive, AlertTriangle,
  TrendingUp, AlertOctagon, Users,
} from "lucide-react"
import { STATUT_LABELS, STATUT_COLORS, TYPE_LABELS, PRIORITE_COLORS, PRIORITE_LABELS } from "@/lib/constants"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default async function DashboardPage() {
  const session = await auth()

  const [
    total, enAttente, enCours, traite, archive, urgent,
    tresUrgents, recents, parType,
  ] = await Promise.all([
    prisma.courrier.count(),
    prisma.courrier.count({ where: { statut: "EN_ATTENTE" } }),
    prisma.courrier.count({ where: { statut: "EN_COURS" } }),
    prisma.courrier.count({ where: { statut: "TRAITE" } }),
    prisma.courrier.count({ where: { statut: "ARCHIVE" } }),
    prisma.courrier.count({ where: { statut: "URGENT" } }),
    prisma.courrier.count({ where: { priorite: "TRES_URGENTE" } }),
    prisma.courrier.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } }, _count: { select: { comments: true } } },
    }),
    prisma.courrier.groupBy({
      by: ["type"],
      _count: true,
      orderBy: { _count: { type: "desc" } },
    }),
  ])

  const stats = [
    { label: "Total", value: total, icon: Mail, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30" },
    { label: "En attente", value: enAttente, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/30" },
    { label: "En cours", value: enCours, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/30" },
    { label: "Traités", value: traite, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/30" },
    { label: "Archivés", value: archive, icon: Archive, color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800" },
    { label: "Urgents", value: urgent, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/30" },
    { label: "Très urgents", value: tresUrgents, icon: AlertOctagon, color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/40" },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">
          Bonjour, <span className="font-medium">{session?.user.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Derniers courriers</CardTitle>
          </CardHeader>
          <CardContent>
            {recents.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Aucun courrier enregistré</p>
            ) : (
              <div className="space-y-2">
                {recents.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/courriers/${c.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg flex-shrink-0">
                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.objet}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {c.numero} · {TYPE_LABELS[c.type]} · {c.expediteur}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <Badge className={`text-xs ${STATUT_COLORS[c.statut]}`} variant="outline">
                        {STATUT_LABELS[c.statut]}
                      </Badge>
                      <Badge className={`text-xs ${PRIORITE_COLORS[c.priorite]}`} variant="outline">
                        {PRIORITE_LABELS[c.priorite]}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {format(new Date(c.createdAt), "dd MMM", { locale: fr })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Répartition par type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {parType.length === 0 ? (
              <p className="text-center text-gray-400 py-4 text-sm">Aucune donnée</p>
            ) : (
              <div className="space-y-2">
                {parType.map((t) => {
                  const percent = total > 0 ? Math.round((t._count / total) * 100) : 0
                  return (
                    <div key={t.type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{TYPE_LABELS[t.type]}</span>
                        <span className="font-medium">{t._count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
