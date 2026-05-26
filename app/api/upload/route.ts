import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export const maxDuration = 60

/**
 * Upload de fichiers.
 *
 * - Desktop (Electron) / local : écriture dans public/uploads/{courrierId}/
 * - Vercel : disque en lecture seule → stockage en base64 dans la BDD (champ url)
 *   Pas idéal pour de gros fichiers, OK pour des PDFs < 4 MB.
 *
 * TODO : pour un usage production lourd, brancher Vercel Blob / S3 / R2.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  const courrierId = formData.get("courrierId") as string
  const ocrTexte = (formData.get("ocrTexte") as string) ?? null

  if (!file || !courrierId) {
    return NextResponse.json({ error: "Fichier ou ID manquant" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const isServerless = process.env.VERCEL === "1"

  let url: string

  if (isServerless) {
    // Vercel : data URL en BDD (suffisant pour MVP, à remplacer par Vercel Blob)
    if (buffer.length > 4 * 1024 * 1024) {
      return NextResponse.json(
        {
          error:
            "Fichier trop volumineux pour la version web (max 4 MB). Utilisez l'application desktop pour les gros fichiers.",
        },
        { status: 413 }
      )
    }
    const base64 = buffer.toString("base64")
    url = `data:${file.type || "application/octet-stream"};base64,${base64}`
  } else {
    // Desktop / local : disque
    const uploadDir = path.join(process.cwd(), "public", "uploads", courrierId)
    await mkdir(uploadDir, { recursive: true })
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)
    url = `/uploads/${courrierId}/${filename}`
  }

  const fichier = await prisma.fichier.create({
    data: {
      nom: file.name,
      url,
      taille: file.size,
      type: file.type,
      ocrTexte,
      courrierId,
    },
  })

  return NextResponse.json(fichier, { status: 201 })
}
