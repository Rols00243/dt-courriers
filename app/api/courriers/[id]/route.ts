import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { logAction } from "@/lib/audit"
import { STATUT_LABELS, PRIORITE_LABELS, NIVEAU_ACCES_LABELS } from "@/lib/constants"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const courrier = await prisma.courrier.findUnique({
    where: { id },
    include: { fichiers: true, createdBy: { select: { name: true, email: true } } },
  })

  if (!courrier) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
  return NextResponse.json(courrier)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.courrier.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

  if (existing.verrouille && body.verrouille !== false && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Document verrouillé" }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}
  const changes: string[] = []

  if (body.statut && body.statut !== existing.statut) {
    updates.statut = body.statut
    changes.push(`Statut: ${STATUT_LABELS[existing.statut]} → ${STATUT_LABELS[body.statut]}`)
  }
  if (body.priorite && body.priorite !== existing.priorite) {
    updates.priorite = body.priorite
    changes.push(`Priorité: ${PRIORITE_LABELS[existing.priorite]} → ${PRIORITE_LABELS[body.priorite]}`)
  }
  if (body.objet && body.objet !== existing.objet) {
    updates.objet = body.objet
    changes.push(`Objet modifié`)
  }
  if (body.description !== undefined && body.description !== existing.description) {
    updates.description = body.description
    changes.push(`Description modifiée`)
  }
  if (body.verrouille !== undefined && body.verrouille !== existing.verrouille) {
    updates.verrouille = body.verrouille
    changes.push(body.verrouille ? "Document verrouillé" : "Document déverrouillé")
  }
  if (body.niveauAcces !== undefined && body.niveauAcces !== existing.niveauAcces) {
    updates.niveauAcces = body.niveauAcces
    changes.push(
      `Niveau d'accès: ${NIVEAU_ACCES_LABELS[existing.niveauAcces]} → ${NIVEAU_ACCES_LABELS[body.niveauAcces]}`
    )
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(existing)
  }

  const courrier = await prisma.courrier.update({
    where: { id },
    data: updates,
  })

  await logAction({
    userId: session.user.id,
    action: "UPDATE_COURRIER",
    details: changes.join(" | "),
    courrierId: id,
  })

  return NextResponse.json(courrier)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.courrier.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

  await logAction({
    userId: session.user.id,
    action: "DELETE_COURRIER",
    details: `Suppression de ${existing.numero}: ${existing.objet}`,
  })

  await prisma.courrier.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
