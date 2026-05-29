"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export function ProfilForm({ initialName }: { initialName: string }) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Si l'utilisateur veut changer son mot de passe, valider la confirmation
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setError("La confirmation ne correspond pas au nouveau mot de passe")
        return
      }
      if (newPassword.length < 8) {
        setError("Le nouveau mot de passe doit faire au moins 8 caractères")
        return
      }
      if (!currentPassword) {
        setError("Le mot de passe actuel est requis pour le changer")
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la mise à jour")
      } else {
        setSuccess(
          data.changes?.length
            ? `Profil mis à jour : ${data.changes.join(", ")}`
            : "Aucune modification"
        )
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        router.refresh()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue")
    }
    setLoading(false)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nom affiché</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre nom"
        />
      </div>

      <Separator />

      <div>
        <p className="text-sm font-medium mb-3">Changer mon mot de passe</p>
        <p className="text-xs text-gray-500 mb-3">
          Laissez vide si vous ne souhaitez pas changer votre mot de passe.
        </p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmer</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le nouveau"
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <Button type="submit" disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {loading ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  )
}
