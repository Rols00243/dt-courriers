import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(notifications)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id, all } = await req.json()

  if (all) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, lu: false },
      data: { lu: true },
    })
    return NextResponse.json({ success: true })
  }

  if (id) {
    await prisma.notification.update({
      where: { id, userId: session.user.id } as never,
      data: { lu: true },
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "id ou all requis" }, { status: 400 })
}
