import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { jsPDF } from "jspdf"
import {
  TYPE_LABELS, STATUT_LABELS, PRIORITE_LABELS, SENS_LABELS,
  NIVEAU_ACCES_LABELS,
} from "@/lib/constants"

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const data = await req.json()
  const {
    label, total, parType, parStatut, parPriorite, parSens, parNiveau,
    topExpediteurs, topDestinataires, topCollaborateurs, urgents, synthese,
  } = data

  const doc = new jsPDF()
  let y = 20

  // ─── En-tête ───
  doc.setFontSize(20).setFont("helvetica", "bold")
  doc.text("DT COURRIERS", 20, y)
  doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(100)
  doc.text("Rapport périodique de gestion documentaire", 20, y + 6)
  doc.setTextColor(0)
  y += 18

  doc.setDrawColor(200).line(20, y, 195, y); y += 10

  doc.setFontSize(16).setFont("helvetica", "bold")
  doc.text(label, 20, y); y += 8
  doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(120)
  doc.text(`Total de courriers enregistrés sur la période : ${total}`, 20, y); y += 6
  doc.text(`Généré le ${new Date().toLocaleString("fr-FR")}`, 20, y)
  doc.setTextColor(0); y += 12

  // ─── Synthèse IA ───
  if (synthese) {
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFontSize(13).setFont("helvetica", "bold")
    doc.text("Synthèse", 20, y); y += 6
    doc.setFontSize(10).setFont("helvetica", "normal")
    const lines = doc.splitTextToSize(synthese, 175)
    for (const line of lines) {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(line, 20, y); y += 5
    }
    y += 6
  }

  function section(titre: string) {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFontSize(12).setFont("helvetica", "bold").setTextColor(37, 99, 235)
    doc.text(titre, 20, y); y += 6
    doc.setTextColor(0).setFontSize(10).setFont("helvetica", "normal")
  }

  function ligne(label: string, value: string | number) {
    if (y > 275) { doc.addPage(); y = 20 }
    doc.text(label, 25, y)
    doc.text(String(value), 170, y, { align: "right" })
    y += 5
  }

  // ─── Répartition par type ───
  if (parType.length > 0) {
    section("Répartition par type de document")
    for (const t of parType) {
      const pct = total > 0 ? Math.round((t._count / total) * 100) : 0
      ligne(TYPE_LABELS[t.type] ?? t.type, `${t._count}  (${pct}%)`)
    }
    y += 4
  }

  // ─── Statuts ───
  if (parStatut.length > 0) {
    section("Répartition par statut")
    for (const s of parStatut) {
      const pct = total > 0 ? Math.round((s._count / total) * 100) : 0
      ligne(STATUT_LABELS[s.statut] ?? s.statut, `${s._count}  (${pct}%)`)
    }
    y += 4
  }

  // ─── Priorités ───
  if (parPriorite.length > 0) {
    section("Répartition par priorité")
    for (const p of parPriorite) {
      const pct = total > 0 ? Math.round((p._count / total) * 100) : 0
      ligne(PRIORITE_LABELS[p.priorite] ?? p.priorite, `${p._count}  (${pct}%)`)
    }
    y += 4
  }

  // ─── Sens ───
  if (parSens.length > 0) {
    section("Répartition par sens")
    for (const s of parSens) {
      const pct = total > 0 ? Math.round((s._count / total) * 100) : 0
      ligne(SENS_LABELS[s.sens] ?? s.sens, `${s._count}  (${pct}%)`)
    }
    y += 4
  }

  // ─── Niveau d'accès ───
  if (parNiveau.length > 0) {
    section("Répartition par niveau d'accès")
    for (const n of parNiveau) {
      const pct = total > 0 ? Math.round((n._count / total) * 100) : 0
      ligne(NIVEAU_ACCES_LABELS[n.niveauAcces] ?? n.niveauAcces, `${n._count}  (${pct}%)`)
    }
    y += 4
  }

  // ─── Top expéditeurs ───
  if (topExpediteurs.length > 0) {
    section(`Top ${topExpediteurs.length} expéditeurs`)
    let i = 1
    for (const e of topExpediteurs) {
      ligne(`${i}. ${e.expediteur}`, e._count)
      i++
    }
    y += 4
  }

  // ─── Top destinataires ───
  if (topDestinataires.length > 0) {
    section(`Top ${topDestinataires.length} destinataires`)
    let i = 1
    for (const d of topDestinataires) {
      ligne(`${i}. ${d.destinataire}`, d._count)
      i++
    }
    y += 4
  }

  // ─── Top collaborateurs ───
  if (topCollaborateurs.length > 0) {
    section(`Top ${topCollaborateurs.length} collaborateurs (créateurs)`)
    let i = 1
    for (const c of topCollaborateurs) {
      ligne(`${i}. ${c.nom}`, c.count)
      i++
    }
    y += 4
  }

  // ─── Liste des urgents ───
  if (urgents.length > 0) {
    section(`Courriers urgents (${urgents.length})`)
    for (const u of urgents) {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.setFont("helvetica", "bold")
      doc.text(u.numero, 25, y)
      doc.setFont("helvetica", "normal").setFontSize(9)
      doc.text(`[${PRIORITE_LABELS[u.priorite]}]`, 60, y)
      const objet = doc.splitTextToSize(u.objet, 100)[0]
      doc.text(objet, 90, y)
      doc.setFontSize(10)
      y += 5
    }
  }

  // ─── Footer ───
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8).setTextColor(150)
    doc.text(
      `DT Courriers · ${label} · Page ${i}/${pageCount}`,
      105, 290, { align: "center" }
    )
  }

  const buf = Buffer.from(doc.output("arraybuffer"))
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Rapport ${label}.pdf"`,
    },
  })
}
