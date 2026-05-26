import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { canManageUsers } from "@/lib/permissions"
import { Users } from "lucide-react"
import { UtilisateursClient } from "./utilisateurs-client"

export default async function UtilisateursPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, peutGererUtilisateurs: true },
  })

  if (!canManageUsers(session, me ?? undefined)) {
    redirect("/dashboard")
  }

  const utilisateurs = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, email: true, role: true,
      niveauAcces: true, peutGererUtilisateurs: true, actif: true,
      createdAt: true,
      _count: { select: { courriers: true } },
    },
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-gray-500 text-sm">
            {utilisateurs.length} compte(s) — gestion par {session.user.role === "ADMIN" ? "admin" : "délégation"}
          </p>
        </div>
      </div>

      <UtilisateursClient
        initialUsers={utilisateurs.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
        myId={session.user.id}
        myRole={session.user.role}
      />
    </div>
  )
}
