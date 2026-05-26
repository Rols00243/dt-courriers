import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST() {
  const existing = await prisma.user.findUnique({ where: { email: "admin@dt-courriers.com" } })
  if (existing) {
    return NextResponse.json({ message: "Données déjà initialisées" })
  }

  const adminPass = await bcrypt.hash("Admin@2024!", 10)
  const agentPass = await bcrypt.hash("Agent@2024!", 10)

  await prisma.user.createMany({
    data: [
      { name: "Administrateur", email: "admin@dt-courriers.com", password: adminPass, role: "ADMIN" },
      { name: "Gestionnaire", email: "gestionnaire@dt-courriers.com", password: agentPass, role: "GESTIONNAIRE" },
      { name: "Agent Test", email: "agent@dt-courriers.com", password: agentPass, role: "AGENT" },
    ],
  })

  return NextResponse.json({
    message: "Données initialisées avec succès",
    comptes: [
      { email: "admin@dt-courriers.com", password: "Admin@2024!", role: "ADMIN" },
      { email: "gestionnaire@dt-courriers.com", password: "Agent@2024!", role: "GESTIONNAIRE" },
      { email: "agent@dt-courriers.com", password: "Agent@2024!", role: "AGENT" },
    ],
  })
}
