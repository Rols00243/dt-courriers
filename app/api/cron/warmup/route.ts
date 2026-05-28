import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Endpoint pinguée par Vercel Cron toutes les 5 minutes en heures de bureau.
 * Garde la function instance Vercel + la connexion Neon "chaudes" pour éviter
 * les cold starts (économie de ~1.5s par visiteur).
 */
export const dynamic = "force-dynamic"

export async function GET() {
  const start = Date.now()
  try {
    // Une requête minimale pour réveiller la connexion DB
    await prisma.user.count()
    return NextResponse.json({
      ok: true,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    )
  }
}
