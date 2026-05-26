import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Settings, Database, Shield, Palette, FileText } from "lucide-react"

export default async function ParametresPage() {
  const session = await auth()
  if (session?.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
          <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-gray-500 text-sm">Configuration de l&apos;application</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Application
            </CardTitle>
            <CardDescription className="text-xs">
              Information sur l&apos;application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nom</span>
              <span className="font-medium">DT Courriers</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Framework</span>
              <span className="font-medium">Next.js 16</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              Base de données
            </CardTitle>
            <CardDescription className="text-xs">
              Connexion à PostgreSQL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="font-medium">PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Base</span>
              <span className="font-medium font-mono text-xs">dt_courriers</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Statut</span>
              <span className="font-medium text-green-600">● Connecté</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-600" />
              Sécurité
            </CardTitle>
            <CardDescription className="text-xs">
              Authentification et permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Auth</span>
              <span className="font-medium">JWT (NextAuth)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Hash</span>
              <span className="font-medium">bcrypt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Rôles</span>
              <span className="font-medium">ADMIN, GESTIONNAIRE, AGENT</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-600" />
              Apparence
            </CardTitle>
            <CardDescription className="text-xs">
              Thème et préférences visuelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-gray-500">
              Utilisez le sélecteur de thème en haut à droite pour basculer entre clair et sombre.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
