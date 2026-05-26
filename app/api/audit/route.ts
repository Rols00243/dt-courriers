import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const courrierId = searchParams.get("courrierId")
  const limit = parseInt(searchParams.get("limit") ?? "50", 10)

  const logs = await prisma.auditLog.findMany({
    where: courrierId ? { courrierId } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
      courrier: { select: { numero: true, objet: true } },
    },
  })

  return NextResponse.json(logs)
}
