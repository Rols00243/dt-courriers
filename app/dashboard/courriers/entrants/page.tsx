import { prisma } from "@/lib/prisma"
import { Inbox } from "lucide-react"
import { CourriersTable } from "@/components/courriers-table"

export default async function EntrantsPage() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
          <Inbox className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Courriers entrants</h1>
          <p className="text-gray-500 text-sm">Tous les courriers reçus</p>
        </div>
      </div>
      <CourriersTable users={users} sensFilter="ENTRANT" />
    </div>
  )
}
