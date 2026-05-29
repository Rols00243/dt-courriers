import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { logAction, createNotification } from "@/lib/audit"
import { emailCommentaire } from "@/lib/email"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const courrierId = new URL(req.url).searchParams.get("courrierId")
  if (!courrierId) return NextResponse.json({ error: "courrierId requis" }, { status: 400 })

  const comments = await prisma.comment.findMany({
    where: { courrierId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, email: true, role: true } } },
  })

  return NextResponse.json(comments)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { courrierId, contenu } = await req.json()
  if (!courrierId || !contenu) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: {
      contenu,
      courrierId,
      authorId: session.user.id,
    },
    include: { author: { select: { name: true, email: true, role: true } } },
  })

  const courrier = await prisma.courrier.findUnique({
    where: { id: courrierId },
    select: { numero: true, createdById: true, objet: true },
  })

  await logAction({
    userId: session.user.id,
    action: "ADD_COMMENT",
    details: `Commentaire sur ${courrier?.numero}`,
    courrierId,
  })

  if (courrier && courrier.createdById !== session.user.id) {
    await createNotification({
      userId: courrier.createdById,
      type: "COMMENT",
      titre: "Nouveau commentaire",
      message: `${session.user.name} a commenté ${courrier.numero}`,
      lien: `/dashboard/courriers/${courrierId}`,
    })

    // Email best-effort : ne bloque jamais la réponse API
    try {
      const destinataire = await prisma.user.findUnique({
        where: { id: courrier.createdById },
        select: { email: true, name: true },
      })
      if (destinataire) {
        const baseUrl =
          process.env.NEXTAUTH_URL ?? `http://${req.headers.get("host") ?? "localhost:3000"}`
        await emailCommentaire({
          to: destinataire.email,
          destinataireName: destinataire.name ?? "",
          auteurName: session.user.name ?? session.user.email ?? "Un collaborateur",
          courrierNumero: courrier.numero,
          courrierObjet: courrier.objet,
          contenu: contenu,
          courrierUrl: `${baseUrl}/dashboard/courriers/${courrierId}`,
        })
      }
    } catch (e) {
      console.error("Email comment error:", e)
    }
  }

  return NextResponse.json(comment, { status: 201 })
}
