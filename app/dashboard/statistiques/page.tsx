import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Clock } from "lucide-react"
import { TYPE_LABELS, PRIORITE_LABELS, STATUT_LABELS } from "@/lib/constants"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { fr } from "date-fns/locale"

export default async function StatistiquesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const now = new Date()
  const sixMonthsAgo = startOfMonth(subMonths(now, 5))

  const [
    all, parType, parPriorite, parStatut, recent6Months, topExpediteurs, topDestinataires,
  ] = await Promise.all([
    prisma.courrier.count(),
    prisma.courrier.groupBy({ by: ["type"], _count: true }),
    prisma.courrier.groupBy({ by: ["priorite"], _count: true }),
    prisma.courrier.groupBy({ by: ["statut"], _count: true }),
    prisma.courrier.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, type: true },
    }),
    prisma.courrier.groupBy({
      by: ["expediteur"],
      _count: true,
      orderBy: { _count: { expediteur: "desc" } },
      take: 10,
    }),
    prisma.courrier.groupBy({
      by: ["destinataire"],
      _count: true,
      orderBy: { _count: { destinataire: "desc" } },
      take: 10,
    }),
  ])

  // Agrégation par mois pour le graphique d'évolution
  const monthlyMap = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const m = startOfMonth(subMonths(now, i))
    monthlyMap.set(format(m, "yyyy-MM"), 0)
  }
  for (const c of recent6Months) {
    const k = format(c.createdAt, "yyyy-MM")
    monthlyMap.set(k, (monthlyMap.get(k) ?? 0) + 1)
  }
  const monthly = Array.from(monthlyMap.entries()).map(([k, count]) => ({
    label: format(new Date(k + "-01"), "MMM yyyy", { locale: fr }),
    count,
  }))
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.count))

  function pct(c: number) {
    return all > 0 ? Math.round((c / all) * 100) : 0
  }

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
          <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Statistiques</h1>
          <p className="text-gray-500 text-sm">
            Vue d&apos;ensemble sur {all} courrier(s) enregistré(s)
          </p>
        </div>
      </div>

      {/* Évolution mensuelle (graphique bars CSS) */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Évolution des 6 derniers mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {monthly.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold">{m.count}</span>
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md min-h-[4px] transition-all"
                  style={{ height: `${(m.count / maxMonthly) * 80}%` }}
                />
                <span className="text-[10px] text-gray-500 mt-1">{m.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Par type */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Par type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {parType.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune donnée</p>
            ) : (
              parType.sort((a, b) => b._count - a._count).map((t) => (
                <div key={t.type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{TYPE_LABELS[t.type]}</span>
                    <span className="font-medium">{t._count} ({pct(t._count)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct(t._count)}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Par statut */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Par statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {parStatut.sort((a, b) => b._count - a._count).map((s) => (
              <div key={s.statut}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{STATUT_LABELS[s.statut]}</span>
                  <span className="font-medium">{s._count} ({pct(s._count)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct(s._count)}%` }} />
                </div>
              </div>
            ))}
            {parStatut.length === 0 && <p className="text-sm text-gray-400">Aucune donnée</p>}
          </CardContent>
        </Card>

        {/* Par priorité */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Par priorité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {parPriorite.sort((a, b) => b._count - a._count).map((p) => (
              <div key={p.priorite}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{PRIORITE_LABELS[p.priorite]}</span>
                  <span className="font-medium">{p._count} ({pct(p._count)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct(p._count)}%` }} />
                </div>
              </div>
            ))}
            {parPriorite.length === 0 && <p className="text-sm text-gray-400">Aucune donnée</p>}
          </CardContent>
        </Card>
      </div>

      {/* Top expéditeurs/destinataires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Top 10 expéditeurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {topExpediteurs.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune donnée</p>
            ) : (
              topExpediteurs.map((e, i) => (
                <div key={e.expediteur} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-400 w-6">#{i + 1}</span>
                    <span className="truncate">{e.expediteur}</span>
                  </div>
                  <span className="font-medium text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2">
                    {e._count}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              Top 10 destinataires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {topDestinataires.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune donnée</p>
            ) : (
              topDestinataires.map((d, i) => (
                <div key={d.destinataire} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-400 w-6">#{i + 1}</span>
                    <span className="truncate">{d.destinataire}</span>
                  </div>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2">
                    {d._count}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
