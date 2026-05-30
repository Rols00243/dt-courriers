import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"
import { TYPE_LABELS, STATUT_LABELS, PRIORITE_LABELS } from "@/lib/constants"

export const maxDuration = 60

/**
 * POST /api/rapports/generer
 * Body : { periode: "MOIS" | "SEMESTRE" | "ANNEE", annee: number, mois?: 1..12, semestre?: 1|2 }
 *
 * Retourne les stats agrégées sur la période + optionnellement une synthèse
 * rédigée par OpenAI à partir des chiffres.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const { periode, annee, mois, semestre, avecIA = true } = body

  if (!["MOIS", "SEMESTRE", "ANNEE"].includes(periode)) {
    return NextResponse.json({ error: "Période invalide" }, { status: 400 })
  }
  if (!annee || annee < 2020 || annee > 2100) {
    return NextResponse.json({ error: "Année invalide" }, { status: 400 })
  }

  // Calcule les bornes de la période
  let debut: Date, fin: Date, label: string
  if (periode === "MOIS") {
    if (!mois || mois < 1 || mois > 12) {
      return NextResponse.json({ error: "Mois invalide" }, { status: 400 })
    }
    debut = new Date(annee, mois - 1, 1)
    fin = new Date(annee, mois, 1)
    const moisLabels = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ]
    label = `${moisLabels[mois - 1]} ${annee}`
  } else if (periode === "SEMESTRE") {
    if (!semestre || (semestre !== 1 && semestre !== 2)) {
      return NextResponse.json({ error: "Semestre invalide" }, { status: 400 })
    }
    debut = new Date(annee, semestre === 1 ? 0 : 6, 1)
    fin = new Date(annee, semestre === 1 ? 6 : 12, 1)
    label = `S${semestre} ${annee}`
  } else {
    debut = new Date(annee, 0, 1)
    fin = new Date(annee + 1, 0, 1)
    label = `Année ${annee}`
  }

  const where = { createdAt: { gte: debut, lt: fin } }

  // Toutes les agrégations en parallèle
  const [
    total, parType, parStatut, parPriorite, parSens, parNiveau,
    topExpediteurs, topDestinataires, urgents, parCreator,
  ] = await Promise.all([
    prisma.courrier.count({ where }),
    prisma.courrier.groupBy({ by: ["type"], where, _count: true }),
    prisma.courrier.groupBy({ by: ["statut"], where, _count: true }),
    prisma.courrier.groupBy({ by: ["priorite"], where, _count: true }),
    prisma.courrier.groupBy({ by: ["sens"], where, _count: true }),
    prisma.courrier.groupBy({ by: ["niveauAcces"], where, _count: true }),
    prisma.courrier.groupBy({
      by: ["expediteur"], where, _count: true,
      orderBy: { _count: { expediteur: "desc" } }, take: 10,
    }),
    prisma.courrier.groupBy({
      by: ["destinataire"], where, _count: true,
      orderBy: { _count: { destinataire: "desc" } }, take: 10,
    }),
    prisma.courrier.findMany({
      where: { ...where, OR: [{ priorite: "URGENTE" }, { priorite: "TRES_URGENTE" }, { statut: "URGENT" }] },
      select: { numero: true, objet: true, priorite: true, statut: true, expediteur: true, dateDocument: true },
      orderBy: { dateDocument: "desc" }, take: 20,
    }),
    prisma.courrier.groupBy({
      by: ["createdById"], where, _count: true,
      orderBy: { _count: { createdById: "desc" } }, take: 10,
    }),
  ])

  // Résoudre les noms des collaborateurs
  const userIds = parCreator.map((p) => p.createdById)
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
    : []
  const userMap = new Map(users.map((u) => [u.id, u.name ?? "Inconnu"]))
  const topCollaborateurs = parCreator.map((p) => ({
    nom: userMap.get(p.createdById) ?? "Inconnu",
    count: p._count,
  }))

  // Évolution journalière (pour graphique)
  const courriersBruts = await prisma.courrier.findMany({
    where, select: { createdAt: true },
  })
  const dailyMap = new Map<string, number>()
  for (const c of courriersBruts) {
    const k = c.createdAt.toISOString().slice(0, 10)
    dailyMap.set(k, (dailyMap.get(k) ?? 0) + 1)
  }
  const evolution = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // Synthèse IA (optionnelle)
  let synthese: string | null = null
  if (avecIA && process.env.OPENAI_API_KEY && total > 0) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
      const stats = {
        periode: label,
        total,
        types: parType.map((t) => `${TYPE_LABELS[t.type]}: ${t._count}`).join(", "),
        statuts: parStatut.map((s) => `${STATUT_LABELS[s.statut]}: ${s._count}`).join(", "),
        priorites: parPriorite.map((p) => `${PRIORITE_LABELS[p.priorite]}: ${p._count}`).join(", "),
        urgents_count: urgents.length,
        top_expediteurs: topExpediteurs.slice(0, 5).map((e) => `${e.expediteur} (${e._count})`).join(", "),
        top_destinataires: topDestinataires.slice(0, 5).map((d) => `${d.destinataire} (${d._count})`).join(", "),
        top_collaborateurs: topCollaborateurs.slice(0, 5).map((c) => `${c.nom} (${c.count})`).join(", "),
      }
      const resp = await client.responses.create({
        model,
        instructions:
          "Tu rédiges une synthèse administrative professionnelle en français à partir de statistiques de courriers. Format : 3-5 paragraphes courts, ton factuel, pas de jargon, mets en avant les éléments saillants (volumes, urgences, acteurs principaux, tendances). Pas de liste à puces, du texte fluide.",
        input: `Statistiques pour ${stats.periode} :
- Total de courriers : ${stats.total}
- Répartition par type : ${stats.types}
- Statuts : ${stats.statuts}
- Priorités : ${stats.priorites}
- Courriers urgents : ${stats.urgents_count}
- Top expéditeurs : ${stats.top_expediteurs}
- Top destinataires : ${stats.top_destinataires}
- Top collaborateurs : ${stats.top_collaborateurs}

Rédige la synthèse.`,
        max_output_tokens: 800,
      })
      synthese = resp.output_text ?? null
    } catch (e) {
      console.error("Synthèse IA error:", e)
    }
  }

  return NextResponse.json({
    periode, label, debut, fin, total,
    parType: parType.sort((a, b) => b._count - a._count),
    parStatut: parStatut.sort((a, b) => b._count - a._count),
    parPriorite: parPriorite.sort((a, b) => b._count - a._count),
    parSens: parSens.sort((a, b) => b._count - a._count),
    parNiveau: parNiveau.sort((a, b) => b._count - a._count),
    topExpediteurs, topDestinataires, topCollaborateurs,
    urgents, evolution, synthese,
  })
}
