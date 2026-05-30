"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useDebounce } from "use-debounce"
import {
  Search, X, Mail, FileText, ArrowRight,
  LayoutDashboard, PlusCircle, Inbox, Send, Archive,
  Bell, BarChart3, History, FileSpreadsheet,
  Users, Activity, Settings, UserCog, AlertTriangle,
  CornerDownLeft,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TYPE_LABELS, STATUT_LABELS, STATUT_COLORS } from "@/lib/constants"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface CourrierResult {
  id: string
  numero: string
  objet: string
  type: string
  statut: string
  expediteur: string
  dateDocument: string
}

interface PageShortcut {
  label: string
  href: string
  icon: typeof Mail
  keywords: string
  adminOnly?: boolean
}

const PAGE_SHORTCUTS: PageShortcut[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, keywords: "accueil home dashboard" },
  { label: "Tous les courriers", href: "/dashboard/courriers", icon: Mail, keywords: "courriers liste" },
  { label: "Nouveau courrier", href: "/dashboard/courriers/nouveau", icon: PlusCircle, keywords: "nouveau créer ajouter" },
  { label: "Courriers entrants", href: "/dashboard/courriers/entrants", icon: Inbox, keywords: "reçus arrivés" },
  { label: "Courriers sortants", href: "/dashboard/courriers/sortants", icon: Send, keywords: "envoyés expédiés" },
  { label: "Archives", href: "/dashboard/archives", icon: Archive, keywords: "archivés ancien" },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, keywords: "alertes messages" },
  { label: "Statistiques", href: "/dashboard/statistiques", icon: BarChart3, keywords: "stats graphiques chiffres" },
  { label: "Rapports périodiques", href: "/dashboard/rapports", icon: FileSpreadsheet, keywords: "rapport mensuel semestriel annuel synthèse" },
  { label: "Historique", href: "/dashboard/historique", icon: History, keywords: "logs audit traçabilité" },
  { label: "Mon profil", href: "/dashboard/profil", icon: UserCog, keywords: "compte mot de passe" },
  { label: "Utilisateurs", href: "/dashboard/utilisateurs", icon: Users, keywords: "comptes gestion", adminOnly: true },
  { label: "Connexions", href: "/dashboard/connexions", icon: Activity, keywords: "logs login traçabilité", adminOnly: true },
  { label: "Paramètres", href: "/dashboard/parametres", icon: Settings, keywords: "config réglages", adminOnly: true },
]

/**
 * Palette de commandes globale.
 * Raccourci Ctrl+K (Windows/Linux) ou Cmd+K (macOS) pour ouvrir.
 * Recherche dans les courriers + accès rapide aux pages.
 * Navigation au clavier (flèches haut/bas + Entrée).
 */
export function CommandPalette({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CourrierResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [debouncedQuery] = useDebounce(query, 200)

  // Raccourci clavier Ctrl+K / Cmd+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsOpen((v) => !v)
      } else if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Focus l'input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setResults([])
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Recherche courriers
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((d) => {
        setResults(d.courriers ?? [])
        setActiveIndex(0)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  // Filtre les pages selon la recherche
  const pages = PAGE_SHORTCUTS.filter((p) => {
    if (p.adminOnly && !isAdmin) return false
    if (!query) return true
    const q = query.toLowerCase()
    return p.label.toLowerCase().includes(q) || p.keywords.toLowerCase().includes(q)
  })

  // Liste plate des éléments pour navigation clavier
  const items: ({ kind: "page" } & PageShortcut | { kind: "courrier" } & CourrierResult)[] = [
    ...pages.map((p) => ({ kind: "page" as const, ...p })),
    ...results.map((c) => ({ kind: "courrier" as const, ...c })),
  ]

  function handleSelect(idx: number) {
    const item = items[idx]
    if (!item) return
    setIsOpen(false)
    if (item.kind === "page") {
      router.push(item.href)
    } else {
      router.push(`/dashboard/courriers/${item.id}`)
    }
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      handleSelect(activeIndex)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 bg-black/50 animate-in fade-in duration-150"
         onClick={() => setIsOpen(false)}>
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Rechercher un courrier ou naviguer..."
            className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
            autoComplete="off"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-gray-100 dark:bg-gray-800 rounded">
            Esc
          </kbd>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Résultats */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Pages */}
          {pages.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                Pages
              </p>
              {pages.map((p, i) => {
                const idx = i
                const active = activeIndex === idx
                return (
                  <button
                    key={p.href}
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                      active
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <p.icon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                    <span className="flex-1">{p.label}</span>
                    {active && <CornerDownLeft className="h-3 w-3 text-gray-400" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Courriers */}
          {query.length >= 2 && (
            <div className="py-2 border-t border-gray-100 dark:border-gray-800">
              <p className="px-4 py-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center justify-between">
                <span>Courriers</span>
                {loading && <span className="text-gray-300 normal-case">recherche…</span>}
              </p>
              {results.length === 0 && !loading && (
                <p className="px-4 py-3 text-sm text-gray-400 text-center">
                  Aucun courrier ne correspond à « {query} »
                </p>
              )}
              {results.map((c, i) => {
                const idx = pages.length + i
                const active = activeIndex === idx
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-start gap-3 px-4 py-2 text-sm text-left transition-colors ${
                      active
                        ? "bg-blue-50 dark:bg-blue-950/40"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <FileText className="h-4 w-4 flex-shrink-0 text-blue-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400">
                          {c.numero}
                        </span>
                        <Badge className={`text-[9px] ${STATUT_COLORS[c.statut]}`} variant="outline">
                          {STATUT_LABELS[c.statut]}
                        </Badge>
                      </div>
                      <p className="truncate">{c.objet}</p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {TYPE_LABELS[c.type]} · {c.expediteur} · {format(new Date(c.dateDocument), "dd MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    {active && <ArrowRight className="h-3 w-3 text-gray-400 mt-1.5 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}

          {query.length === 0 && pages.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                <AlertTriangle className="h-3 w-3" />
                Tapez 2 caractères ou plus pour chercher dans les courriers
              </p>
            </div>
          )}
        </div>

        {/* Footer avec raccourcis */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded">↓</kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
              ouvrir
            </span>
          </div>
          <span className="hidden sm:block">DT Courriers</span>
        </div>
      </div>
    </div>
  )
}
