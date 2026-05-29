import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { AppSessionProvider } from "@/components/session-provider-wrapper"
import { ThemeProvider } from "@/components/theme-provider"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

export const metadata: Metadata = {
  title: "DT Courriers",
  description: "Système de suivi et archivage des courriers",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DT Courriers",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppSessionProvider>{children}</AppSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
