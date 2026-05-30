import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { FileSpreadsheet } from "lucide-react"
import { RapportsClient } from "./rapports-client"

export default async function RapportsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
          <FileSpreadsheet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Rapports périodiques</h1>
          <p className="text-gray-500 text-sm">
            Synthèses automatiques mensuelles, semestrielles ou annuelles
          </p>
        </div>
      </div>
      <RapportsClient />
    </div>
  )
}
