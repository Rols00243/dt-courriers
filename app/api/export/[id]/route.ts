import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { jsPDF } from "jspdf"
import QRCode from "qrcode"
import {
  TYPE_LABELS, STATUT_LABELS, PRIORITE_LABELS, SENS_LABELS,
} from "@/lib/constants"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const courrier = await prisma.courrier.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      fichiers: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  })

  if (!courrier) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

  const origin = req.headers.get("origin") ?? `http://${req.headers.get("host") ?? "localhost:3000"}`
  const qrDataUrl = await QRCode.toDataURL(`${origin}/dashboard/courriers/${id}`, {
    width: 200,
    margin: 1,
  })

  const doc = new jsPDF()
  let y = 20

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("DT COURRIERS", 20, y)
  y += 6
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("Fiche de courrier", 20, y)

  doc.addImage(qrDataUrl, "PNG", 160, 15, 35, 35)

  y += 15
  doc.setDrawColor(200)
  doc.line(20, y, 195, y)
  y += 10

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(courrier.numero, 20, y)
  y += 6

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(courrier.objet, 20, y, { maxWidth: 170 })
  y += 12

  const rows: [string, string][] = [
    ["Type", TYPE_LABELS[courrier.type]],
    ["Sens", SENS_LABELS[courrier.sens]],
    ["Statut", STATUT_LABELS[courrier.statut]],
    ["Priorité", PRIORITE_LABELS[courrier.priorite]],
    ["Expéditeur", courrier.expediteur],
    ["Destinataire", courrier.destinataire],
    ["Date du document", new Date(courrier.dateDocument).toLocaleDateString("fr-FR")],
    ...(courrier.dateReception ? [["Date de réception", new Date(courrier.dateReception).toLocaleDateString("fr-FR")] as [string, string]] : []),
    ["Créé par", courrier.createdBy.name ?? courrier.createdBy.email],
    ["Créé le", new Date(courrier.createdAt).toLocaleString("fr-FR")],
    ["Verrouillé", courrier.verrouille ? "Oui" : "Non"],
  ]

  doc.setFontSize(10)
  for (const [k, v] of rows) {
    doc.setFont("helvetica", "bold")
    doc.text(k + " :", 20, y)
    doc.setFont("helvetica", "normal")
    doc.text(v, 65, y, { maxWidth: 130 })
    y += 6
    if (y > 260) { doc.addPage(); y = 20 }
  }

  if (courrier.description) {
    y += 4
    doc.setFont("helvetica", "bold")
    doc.text("Description :", 20, y)
    y += 6
    doc.setFont("helvetica", "normal")
    const lines = doc.splitTextToSize(courrier.description, 175)
    doc.text(lines, 20, y)
    y += lines.length * 5
  }

  if (courrier.fichiers.length > 0) {
    y += 6
    doc.setFont("helvetica", "bold")
    doc.text(`Pièces jointes (${courrier.fichiers.length}) :`, 20, y)
    y += 6
    doc.setFont("helvetica", "normal")
    for (const f of courrier.fichiers) {
      doc.text(`• ${f.nom} (${(f.taille / 1024).toFixed(0)} KB)`, 25, y)
      y += 5
      if (y > 270) { doc.addPage(); y = 20 }
    }
  }

  if (courrier.comments.length > 0) {
    y += 6
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFont("helvetica", "bold")
    doc.text(`Commentaires (${courrier.comments.length}) :`, 20, y)
    y += 6
    doc.setFont("helvetica", "normal")
    for (const c of courrier.comments) {
      const head = `${c.author.name} - ${new Date(c.createdAt).toLocaleString("fr-FR")}`
      doc.setFont("helvetica", "italic")
      doc.text(head, 25, y)
      y += 5
      doc.setFont("helvetica", "normal")
      const lines = doc.splitTextToSize(c.contenu, 165)
      doc.text(lines, 25, y)
      y += lines.length * 5 + 3
      if (y > 270) { doc.addPage(); y = 20 }
    }
  }

  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(
    `Document généré le ${new Date().toLocaleString("fr-FR")} par DT Courriers`,
    20, 285
  )

  const buf = Buffer.from(doc.output("arraybuffer"))
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${courrier.numero}.pdf"`,
    },
  })
}
