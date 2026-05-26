import { prisma } from "@/lib/prisma"
import { Send } from "lucide-react"
import { CourriersTable } from "@/components/courriers-table"

export default async function SortantsPage() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
          <Send className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Courriers sortants</h1>
          <p className="text-gray-500 text-sm">Tous les courriers envoyés</p>
        </div>
      </div>
      <CourriersTable users={users} sensFilter="SORTANT" />
    </div>
  )
}
