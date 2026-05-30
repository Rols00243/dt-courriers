import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NIVEAU_ACCES_ORDER } from "@/lib/constants"

/**
 * Recherche globale rapide pour la palette de commandes (Ctrl+K).
 * Limite à 10 résultats, respecte le niveau d'accès de l'utilisateur.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ courriers: [] })

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? ""
  if (q.length < 2) return NextResponse.json({ courriers: [] })

  // Filtre clearance (comme dans /api/courriers)
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { niveauAcces: true, role: true },
  })

  let accessFilter: Record<string, unknown> = {}
  if (me && me.role !== "ADMIN") {
    const userLevel = NIVEAU_ACCES_ORDER[me.niveauAcces] ?? 0
    const allowedLevels = Object.entries(NIVEAU_ACCES_ORDER)
      .filter(([, level]) => level <= userLevel)
      .map(([key]) => key)
    accessFilter = {
      OR: [
        { niveauAcces: { in: allowedLevels as never } },
        { createdById: session.user.id },
      ],
    }
  }

  const courriers = await prisma.courrier.findMany({
    where: {
      AND: [
        accessFilter,
        {
          OR: [
            { numero: { contains: q, mode: "insensitive" } },
            { objet: { contains: q, mode: "insensitive" } },
            { expediteur: { contains: q, mode: "insensitive" } },
            { destinataire: { contains: q, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true, numero: true, objet: true, type: true,
      statut: true, expediteur: true, dateDocument: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return NextResponse.json({ courriers })
}
