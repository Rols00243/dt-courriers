import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Mail, CheckCircle, Clock, Archive, AlertTriangle,
  TrendingUp, AlertOctagon, Users, PlusCircle, Inbox, Send,
  Search, BarChart3, FileSearch, Bell,
} from "lucide-react"
import { STATUT_LABELS, STATUT_COLORS, TYPE_LABELS, PRIORITE_COLORS, PRIORITE_LABELS } from "@/lib/constants"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default async function DashboardPage() {
  const session = await auth()

  const [
    total, enAttente, enCours, traite, archive, urgent,
    tresUrgents, recents, parType, notifNonLues,
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
    session?.user?.id
      ? prisma.notification.count({ where: { userId: session.user.id, lu: false } })
      : Promise.resolve(0),
  ])

  // Chaque statistique mène vers la liste filtrée correspondante
  const stats = [
    { label: "Total", value: total, icon: Mail,
      color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30",
      href: "/dashboard/courriers" },
    { label: "En attente", value: enAttente, icon: Clock,
      color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/30",
      href: "/dashboard/courriers?statut=EN_ATTENTE" },
    { label: "En cours", value: enCours, icon: TrendingUp,
      color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/30",
      href: "/dashboard/courriers?statut=EN_COURS" },
    { label: "Traités", value: traite, icon: CheckCircle,
      color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/30",
      href: "/dashboard/courriers?statut=TRAITE" },
    { label: "Archivés", value: archive, icon: Archive,
      color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800",
      href: "/dashboard/archives" },
    { label: "Urgents", value: urgent, icon: AlertTriangle,
      color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/30",
      href: "/dashboard/courriers?statut=URGENT" },
    { label: "Très urgents", value: tresUrgents, icon: AlertOctagon,
      color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/40",
      href: "/dashboard/courriers?priorite=TRES_URGENTE" },
  ]

  // Boutons d'accès rapide — actions les plus fréquentes
  const quickAccess = [
    { label: "Nouveau courrier", icon: PlusCircle, href: "/dashboard/courriers/nouveau",
      bg: "bg-blue-500 hover:bg-blue-600", text: "text-white" },
    { label: "Courriers entrants", icon: Inbox, href: "/dashboard/courriers/entrants",
      bg: "bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60",
      text: "text-emerald-700 dark:text-emerald-300" },
    { label: "Courriers sortants", icon: Send, href: "/dashboard/courriers/sortants",
      bg: "bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60",
      text: "text-purple-700 dark:text-purple-300" },
    { label: "Rechercher", icon: Search, href: "/dashboard/courriers",
      bg: "bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60",
      text: "text-amber-700 dark:text-amber-300" },
    { label: "Archiver document", icon: FileSearch, href: "/dashboard/archives/nouveau",
      bg: "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
      text: "text-gray-700 dark:text-gray-300" },
    { label: "Statistiques", icon: BarChart3, href: "/dashboard/statistiques",
      bg: "bg-pink-100 dark:bg-pink-900/40 hover:bg-pink-200 dark:hover:bg-pink-900/60",
      text: "text-pink-700 dark:text-pink-300" },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">
            Bonjour, <span className="font-medium">{session?.user.name}</span>
          </p>
        </div>
        {notifNonLues > 0 && (
          <Link href="/dashboard/notifications">
            <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 gap-1.5 cursor-pointer">
              <Bell className="h-3.5 w-3.5" />
              {notifNonLues} notification{notifNonLues > 1 ? "s" : ""} non lue{notifNonLues > 1 ? "s" : ""}
            </Badge>
          </Link>
        )}
      </div>

      {/* Accès rapide */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Accès rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickAccess.map((q) => (
              <Link
                key={q.label}
                href={q.href}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-all hover:scale-[1.02] ${q.bg} ${q.text}`}
              >
                <q.icon className="h-6 w-6" />
                <span className="text-xs font-medium text-center leading-tight">{q.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques cliquables */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Statistiques · cliquez pour filtrer
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href} className="group">
              <Card className="border-0 shadow-sm group-hover:shadow-md group-hover:scale-[1.02] transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Derniers courriers</span>
              <Link href="/dashboard/courriers" className="text-xs font-normal text-blue-600 hover:underline">
                Voir tout →
              </Link>
            </CardTitle>
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
                    <Link
                      key={t.type}
                      href={`/dashboard/courriers?type=${t.type}`}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded p-1 -mx-1 transition-colors"
                    >
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
                    </Link>
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
