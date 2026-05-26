import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ enAttente: 0, notifications: 0 })

  const [enAttente, notifications] = await Promise.all([
    prisma.courrier.count({ where: { statut: "EN_ATTENTE" } }),
    prisma.notification.count({ where: { userId: session.user.id, lu: false } }),
  ])

  return NextResponse.json({ enAttente, notifications })
}
