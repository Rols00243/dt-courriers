"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, CheckCircle2, Sparkles } from "lucide-react"
import Link from "next/link"
import { FileDropzone, type DroppedFile, type AnalysisResult } from "@/components/file-dropzone"

const DRAFT_KEY = "dt-courriers-draft"

const emptyForm = {
  objet: "",
  type: "",
  sens: "",
  statut: "EN_ATTENTE",
  priorite: "NORMALE",
  niveauAcces: "INTERNE",
  expediteur: "",
  destinataire: "",
  dateDocument: "",
  dateReception: "",
  description: "",
}

export default function NouveauCourrierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<DroppedFile[]>([])
  const [error, setError] = useState("")
  const [form, setForm] = useState(emptyForm)
  const [draftSaved, setDraftSaved] = useState(false)
  const [analysisNote, setAnalysisNote] = useState<string | null>(null)

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setForm({ ...emptyForm, ...parsed })
      }
    } catch {}
  }, [])

  // Auto-save draft to localStorage
  useEffect(() => {
    const id = setTimeout(() => {
      const hasContent = Object.values(form).some((v) => v && v !== "EN_ATTENTE" && v !== "NORMALE")
      if (hasContent) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
        setDraftSaved(true)
        setTimeout(() => setDraftSaved(false), 2000)
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [form])

  function handleChange(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }))
  }

  function handleAnalysis(result: AnalysisResult) {
    setForm((prev) => ({
      ...prev,
      objet: result.objet ?? prev.objet,
      type: result.type ?? prev.type,
      sens: result.sens ?? prev.sens,
      priorite: result.priorite ?? prev.priorite,
      niveauAcces: (result as { niveauAcces?: string }).niveauAcces ?? prev.niveauAcces,
      expediteur: result.expediteur ?? prev.expediteur,
      destinataire: result.destinataire ?? prev.destinataire,
      dateDocument: result.dateDocument ?? prev.dateDocument,
      description: result.description ?? prev.description,
    }))
    const pct = Math.round((result.confiance ?? 0) * 100)
    setAnalysisNote(
      `Champs pré-remplis automatiquement (confiance ${pct}%). Vérifiez et ajustez avant d'enregistrer.`
    )
    setTimeout(() => setAnalysisNote(null), 8000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/courriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Erreur lors de la création")
      }

      const courrier = await res.json()

      for (const item of files) {
        const fd = new FormData()
        fd.append("file", item.file)
        fd.append("courrierId", courrier.id)
        if (item.ocrTexte) fd.append("ocrTexte", item.ocrTexte)
        await fetch("/api/upload", { method: "POST", body: fd })
      }

      localStorage.removeItem(DRAFT_KEY)
      router.push(`/dashboard/courriers/${courrier.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      setLoading(false)
    }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY)
    setForm(emptyForm)
    setFiles([])
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/courriers">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Nouveau courrier</h1>
            <p className="text-gray-500 text-sm">Enregistrer un nouveau courrier</p>
          </div>
        </div>
        {draftSaved && (
          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Brouillon sauvegardé
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Objet *</Label>
              <Input
                placeholder="Objet du courrier"
                value={form.objet}
                onChange={(e) => handleChange("objet", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de document *</Label>
                <Select value={form.type} onValueChange={(v) => handleChange("type", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COURRIER_ENTRANT">Courrier entrant</SelectItem>
                    <SelectItem value="COURRIER_SORTANT">Courrier sortant</SelectItem>
                    <SelectItem value="COURRIER_INTERNE">Courrier interne</SelectItem>
                    <SelectItem value="PV_COMMISSION">PV de commission</SelectItem>
                    <SelectItem value="ORDRE_MISSION">Ordre de mission</SelectItem>
                    <SelectItem value="RAPPORT_SEMESTRIEL">Rapport semestriel</SelectItem>
                    <SelectItem value="RAPPORT_ANNUEL">Rapport annuel</SelectItem>
                    <SelectItem value="DOCUMENT_OFFICIEL">Document officiel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sens *</Label>
                <Select value={form.sens} onValueChange={(v) => handleChange("sens", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRANT">Entrant</SelectItem>
                    <SelectItem value="SORTANT">Sortant</SelectItem>
                    <SelectItem value="INTERNE">Interne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statut</Label>
                <Select value={form.statut} onValueChange={(v) => handleChange("statut", v)}>
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
                <Select value={form.priorite} onValueChange={(v) => handleChange("priorite", v)}>
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
              <Select value={form.niveauAcces} onValueChange={(v) => handleChange("niveauAcces", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">🟢 Public — accessible à tous</SelectItem>
                  <SelectItem value="INTERNE">🔵 Interne — personnel de l&apos;organisation</SelectItem>
                  <SelectItem value="CONFIDENTIEL">🟠 Confidentiel — accès restreint</SelectItem>
                  <SelectItem value="SECRET">🔴 Secret — admin uniquement</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Seuls les utilisateurs avec un niveau ≥ verront ce courrier dans leur liste.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Expéditeur / Destinataire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expéditeur *</Label>
                <Input
                  placeholder="Nom de l'expéditeur"
                  value={form.expediteur}
                  onChange={(e) => handleChange("expediteur", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Destinataire *</Label>
                <Input
                  placeholder="Nom du destinataire"
                  value={form.destinataire}
                  onChange={(e) => handleChange("destinataire", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date du document *</Label>
                <Input
                  type="date"
                  value={form.dateDocument}
                  onChange={(e) => handleChange("dateDocument", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Date de réception</Label>
                <Input
                  type="date"
                  value={form.dateReception}
                  onChange={(e) => handleChange("dateReception", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Description / Notes</Label>
              <Textarea
                placeholder="Description ou notes supplémentaires..."
                rows={3}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                Pièces jointes
                <span className="inline-flex items-center gap-1 text-xs font-normal bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3" />
                  Analyse IA disponible
                </span>
              </span>
              <span className="text-xs font-normal text-gray-500">
                Compression auto · OCR · Claude
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisNote && (
              <div className="mb-3 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4 flex-shrink-0" />
                {analysisNote}
              </div>
            )}
            <FileDropzone
              files={files}
              onChange={setFiles}
              onOcrText={(text) => {
                if (!form.objet) handleChange("objet", text)
              }}
              onAnalysis={handleAnalysis}
            />
            <p className="text-xs text-gray-500 mt-3">
              💡 Après avoir uploadé un PDF ou une image scannée, cliquez sur{" "}
              <span className="font-medium text-purple-600 dark:text-purple-400">Analyser</span>{" "}
              pour laisser l&apos;IA extraire automatiquement l&apos;objet, le type, l&apos;expéditeur,
              la date et tous les autres champs.
            </p>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pb-6">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 gap-2" disabled={loading}>
            <Save className="h-4 w-4" />
            {loading ? "Enregistrement..." : "Enregistrer le courrier"}
          </Button>
          <Button type="button" variant="outline" onClick={clearDraft}>
            Effacer le brouillon
          </Button>
          <Link href="/dashboard/courriers">
            <Button type="button" variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
