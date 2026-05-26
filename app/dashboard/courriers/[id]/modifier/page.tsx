import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ModifierForm } from "./modifier-form"

export default async function ModifierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const courrier = await prisma.courrier.findUnique({ where: { id } })
  if (!courrier) notFound()

  return (
    <ModifierForm
      courrier={{
        id: courrier.id,
        objet: courrier.objet,
        statut: courrier.statut,
        priorite: courrier.priorite,
        niveauAcces: courrier.niveauAcces,
        description: courrier.description,
      }}
    />
  )
}
