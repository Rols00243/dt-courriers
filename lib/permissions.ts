import { Session } from "next-auth"
import { NIVEAU_ACCES_ORDER } from "@/lib/constants"

/**
 * Indique si l'utilisateur peut administrer les comptes :
 * - tout ADMIN
 * - tout GESTIONNAIRE à qui l'admin a explicitement délégué cette permission
 */
export function canManageUsers(session: Session | null, dbUser?: { peutGererUtilisateurs?: boolean; role?: string }): boolean {
  if (!session) return false
  if (session.user.role === "ADMIN") return true
  if (dbUser?.role === "ADMIN") return true
  if (dbUser?.peutGererUtilisateurs) return true
  return false
}

/**
 * Filtre Prisma à appliquer à toute lecture de courriers pour respecter
 * la confidentialité. ADMIN voit tout, sinon on filtre par niveauAcces.
 */
export function courrierAccessFilter(session: Session | null, niveauAcces: string) {
  if (!session) return { id: "__never__" } // bloque tout

  if (session.user.role === "ADMIN") return {} // admin voit tout

  // Niveaux que l'utilisateur peut voir : tous ceux ≤ son niveau
  const userLevel = NIVEAU_ACCES_ORDER[niveauAcces] ?? 0
  const allowedLevels = Object.entries(NIVEAU_ACCES_ORDER)
    .filter(([, level]) => level <= userLevel)
    .map(([key]) => key)

  return { niveauAcces: { in: allowedLevels as never } }
}

/**
 * Vérifie si l'utilisateur peut accéder à un courrier précis.
 */
export function canViewCourrier(
  session: Session | null,
  userNiveauAcces: string,
  courrier: { niveauAcces: string; createdById: string }
): boolean {
  if (!session) return false
  if (session.user.role === "ADMIN") return true
  if (courrier.createdById === session.user.id) return true // l'auteur voit toujours
  return (NIVEAU_ACCES_ORDER[userNiveauAcces] ?? 0) >= (NIVEAU_ACCES_ORDER[courrier.niveauAcces] ?? 99)
}
