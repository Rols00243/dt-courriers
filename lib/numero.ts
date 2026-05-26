import { prisma } from "@/lib/prisma"

const PREFIXES: Record<string, string> = {
  COURRIER_ENTRANT: "CE",
  COURRIER_SORTANT: "CS",
  COURRIER_INTERNE: "CI",
  PV_COMMISSION: "PV",
  ORDRE_MISSION: "OM",
  RAPPORT_SEMESTRIEL: "RS",
  RAPPORT_ANNUEL: "RA",
  DOCUMENT_OFFICIEL: "DO",
}

export async function genererNumero(type: string): Promise<string> {
  const prefix = PREFIXES[type] ?? "XX"
  const year = new Date().getFullYear()
  const count = await prisma.courrier.count({
    where: {
      type: type as never,
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  })
  const seq = String(count + 1).padStart(4, "0")
  return `${prefix}-${year}-${seq}`
}
