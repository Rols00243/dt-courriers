"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Archive, Sparkles, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { FileDropzone, type DroppedFile, type AnalysisResult } from "@/components/file-dropzone"

const DRAFT_KEY = "dt-courriers-archive-draft"

const emptyForm = {
  objet: "",
  type: "",
  sens: "",
  statut: "ARCHIVE",
  priorite: "NORMALE",
  expediteur: "",
  destinataire: "",
  dateDocument: "",
  dateReception: "",
  description: "",
}

export default function NouvelleArchivePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<DroppedFile[]>([])
  const [error, setError] = useState("")
  const [form, setForm] = useState(emptyForm)
  const [draftSaved, setDraftSaved] = useState(false)
  const [analysisNote, setAnalysisNote] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) setForm({ ...emptyForm, ...JSON.parse(saved) })
    } catch {}
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      const hasContent = Object.values(form).some(
        (v) => v && v !== "ARCHIVE" && v !== "NORMALE"
      )
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
      expediteur: result.expediteur ?? prev.expediteur,
      destinataire: result.destinataire ?? prev.destinataire,
      dateDocument: result.dateDocument ?? prev.dateDocument,
      description: result.description ?? prev.description,
    }))
    const pct = Math.round((result.confiance ?? 0) * 100)
    setAnalysisNote(
      `Champs pré-remplis automatiquement (confiance ${pct}%). Vérifiez et ajustez avant d'archiver.`
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
        body: JSON.stringify({ ...form, statut: "ARCHIVE" }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Erreur lors de l'archivage")
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

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/archives">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Archive className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              Archiver un document externe
            </h1>
            <p className="text-gray-500 text-sm">
              Documents anciens, scans, archives à intégrer directement
            </p>
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
        <Card className="border-0 shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                Document à archiver
                <span className="inline-flex items-center gap-1 text-xs font-normal bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3" />
                  Analyse IA recommandée
                </span>
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
              💡 Téléversez le document puis cliquez sur{" "}
              <span className="font-medium text-purple-600 dark:text-purple-400">
                Analyser
              </span>{" "}
              — l&apos;IA remplira automatiquement tous les champs ci-dessous.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informations du document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Objet *</Label>
              <Input
                value={form.objet}
                onChange={(e) => handleChange("objet", e.target.value)}
                placeholder="Objet du document"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de document *</Label>
                <Select value={form.type} onValueChange={(v) => handleChange("type", v)} required>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
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
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
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
                <Label>Expéditeur *</Label>
                <Input
                  value={form.expediteur}
                  onChange={(e) => handleChange("expediteur", e.target.value)}
                  placeholder="Nom de l'expéditeur"
                  required
                />
              </div>
              <div>
                <Label>Destinataire *</Label>
                <Input
                  value={form.destinataire}
                  onChange={(e) => handleChange("destinataire", e.target.value)}
                  placeholder="Nom du destinataire"
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
              <Label>Description / Notes</Label>
              <Textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                placeholder="Description ou notes complémentaires..."
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pb-6">
          <Button
            type="submit"
            className="bg-gray-700 hover:bg-gray-800 gap-2"
            disabled={loading}
          >
            <Archive className="h-4 w-4" />
            {loading ? "Archivage..." : "Archiver le document"}
          </Button>
          <Link href="/dashboard/archives">
            <Button type="button" variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
