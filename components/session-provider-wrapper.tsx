"use client"

import { SessionProvider } from "next-auth/react"
import type { ComponentProps } from "react"

/**
 * Wrapper SessionProvider avec config performance :
 * - refetchInterval: 0 → on n'auto-refetch pas la session toutes les X secondes
 *   (le JWT est valable plusieurs jours, pas besoin de la rafraîchir constamment)
 * - refetchOnWindowFocus: false → pas de fetch à chaque clic sur l'onglet
 *
 * Avant : un appel /api/auth/session à chaque focus + toutes les minutes.
 * Après : un seul appel au montage, puis silence.
 */
export function AppSessionProvider({
  children,
  ...props
}: ComponentProps<typeof SessionProvider>) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      {...props}
    >
      {children}
    </SessionProvider>
  )
}
