export const TYPE_LABELS: Record<string, string> = {
  COURRIER_ENTRANT: "Courrier entrant",
  COURRIER_SORTANT: "Courrier sortant",
  COURRIER_INTERNE: "Courrier interne",
  PV_COMMISSION: "PV de commission",
  ORDRE_MISSION: "Ordre de mission",
  RAPPORT_SEMESTRIEL: "Rapport semestriel",
  RAPPORT_ANNUEL: "Rapport annuel",
  DOCUMENT_OFFICIEL: "Document officiel",
}

export const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  TRAITE: "Traité",
  ARCHIVE: "Archivé",
  URGENT: "Urgent",
}

export const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  EN_COURS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  TRAITE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  ARCHIVE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

export const PRIORITE_LABELS: Record<string, string> = {
  BASSE: "Basse",
  NORMALE: "Normale",
  URGENTE: "Urgente",
  TRES_URGENTE: "Très urgente",
}

export const PRIORITE_COLORS: Record<string, string> = {
  BASSE: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  NORMALE: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  URGENTE: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300",
  TRES_URGENTE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-semibold",
}

export const SENS_LABELS: Record<string, string> = {
  ENTRANT: "Entrant",
  SORTANT: "Sortant",
  INTERNE: "Interne",
}

export const PAGE_SIZE = 15
