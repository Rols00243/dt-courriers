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

// Niveaux d'accès / confidentialité (ordre hiérarchique)
export const NIVEAU_ACCES_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  INTERNE: "Interne",
  CONFIDENTIEL: "Confidentiel",
  SECRET: "Secret",
}

export const NIVEAU_ACCES_COLORS: Record<string, string> = {
  PUBLIC: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  INTERNE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  CONFIDENTIEL: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  SECRET: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

// Hiérarchie : un utilisateur de niveau X voit les courriers de niveau ≤ X
export const NIVEAU_ACCES_ORDER: Record<string, number> = {
  PUBLIC: 1,
  INTERNE: 2,
  CONFIDENTIEL: 3,
  SECRET: 4,
}

export function canAccessDocument(userLevel: string, docLevel: string): boolean {
  return (NIVEAU_ACCES_ORDER[userLevel] ?? 0) >= (NIVEAU_ACCES_ORDER[docLevel] ?? 99)
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  GESTIONNAIRE: "Gestionnaire",
  AGENT: "Agent",
}

export const PAGE_SIZE = 15
