import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { PlusCircle, Mail } from "lucide-react"
import Link from "next/link"
import { CourriersTable } from "@/components/courriers-table"

export default async function CourriersPage() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tous les courriers</h1>
            <p className="text-gray-500 text-sm">Recherche et gestion des courriers</p>
          </div>
        </div>
        <Link href="/dashboard/courriers/nouveau">
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <PlusCircle className="h-4 w-4" />
            Nouveau courrier
          </Button>
        </Link>
      </div>

      <CourriersTable users={users} />
    </div>
  )
}
