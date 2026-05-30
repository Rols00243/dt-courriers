"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2, Sparkles, Download, FileText, TrendingUp,
  AlertTriangle, Users, Building, Inbox,
} from "lucide-react"
import {
  TYPE_LABELS, STATUT_LABELS, STATUT_COLORS,
  PRIORITE_LABELS, PRIORITE_COLORS, SENS_LABELS,
  NIVEAU_ACCES_LABELS, NIVEAU_ACCES_COLORS,
} from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

interface RapportData {
  label: string
  total: number
  parType: { type: string; _count: number }[]
  parStatut: { statut: string; _count: number }[]
  parPriorite: { priorite: string; _count: number }[]
  parSens: { sens: string; _count: number }[]
  parNiveau: { niveauAcces: string; _count: number }[]
  topExpediteurs: { expediteur: string; _count: number }[]
  topDestinataires: { destinataire: string; _count: number }[]
  topCollaborateurs: { nom: string; count: number }[]
  urgents: {
    numero: string; objet: string; priorite: string; statut: string;
    expediteur: string; dateDocument: string;
  }[]
  synthese: string | null
}

export function RapportsClient() {
  const now = new Date()
  const [periode, setPeriode] = useState<"MOIS" | "SEMESTRE" | "ANNEE">("MOIS")
  const [annee, setAnnee] = useState(now.getFullYear())
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [semestre, setSemestre] = useState<1 | 2>(now.getMonth() < 6 ? 1 : 2)
  const [avecIA, setAvecIA] = useState(true)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [data, setData] = useState<RapportData | null>(null)
  const [error, setError] = useState("")

  const anneesDisponibles = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i)

  async function generer() {
    setLoading(true)
    setError("")
    setData(null)
    try {
      const res = await fetch("/api/rapports/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periode, annee, mois, semestre, avecIA }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error ?? "Erreur lors de la génération")
      } else {
        setData(d)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue")
    }
    setLoading(false)
  }

  async function exporter() {
    if (!data) return
    setExporting(true)
    try {
      const res = await fetch("/api/rapports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Erreur export PDF")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Rapport ${data.label}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur export")
    }
    setExporting(false)
  }

  return (
    <>
      {/* Formulaire de génération */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Paramètres du rapport</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Type de période</Label>
              <Select
                value={periode}
                onValueChange={(v) => v && setPeriode(v as "MOIS" | "SEMESTRE" | "ANNEE")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOIS">Mensuel</SelectItem>
                  <SelectItem value="SEMESTRE">Semestriel</SelectItem>
                  <SelectItem value="ANNEE">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Année</Label>
              <Select
                value={String(annee)}
                onValueChange={(v) => v && setAnnee(parseInt(v, 10))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {anneesDisponibles.map((a) => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {periode === "MOIS" && (
              <div>
                <Label>Mois</Label>
                <Select
                  value={String(mois)}
                  onValueChange={(v) => v && setMois(parseInt(v, 10))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MOIS.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {periode === "SEMESTRE" && (
              <div>
                <Label>Semestre</Label>
                <Select
                  value={String(semestre)}
                  onValueChange={(v) => v && setSemestre(parseInt(v, 10) as 1 | 2)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1er semestre (Jan-Juin)</SelectItem>
                    <SelectItem value="2">2e semestre (Juil-Déc)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={avecIA}
                  onChange={(e) => setAvecIA(e.target.checked)}
                  className="rounded"
                />
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                Synthèse IA
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generer}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              {loading ? "Génération..." : "Générer le rapport"}
            </Button>
            {data && (
              <Button
                onClick={exporter}
                disabled={exporting}
                variant="outline"
                className="gap-2"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export PDF
              </Button>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {data && (
        <>
          {/* Header rapport */}
          <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-bold">{data.label}</h2>
                  <p className="text-sm text-gray-500">
                    {data.total} courrier(s) enregistré(s) sur la période
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-amber-600">{data.total}</p>
                  <p className="text-xs text-gray-500">total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Synthèse IA */}
          {data.synthese && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Synthèse rédigée par l&apos;IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{data.synthese}</p>
              </CardContent>
            </Card>
          )}

          {/* 4 grilles : type / statut / priorité / sens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Par type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.parType.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucune donnée</p>
                ) : data.parType.map((t) => {
                  const pct = data.total > 0 ? Math.round((t._count / data.total) * 100) : 0
                  return (
                    <div key={t.type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{TYPE_LABELS[t.type]}</span>
                        <span className="font-medium">{t._count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Par statut</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.parStatut.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucune donnée</p>
                ) : data.parStatut.map((s) => (
                  <div key={s.statut} className="flex items-center justify-between text-sm">
                    <Badge className={STATUT_COLORS[s.statut]} variant="outline">
                      {STATUT_LABELS[s.statut]}
                    </Badge>
                    <span className="font-medium">{s._count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Par priorité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.parPriorite.map((p) => (
                  <div key={p.priorite} className="flex items-center justify-between text-sm">
                    <Badge className={PRIORITE_COLORS[p.priorite]} variant="outline">
                      {PRIORITE_LABELS[p.priorite]}
                    </Badge>
                    <span className="font-medium">{p._count}</span>
                  </div>
                ))}
                {data.parPriorite.length === 0 && <p className="text-sm text-gray-400">Aucune donnée</p>}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Niveau d&apos;accès</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.parNiveau.map((n) => (
                  <div key={n.niveauAcces} className="flex items-center justify-between text-sm">
                    <Badge className={NIVEAU_ACCES_COLORS[n.niveauAcces]} variant="outline">
                      {NIVEAU_ACCES_LABELS[n.niveauAcces]}
                    </Badge>
                    <span className="font-medium">{n._count}</span>
                  </div>
                ))}
                {data.parNiveau.length === 0 && <p className="text-sm text-gray-400">Aucune donnée</p>}
              </CardContent>
            </Card>
          </div>

          {/* Tops */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-emerald-600" />
                  Top expéditeurs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {data.topExpediteurs.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucune donnée</p>
                ) : data.topExpediteurs.map((e, i) => (
                  <div key={e.expediteur} className="flex items-center justify-between text-sm">
                    <span className="truncate">
                      <span className="text-xs text-gray-400 mr-2">#{i + 1}</span>
                      {e.expediteur}
                    </span>
                    <span className="font-medium text-emerald-600">{e._count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="h-4 w-4 text-purple-600" />
                  Top destinataires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {data.topDestinataires.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucune donnée</p>
                ) : data.topDestinataires.map((d, i) => (
                  <div key={d.destinataire} className="flex items-center justify-between text-sm">
                    <span className="truncate">
                      <span className="text-xs text-gray-400 mr-2">#{i + 1}</span>
                      {d.destinataire}
                    </span>
                    <span className="font-medium text-purple-600">{d._count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Top collaborateurs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {data.topCollaborateurs.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucune donnée</p>
                ) : data.topCollaborateurs.map((c, i) => (
                  <div key={c.nom + i} className="flex items-center justify-between text-sm">
                    <span className="truncate">
                      <span className="text-xs text-gray-400 mr-2">#{i + 1}</span>
                      {c.nom}
                    </span>
                    <span className="font-medium text-blue-600">{c.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Liste des urgents */}
          {data.urgents.length > 0 && (
            <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Courriers urgents sur la période ({data.urgents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.urgents.map((u) => (
                  <div key={u.numero} className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-blue-600">{u.numero}</p>
                      <p className="truncate">{u.objet}</p>
                      <p className="text-xs text-gray-400">{u.expediteur} · {format(new Date(u.dateDocument), "dd MMM yyyy", { locale: fr })}</p>
                    </div>
                    <Badge className={`${PRIORITE_COLORS[u.priorite]} ml-3 flex-shrink-0`} variant="outline">
                      {PRIORITE_LABELS[u.priorite]}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  )
}
