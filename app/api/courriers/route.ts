import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { genererNumero } from "@/lib/numero"
import { logAction, notifyAdmins } from "@/lib/audit"
import { PAGE_SIZE } from "@/lib/constants"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  const type = searchParams.get("type") ?? ""
  const statut = searchParams.get("statut") ?? ""
  const sens = searchParams.get("sens") ?? ""
  const priorite = searchParams.get("priorite") ?? ""
  const collaborateur = searchParams.get("collaborateur") ?? ""
  const dateDebut = searchParams.get("dateDebut") ?? ""
  const dateFin = searchParams.get("dateFin") ?? ""
  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const pageSize = parseInt(searchParams.get("pageSize") ?? String(PAGE_SIZE), 10)

  const where = {
    AND: [
      q ? {
        OR: [
          { objet: { contains: q, mode: "insensitive" as const } },
          { expediteur: { contains: q, mode: "insensitive" as const } },
          { destinataire: { contains: q, mode: "insensitive" as const } },
          { numero: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      } : {},
      type ? { type: type as never } : {},
      statut ? { statut: statut as never } : {},
      sens ? { sens: sens as never } : {},
      priorite ? { priorite: priorite as never } : {},
      collaborateur ? { createdById: collaborateur } : {},
      dateDebut ? { dateDocument: { gte: new Date(dateDebut) } } : {},
      dateFin ? { dateDocument: { lte: new Date(dateFin + "T23:59:59") } } : {},
    ],
  }

  const [total, courriers] = await Promise.all([
    prisma.courrier.count({ where }),
    prisma.courrier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        fichiers: true,
        createdBy: { select: { name: true, email: true } },
        _count: { select: { comments: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return NextResponse.json({
    courriers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const { objet, type, sens, statut, priorite, expediteur, destinataire, dateDocument, dateReception, description } = body

  if (!objet || !type || !sens || !expediteur || !destinataire || !dateDocument) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
  }

  const numero = await genererNumero(type)

  const courrier = await prisma.courrier.create({
    data: {
      numero,
      objet,
      type,
      sens,
      statut: statut ?? "EN_ATTENTE",
      priorite: priorite ?? "NORMALE",
      expediteur,
      destinataire,
      dateDocument: new Date(dateDocument),
      dateReception: dateReception ? new Date(dateReception) : null,
      description: description ?? null,
      createdById: session.user.id,
    },
  })

  await logAction({
    userId: session.user.id,
    action: "CREATE_COURRIER",
    details: `Création du courrier ${numero}: ${objet}`,
    courrierId: courrier.id,
  })

  if (priorite === "URGENTE" || priorite === "TRES_URGENTE" || statut === "URGENT") {
    await notifyAdmins({
      type: "URGENT",
      titre: "Nouveau courrier urgent",
      message: `${numero} - ${objet}`,
      lien: `/dashboard/courriers/${courrier.id}`,
      exceptUserId: session.user.id,
    })
  }

  return NextResponse.json(courrier, { status: 201 })
}
