import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createWorker } from "tesseract.js"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const fd = await req.formData()
  const file = fd.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 })

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let worker
  try {
    worker = await createWorker("fra+eng")
    const { data } = await worker.recognize(buffer)
    const text = data.text.trim()

    const objet = text.split("\n").find((l) => l.trim().length > 5)?.slice(0, 200) ?? ""

    return NextResponse.json({ text, objet })
  } catch (e: unknown) {
    console.error("OCR error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur OCR" },
      { status: 500 }
    )
  } finally {
    if (worker) await worker.terminate()
  }
}
