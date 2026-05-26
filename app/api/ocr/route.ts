import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export const maxDuration = 60

/**
 * OCR via Tesseract.js — fonctionne en mode desktop (Electron) mais désactivé
 * sur Vercel serverless (taille du worker + WebAssembly dépasse les limites).
 *
 * Sur Vercel, recommander à l'utilisateur d'utiliser /api/analyze (OpenAI Vision)
 * qui fait mieux que Tesseract pour les courriers scannés.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // En environnement serverless (Vercel), Tesseract.js est trop lourd
  if (process.env.VERCEL === "1") {
    return NextResponse.json(
      {
        error:
          "L'OCR Tesseract n'est pas disponible sur la version web. Utilisez le bouton « Analyser » (IA) qui extrait directement les données du document.",
      },
      { status: 501 }
    )
  }

  // En local / desktop : OCR via Tesseract.js
  const fd = await req.formData()
  const file = fd.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 })

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let worker
  try {
    const { createWorker } = await import("tesseract.js")
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
