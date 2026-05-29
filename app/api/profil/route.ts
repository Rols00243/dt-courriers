import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

/**
 * PATCH /api/profil — l'utilisateur connecté modifie son propre profil :
 * - changement de nom
 * - changement de mot de passe (avec vérification de l'ancien)
 *
 * Aucun changement de rôle/niveau ici : ces champs sont admin-only.
 */
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const { name, currentPassword, newPassword } = body

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, password: true },
  })
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}
  const changes: string[] = []

  // Changement de nom
  if (typeof name === "string" && name.trim() && name.trim() !== user.name) {
    updates.name = name.trim()
    changes.push("nom")
  }

  // Changement de mot de passe : exige l'ancien
  if (newPassword) {
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit faire au moins 8 caractères" },
        { status: 400 }
      )
    }
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Le mot de passe actuel est requis" },
        { status: 400 }
      )
    }
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 403 }
      )
    }
    updates.password = await bcrypt.hash(newPassword, 10)
    changes.push("mot de passe")
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "Aucune modification" })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updates,
  })

  await logAction({
    userId: user.id,
    action: "UPDATE_PROFIL",
    details: `Profil modifié : ${changes.join(", ")}`,
  })

  return NextResponse.json({ success: true, changes })
}
