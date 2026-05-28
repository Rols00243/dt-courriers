import { Loader2 } from "lucide-react"

export default function CourriersLoading() {
  return (
    <div className="p-6 space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
        <div className="h-9 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-3">
        <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 w-full bg-gray-50 dark:bg-gray-800/50 rounded" />
        ))}
      </div>
      <div className="flex items-center justify-center text-gray-400 gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement…
      </div>
    </div>
  )
}
