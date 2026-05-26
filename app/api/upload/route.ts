import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export const maxDuration = 60

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

  const uploadDir = path.join(process.cwd(), "public", "uploads", courrierId)
  await mkdir(uploadDir, { recursive: true })

  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  const filepath = path.join(uploadDir, filename)
  await writeFile(filepath, buffer)

  const fichier = await prisma.fichier.create({
    data: {
      nom: file.name,
      url: `/uploads/${courrierId}/${filename}`,
      taille: file.size,
      type: file.type,
      ocrTexte,
      courrierId,
    },
  })

  return NextResponse.json(fichier, { status: 201 })
}
