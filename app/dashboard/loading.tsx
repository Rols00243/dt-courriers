import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border-0 shadow-sm rounded-lg p-4 space-y-3">
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            <div className="h-7 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center text-gray-400 gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des données…
      </div>
    </div>
  )
}
