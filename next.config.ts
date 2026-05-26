import type { NextConfig } from "next"

// `output: 'standalone'` est UNIQUEMENT requis pour packager dans Electron.
// On l'active via la variable d'env BUILD_TARGET=electron (positionnée dans
// le script `dist:manual`). Sur Vercel et en dev, on garde le build normal.
const isElectronBuild = process.env.BUILD_TARGET === "electron"

const nextConfig: NextConfig = {
  ...(isElectronBuild ? { output: "standalone" as const } : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "3000", pathname: "/**" },
      { protocol: "https", hostname: "**.vercel.app", pathname: "/**" },
    ],
  },
}

export default nextConfig
