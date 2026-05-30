"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useDebounce } from "use-debounce"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, ChevronLeft, ChevronRight, Lock, MessageSquare, Loader2, X, Filter, LayoutGrid, List } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  STATUT_LABELS, STATUT_COLORS, TYPE_LABELS,
  PRIORITE_COLORS, PRIORITE_LABELS,
  NIVEAU_ACCES_LABELS, NIVEAU_ACCES_COLORS,
} from "@/lib/constants"
import { CourrierCard } from "@/components/courrier-card"
import { cn } from "@/lib/utils"

interface Fichier {
  id: string
  nom: string
  url: string
  type: string
}

interface Courrier {
  id: string
  numero: string
  objet: string
  type: string
  statut: string
  priorite: string
  niveauAcces: string
  expediteur: string
  dateDocument: string
  verrouille: boolean
  fichiers: Fichier[]
  createdBy: { name: string | null }
  _count: { comments: number }
}

interface User { id: string; name: string | null }

export function CourriersTable({ users, sensFilter }: { users: User[]; sensFilter?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const [q, setQ] = useState(params.get("q") ?? "")
  const [type, setType] = useState(params.get("type") ?? "")
  const [statut, setStatut] = useState(params.get("statut") ?? "")
  const [priorite, setPriorite] = useState(params.get("priorite") ?? "")
  const [niveauAcces, setNiveauAcces] = useState(params.get("niveauAcces") ?? "")
  const [collaborateur, setCollaborateur] = useState(params.get("collaborateur") ?? "")
  const [dateDebut, setDateDebut] = useState(params.get("dateDebut") ?? "")
  const [dateFin, setDateFin] = useState(params.get("dateFin") ?? "")
  const [page, setPage] = useState(parseInt(params.get("page") ?? "1", 10))
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Restaure la préférence de vue depuis localStorage
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("dt-view-mode") : null
    if (saved === "grid" || saved === "table") setViewMode(saved)
  }, [])

  function changeViewMode(mode: "table" | "grid") {
    setViewMode(mode)
    try {
      localStorage.setItem("dt-view-mode", mode)
    } catch {}
  }

  const [debouncedQ] = useDebounce(q, 300)

  const [courriers, setCourriers] = useState<Courrier[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sp = new URLSearchParams()
    if (debouncedQ) sp.set("q", debouncedQ)
    if (type) sp.set("type", type)
    if (statut) sp.set("statut", statut)
    if (priorite) sp.set("priorite", priorite)
    if (niveauAcces) sp.set("niveauAcces", niveauAcces)
    if (collaborateur) sp.set("collaborateur", collaborateur)
    if (dateDebut) sp.set("dateDebut", dateDebut)
    if (dateFin) sp.set("dateFin", dateFin)
    if (sensFilter) sp.set("sens", sensFilter)
    sp.set("page", String(page))

    setLoading(true)
    fetch(`/api/courriers?${sp.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setCourriers(data.courriers)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    startTransition(() => {
      const urlSp = new URLSearchParams(sp)
      urlSp.delete("sens")
      router.replace(`${pathname}?${urlSp.toString()}`, { scroll: false })
    })
  }, [debouncedQ, type, statut, priorite, niveauAcces, collaborateur, dateDebut, dateFin, page, sensFilter, pathname, router])

  function resetFilters() {
    setQ(""); setType(""); setStatut(""); setPriorite(""); setNiveauAcces("")
    setCollaborateur(""); setDateDebut(""); setDateFin(""); setPage(1)
  }

  const hasActiveFilters = type || statut || priorite || niveauAcces || collaborateur || dateDebut || dateFin

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1) }}
              placeholder="Rechercher (objet, expéditeur, numéro...)"
              className="pl-9 pr-9"
            />
            {q && (
              <button
                onClick={() => { setQ(""); setPage(1) }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            Filtres
            {hasActiveFilters && (
              <Badge className="ml-1 h-4 px-1 bg-blue-600 text-white text-[10px]">●</Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5 text-gray-500">
              <X className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          )}
          <span className="text-sm text-gray-500 ml-auto">
            {loading || pending ? (
              <Loader2 className="h-4 w-4 animate-spin inline" />
            ) : (
              <>{total} résultat{total > 1 ? "s" : ""}</>
            )}
          </span>

          {/* Bascule Tableau / Aperçu */}
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-md p-0.5 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => changeViewMode("table")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors",
                viewMode === "table"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              title="Vue tableau"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tableau</span>
            </button>
            <button
              onClick={() => changeViewMode("grid")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors",
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              title="Vue aperçu"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Aperçu</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1) }}
              className="px-2 py-1.5 border rounded text-sm bg-white dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="">Tous les types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select
              value={statut}
              onChange={(e) => { setStatut(e.target.value); setPage(1) }}
              className="px-2 py-1.5 border rounded text-sm bg-white dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select
              value={priorite}
              onChange={(e) => { setPriorite(e.target.value); setPage(1) }}
              className="px-2 py-1.5 border rounded text-sm bg-white dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="">Toutes priorités</option>
              {Object.entries(PRIORITE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select
              value={collaborateur}
              onChange={(e) => { setCollaborateur(e.target.value); setPage(1) }}
              className="px-2 py-1.5 border rounded text-sm bg-white dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="">Tous collaborateurs</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select
              value={niveauAcces}
              onChange={(e) => { setNiveauAcces(e.target.value); setPage(1) }}
              className="px-2 py-1.5 border rounded text-sm bg-white dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="">Tous niveaux d&apos;accès</option>
              {Object.entries(NIVEAU_ACCES_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="col-span-2 md:col-span-2 flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 uppercase">Date début</label>
                <Input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => { setDateDebut(e.target.value); setPage(1) }}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 uppercase">Date fin</label>
                <Input
                  type="date"
                  value={dateFin}
                  onChange={(e) => { setDateFin(e.target.value); setPage(1) }}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === "grid" ? (
          // ───────── Vue Aperçu (grille de cartes avec miniatures) ─────────
          <div>
            {loading && courriers.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : courriers.length === 0 ? (
              <div className="text-center py-20 text-gray-400">Aucun courrier trouvé</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {courriers.map((c) => (
                  <CourrierCard key={c.id} courrier={c} />
                ))}
              </div>
            )}
          </div>
        ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="font-semibold">N° Référence</TableHead>
                <TableHead className="font-semibold">Objet</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Expéditeur</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="font-semibold">Priorité</TableHead>
                <TableHead className="font-semibold">Accès</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-center">Pièces</TableHead>
                <TableHead className="font-semibold text-center">Comm.</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && courriers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : courriers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-gray-400">
                    Aucun courrier trouvé
                  </TableCell>
                </TableRow>
              ) : courriers.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                    <div className="flex items-center gap-1.5">
                      {c.verrouille && <Lock className="h-3 w-3 text-amber-600" />}
                      {c.numero}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate font-medium">{c.objet}</TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">{TYPE_LABELS[c.type]}</TableCell>
                  <TableCell className="text-sm">{c.expediteur}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${STATUT_COLORS[c.statut]}`} variant="outline">
                      {STATUT_LABELS[c.statut]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${PRIORITE_COLORS[c.priorite]}`} variant="outline">
                      {PRIORITE_LABELS[c.priorite]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${NIVEAU_ACCES_COLORS[c.niveauAcces]}`} variant="outline">
                      {NIVEAU_ACCES_LABELS[c.niveauAcces]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(c.dateDocument), "dd/MM/yy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-sm text-center text-gray-500">{c.fichiers.length}</TableCell>
                  <TableCell className="text-sm text-center text-gray-500">
                    {c._count.comments > 0 ? (
                      <span className="inline-flex items-center gap-0.5">
                        <MessageSquare className="h-3 w-3" />
                        {c._count.comments}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/courriers/${c.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1 text-gray-500 hover:text-blue-600">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n = i + 1
                if (totalPages > 5) {
                  if (page > 3) n = page - 2 + i
                  if (page + 2 > totalPages) n = totalPages - 4 + i
                }
                return (
                  <Button
                    key={n}
                    variant={page === n ? "default" : "outline"}
                    size="sm"
                    className="w-9"
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
