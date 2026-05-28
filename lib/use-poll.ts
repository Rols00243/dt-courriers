"use client"

import { useEffect, useRef } from "react"

/**
 * Hook de polling intelligent :
 * - Lance load() une fois au montage
 * - Re-load toutes les `intervalMs` millisecondes
 * - Pause automatiquement quand l'onglet est masqué (visibility: hidden)
 * - Reprend immédiatement quand l'onglet redevient visible
 *
 * Réduit la pression sur le serveur quand l'utilisateur ne regarde pas la page
 * et évite les requêtes inutiles en arrière-plan.
 */
export function usePoll(load: () => void, intervalMs: number) {
  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    // Charge tout de suite
    loadRef.current()

    let timer: ReturnType<typeof setInterval> | null = null

    function start() {
      if (timer) return
      timer = setInterval(() => loadRef.current(), intervalMs)
    }
    function stop() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        loadRef.current()
        start()
      } else {
        stop()
      }
    }

    start()
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [intervalMs])
}
