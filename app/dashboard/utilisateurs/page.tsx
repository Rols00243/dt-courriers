import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  GESTIONNAIRE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  AGENT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

export default async function UtilisateursPage() {
  const session = await auth()
  if (session?.user.role !== "ADMIN") redirect("/dashboard")

  const utilisateurs = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { courriers: true } } },
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-gray-500 text-sm">{utilisateurs.length} utilisateur(s)</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="font-semibold">Nom</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Rôle</TableHead>
                <TableHead className="font-semibold">Courriers</TableHead>
                <TableHead className="font-semibold">Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {utilisateurs.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{u.email}</TableCell>
                  <TableCell>
                    <Badge className={ROLE_COLORS[u.role]} variant="outline">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{u._count.courriers}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: fr })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
