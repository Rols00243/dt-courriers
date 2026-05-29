import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Activity } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

function detectDevice(userAgent: string | null): string {
  if (!userAgent) return "Inconnu"
  const ua = userAgent.toLowerCase()
  if (ua.includes("electron")) return "App Desktop"
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return "Mobile"
  if (ua.includes("edg/")) return "Edge"
  if (ua.includes("chrome")) return "Chrome"
  if (ua.includes("firefox")) return "Firefox"
  if (ua.includes("safari")) return "Safari"
  return "Autre"
}

export default async function ConnexionsPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const logs = await prisma.loginLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, email: true, role: true } } },
  })

  // Stats simples
  const last24h = logs.filter(
    (l) => Date.now() - new Date(l.createdAt).getTime() < 24 * 3600 * 1000
  ).length
  const uniqueUsersToday = new Set(
    logs
      .filter((l) => Date.now() - new Date(l.createdAt).getTime() < 24 * 3600 * 1000)
      .map((l) => l.userId)
  ).size

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
          <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Connexions</h1>
          <p className="text-gray-500 text-sm">
            Historique des connexions ({logs.length} dernières)
          </p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total enregistré</p>
            <p className="text-2xl font-bold mt-1">{logs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">24 dernières heures</p>
            <p className="text-2xl font-bold mt-1">{last24h}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Utilisateurs actifs (24h)</p>
            <p className="text-2xl font-bold mt-1">{uniqueUsersToday}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="font-semibold">Utilisateur</TableHead>
                <TableHead className="font-semibold">Rôle</TableHead>
                <TableHead className="font-semibold">Quand</TableHead>
                <TableHead className="font-semibold">Date complète</TableHead>
                <TableHead className="font-semibold">Appareil</TableHead>
                <TableHead className="font-semibold">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                    Aucune connexion enregistrée pour l&apos;instant
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{l.user.name}</p>
                        <p className="text-xs text-gray-400">{l.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{l.user.role}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(l.createdAt), {
                        locale: fr, addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 font-mono text-xs">
                      {format(new Date(l.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-sm">{detectDevice(l.userAgent)}</TableCell>
                    <TableCell className="text-xs font-mono text-gray-500">
                      {l.ipAddress ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
