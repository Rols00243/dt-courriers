import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { canManageUsers } from "@/lib/permissions"
import { logAction } from "@/lib/audit"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, peutGererUtilisateurs: true },
  })

  if (!canManageUsers(session, me ?? undefined)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, email: true, role: true,
      niveauAcces: true, peutGererUtilisateurs: true,
      actif: true, createdAt: true,
      _count: { select: { courriers: true } },
    },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, peutGererUtilisateurs: true },
  })

  if (!canManageUsers(session, me ?? undefined)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { name, email, password, role, niveauAcces, peutGererUtilisateurs } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nom, email et mot de passe requis" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 6 caractères" }, { status: 400 })
  }

  // Un non-ADMIN ne peut pas créer un ADMIN
  if (role === "ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Seul un administrateur peut créer un autre administrateur" }, { status: 403 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: role ?? "AGENT",
      niveauAcces: niveauAcces ?? "INTERNE",
      peutGererUtilisateurs: peutGererUtilisateurs ?? false,
    },
    select: { id: true, name: true, email: true, role: true, niveauAcces: true },
  })

  await logAction({
    userId: session.user.id,
    action: "CREATE_USER",
    details: `Création de l'utilisateur ${user.email} (${user.role})`,
  })

  return NextResponse.json(user, { status: 201 })
}
