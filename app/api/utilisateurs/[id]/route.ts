import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { canManageUsers } from "@/lib/permissions"
import { logAction } from "@/lib/audit"
import bcrypt from "bcryptjs"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true,
      niveauAcces: true, peutGererUtilisateurs: true,
      actif: true, createdAt: true,
    },
  })
  if (!user) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, peutGererUtilisateurs: true },
  })

  if (!canManageUsers(session, me ?? undefined)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  const changes: string[] = []

  if (body.name !== undefined && body.name !== existing.name) {
    updates.name = body.name
    changes.push(`Nom modifié`)
  }

  if (body.email !== undefined && body.email !== existing.email) {
    const dup = await prisma.user.findUnique({ where: { email: body.email } })
    if (dup && dup.id !== id) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 })
    }
    updates.email = body.email
    changes.push(`Email: ${existing.email} → ${body.email}`)
  }

  if (body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 6 caractères" }, { status: 400 })
    }
    updates.password = await bcrypt.hash(body.password, 10)
    changes.push(`Mot de passe réinitialisé`)
  }

  if (body.role !== undefined && body.role !== existing.role) {
    if (body.role === "ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Seul un admin peut promouvoir un autre admin" }, { status: 403 })
    }
    if (existing.role === "ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Seul un admin peut modifier un admin" }, { status: 403 })
    }
    updates.role = body.role
    changes.push(`Rôle: ${existing.role} → ${body.role}`)
  }

  if (body.niveauAcces !== undefined && body.niveauAcces !== existing.niveauAcces) {
    updates.niveauAcces = body.niveauAcces
    changes.push(`Niveau d'accès: ${existing.niveauAcces} → ${body.niveauAcces}`)
  }

  if (body.peutGererUtilisateurs !== undefined && body.peutGererUtilisateurs !== existing.peutGererUtilisateurs) {
    // Seul un ADMIN peut déléguer ce droit
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Seul un admin peut déléguer cette permission" }, { status: 403 })
    }
    updates.peutGererUtilisateurs = body.peutGererUtilisateurs
    changes.push(body.peutGererUtilisateurs ? "Délégation de gestion activée" : "Délégation de gestion retirée")
  }

  if (body.actif !== undefined && body.actif !== existing.actif) {
    updates.actif = body.actif
    changes.push(body.actif ? "Compte réactivé" : "Compte désactivé")
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(existing)
  }

  const user = await prisma.user.update({
    where: { id },
    data: updates,
    select: {
      id: true, name: true, email: true, role: true,
      niveauAcces: true, peutGererUtilisateurs: true, actif: true,
    },
  })

  await logAction({
    userId: session.user.id,
    action: "UPDATE_USER",
    details: `${existing.email}: ${changes.join(" | ")}`,
  })

  return NextResponse.json(user)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, peutGererUtilisateurs: true },
  })

  if (!canManageUsers(session, me ?? undefined)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })

  if (target.role === "ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Seul un admin peut supprimer un admin" }, { status: 403 })
  }

  // Compte des courriers — on bloque la suppression si l'utilisateur a créé des courriers
  const count = await prisma.courrier.count({ where: { createdById: id } })
  if (count > 0) {
    return NextResponse.json(
      {
        error: `Impossible de supprimer : ${count} courrier(s) lié(s). Désactivez le compte plutôt qu'une suppression.`,
      },
      { status: 400 }
    )
  }

  await prisma.user.delete({ where: { id } })

  await logAction({
    userId: session.user.id,
    action: "DELETE_USER",
    details: `Suppression de ${target.email}`,
  })

  return NextResponse.json({ success: true })
}
