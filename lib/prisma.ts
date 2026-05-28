import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaPg } from "@prisma/adapter-pg"
import { neonConfig } from "@neondatabase/serverless"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Choisit le bon adapter Prisma selon le contexte :
 *
 * - Vercel / serverless (NEON URL avec sslmode=require) :
 *   utilise @prisma/adapter-neon. Le driver Neon parle HTTP/WebSocket et est
 *   conçu pour les Function instances éphémères (cold starts plus rapides,
 *   pas de pool TCP à établir).
 *
 * - Local / Electron desktop (PostgreSQL local OU connexion long-lived) :
 *   utilise @prisma/adapter-pg avec le pool TCP classique.
 *
 * Le choix se fait sur l'URL : si elle contient ".neon." ou
 * "neon.tech", on utilise le driver Neon.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL!
  const isNeon = /\.neon\.(tech|aws\.neon\.tech)/.test(url) || url.includes("neon.tech")

  if (isNeon) {
    // Sur Node.js (Electron desktop), neon a besoin d'un WebSocket polyfill.
    // Sur Vercel Edge/Node serverless, c'est déjà natif.
    if (typeof WebSocket === "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ws = require("ws")
      neonConfig.webSocketConstructor = ws
    }
    const adapter = new PrismaNeon({ connectionString: url })
    return new PrismaClient({ adapter })
  }

  const adapter = new PrismaPg({ connectionString: url })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
