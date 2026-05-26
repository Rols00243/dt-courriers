"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"

interface CourrierData {
  id: string
  objet: string
  statut: string
  priorite: string
  niveauAcces: string
  description: string | null
}

export function ModifierForm({ courrier }: { courrier: CourrierData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    objet: courrier.objet,
    statut: courrier.statut,
    priorite: courrier.priorite,
    niveauAcces: courrier.niveauAcces,
    description: courrier.description ?? "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch(`/api/courriers/${courrier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    router.push(`/dashboard/courriers/${courrier.id}`)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/courriers/${courrier.id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Modifier le courrier</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Modifier les informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Objet *</Label>
              <Input
                value={form.objet}
                onChange={(e) => setForm({ ...form, objet: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statut</Label>
                <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v ?? "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                    <SelectItem value="EN_COURS">En cours</SelectItem>
                    <SelectItem value="TRAITE">Traité</SelectItem>
                    <SelectItem value="ARCHIVE">Archivé</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priorité</Label>
                <Select value={form.priorite} onValueChange={(v) => setForm({ ...form, priorite: v ?? "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASSE">Basse</SelectItem>
                    <SelectItem value="NORMALE">Normale</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                    <SelectItem value="TRES_URGENTE">Très urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Niveau d&apos;accès (confidentialité)</Label>
              <Select value={form.niveauAcces} onValueChange={(v) => setForm({ ...form, niveauAcces: v ?? "INTERNE" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">🟢 Public</SelectItem>
                  <SelectItem value="INTERNE">🔵 Interne</SelectItem>
                  <SelectItem value="CONFIDENTIEL">🟠 Confidentiel</SelectItem>
                  <SelectItem value="SECRET">🔴 Secret</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 gap-2" disabled={loading}>
            <Save className="h-4 w-4" />
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
          <Link href={`/dashboard/courriers/${courrier.id}`}>
            <Button type="button" variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
