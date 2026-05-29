import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import QRCode from "qrcode"

/**
 * Génère un QR code PNG pour l'URL d'un courrier.
 *
 * Optimisations :
 * - Pas de requête DB : le QR ne fait qu'encoder une URL, on n'a pas besoin
 *   de vérifier l'existence du courrier en BDD.
 * - Cache HTTP très long (immutable, 30 jours) : un QR pour un ID donné
 *   ne change jamais.
 * - Headers ETag pour les 304 Not Modified.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const host = req.headers.get("host") ?? "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  const url = `${protocol}://${host}/dashboard/courriers/${id}`

  const png = await QRCode.toBuffer(url, {
    width: 320,
    margin: 1,
    color: { dark: "#1e293b", light: "#ffffff" },
  })

  // ETag basé sur l'URL → permet les 304 Not Modified si le navigateur a la version
  const etag = `"qr-${Buffer.from(url).toString("base64").slice(0, 16)}"`
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304 })
  }

  return new NextResponse(png as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=2592000, immutable",
      ETag: etag,
    },
  })
}
