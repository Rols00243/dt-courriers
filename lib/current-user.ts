import "server-only"
import { cache } from "react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * Récupère l'utilisateur courant + son rôle + son niveau d'accès.
 * Wrappé dans React `cache()` → dédupliqué au sein d'une même requête HTTP :
 * appelé 3 fois dans un layout + ses pages, on ne fait qu'**une seule** requête
 * Prisma au lieu de 3.
 *
 * Retourne null si pas connecté.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      niveauAcces: true,
      peutGererUtilisateurs: true,
      actif: true,
    },
  })

  if (!user || !user.actif) return null
  return { ...user, session }
})

/**
 * Variante qui throw / redirige si non authentifié.
 * Utile dans les pages qui doivent absolument avoir un user.
 */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    const { redirect } = await import("next/navigation")
    redirect("/login")
  }
  return user
}
