import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import QRCode from "qrcode"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const courrier = await prisma.courrier.findUnique({
    where: { id },
    select: { id: true, numero: true, objet: true, verrouille: true },
  })

  if (!courrier) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

  const origin = req.headers.get("origin") ?? `http://${req.headers.get("host") ?? "localhost:3000"}`
  const url = `${origin}/dashboard/courriers/${id}`

  const png = await QRCode.toBuffer(url, {
    width: 320,
    margin: 1,
    color: { dark: "#1e293b", light: "#ffffff" },
  })

  return new NextResponse(png as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
