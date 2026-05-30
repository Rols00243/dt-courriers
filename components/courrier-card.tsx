"use client"

import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { FileText, MessageSquare, Lock, Paperclip } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  STATUT_LABELS, STATUT_COLORS, TYPE_LABELS,
  PRIORITE_COLORS, PRIORITE_LABELS,
  NIVEAU_ACCES_LABELS, NIVEAU_ACCES_COLORS,
} from "@/lib/constants"

interface Fichier {
  id: string
  nom: string
  url: string
  type: string
}

interface Courrier {
  id: string
  numero: string
  objet: string
  type: string
  statut: string
  priorite: string
  niveauAcces: string
  expediteur: string
  dateDocument: string
  verrouille: boolean
  fichiers: Fichier[]
  createdBy: { name: string | null }
  _count: { comments: number }
}

/**
 * Carte courrier pour la vue grille / aperçu :
 * - Pas de pièce jointe → icône courrier
 * - 1ère pièce est une image → miniature direct
 * - 1ère pièce est un PDF → icône PDF avec nom du fichier
 * - 1ère pièce est autre → icône fichier
 */
export function CourrierCard({ courrier }: { courrier: Courrier }) {
  const first = courrier.fichiers[0]
  const isImage = first && (first.type?.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(first.nom))
  const isPdf = first && (first.type === "application/pdf" || first.nom.toLowerCase().endsWith(".pdf"))

  return (
    <Link
      href={`/dashboard/courriers/${courrier.id}`}
      className="group flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
    >
      {/* Aperçu / miniature */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
        {isImage && first ? (
          <Image
            src={first.url}
            alt={first.nom}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : isPdf ? (
          <div className="flex flex-col items-center gap-2 p-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
              <FileText className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs text-gray-500 text-center line-clamp-2 max-w-full">{first.nom}</p>
          </div>
        ) : first ? (
          <div className="flex flex-col items-center gap-2 p-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
              <Paperclip className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-gray-500 text-center line-clamp-2">{first.nom}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-50">
            <FileText className="h-16 w-16 text-gray-400" />
            <p className="text-xs text-gray-400">Pas de pièce</p>
          </div>
        )}

        {/* Badges flottants en haut */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <Badge className={`text-[10px] shadow-sm ${STATUT_COLORS[courrier.statut]}`} variant="outline">
            {STATUT_LABELS[courrier.statut]}
          </Badge>
          {courrier.priorite !== "NORMALE" && (
            <Badge className={`text-[10px] shadow-sm ${PRIORITE_COLORS[courrier.priorite]}`} variant="outline">
              {PRIORITE_LABELS[courrier.priorite]}
            </Badge>
          )}
        </div>

        {/* Indicateurs en bas droit */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {courrier.verrouille && (
            <div className="bg-amber-100 dark:bg-amber-900/40 p-1 rounded shadow-sm" title="Verrouillé">
              <Lock className="h-3 w-3 text-amber-700 dark:text-amber-300" />
            </div>
          )}
          {courrier.fichiers.length > 1 && (
            <div className="bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm text-gray-700 dark:text-gray-300">
              +{courrier.fichiers.length - 1}
            </div>
          )}
        </div>
      </div>

      {/* Infos */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400 truncate">
            {courrier.numero}
          </span>
          <Badge
            className={`text-[10px] flex-shrink-0 ${NIVEAU_ACCES_COLORS[courrier.niveauAcces]}`}
            variant="outline"
          >
            {NIVEAU_ACCES_LABELS[courrier.niveauAcces]}
          </Badge>
        </div>
        <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {courrier.objet}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {TYPE_LABELS[courrier.type]} · {courrier.expediteur}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
          <span>
            {format(new Date(courrier.dateDocument), "dd MMM yyyy", { locale: fr })}
          </span>
          {courrier._count.comments > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {courrier._count.comments}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
