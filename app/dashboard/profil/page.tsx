import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User as UserIcon, Mail, Shield, Lock } from "lucide-react"
import { ROLE_LABELS, NIVEAU_ACCES_LABELS, NIVEAU_ACCES_COLORS } from "@/lib/constants"
import { ProfilForm } from "./profil-form"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  GESTIONNAIRE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  AGENT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

export default async function ProfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, role: true,
      niveauAcces: true, peutGererUtilisateurs: true,
      createdAt: true,
      _count: { select: { courriers: true } },
    },
  })
  if (!user) redirect("/login")

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
          <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Mon profil</h1>
          <p className="text-gray-500 text-sm">Gérer mes informations personnelles</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Email</p>
              <p className="font-medium mt-0.5">{user.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Rôle</p>
              <Badge className={`${ROLE_COLORS[user.role]} mt-1`} variant="outline">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">Niveau d&apos;accès</p>
            <Badge className={`${NIVEAU_ACCES_COLORS[user.niveauAcces]} mt-1`} variant="outline">
              {NIVEAU_ACCES_LABELS[user.niveauAcces]}
            </Badge>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">Gestion utilisateurs</p>
            <p className="font-medium mt-1">
              {user.role === "ADMIN" || user.peutGererUtilisateurs ? "✅ Autorisé" : "❌ Non"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">Courriers créés</p>
            <p className="font-medium mt-1">{user._count.courriers}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">Compte créé le</p>
            <p className="font-medium mt-1">
              {format(new Date(user.createdAt), "dd MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600" />
            Modifier mes informations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfilForm initialName={user.name ?? ""} />
        </CardContent>
      </Card>
    </div>
  )
}
