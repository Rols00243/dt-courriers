import { Loader2 } from "lucide-react"

export default function CourrierDetailLoading() {
  return (
    <div className="p-6 max-w-6xl animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="space-y-2">
          <div className="h-6 w-80 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-5 h-96" />
          <div className="bg-white dark:bg-gray-900 rounded-lg p-5 h-48" />
        </div>
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-5 h-56" />
          <div className="bg-white dark:bg-gray-900 rounded-lg p-5 h-40" />
        </div>
      </div>
      <div className="flex items-center justify-center text-gray-400 gap-2 text-sm mt-6">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement du courrier…
      </div>
    </div>
  )
}
