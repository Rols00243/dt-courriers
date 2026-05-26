/**
 * Package l'application en dossier Windows portable avec @electron/packager.
 * Contournement du problème de symlinks de electron-builder.
 *
 * Produit : dist/DT Courriers-win32-x64/
 * À l'intérieur : DT Courriers.exe (à double-cliquer)
 */
const packager = require("@electron/packager").packager
const path = require("path")
const fs = require("fs/promises")
const fsSync = require("fs")

const ROOT = path.join(__dirname, "..")
const OUT_DIR = path.join(ROOT, "dist")
const APP_NAME = "DT Courriers"

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

async function main() {
  console.log("📦 Packaging DT Courriers pour Windows x64...\n")

  // Vérifications préalables
  const standaloneDir = path.join(ROOT, ".next", "standalone")
  if (!fsSync.existsSync(standaloneDir)) {
    console.error("❌ .next/standalone manquant. Lancez d'abord : npm run build")
    process.exit(1)
  }

  if (!fsSync.existsSync(path.join(ROOT, "dist-electron", "main.js"))) {
    console.error("❌ dist-electron/main.js manquant. Lancez d'abord : npm run electron:compile")
    process.exit(1)
  }

  // Nettoyer dist
  await fs.rm(OUT_DIR, { recursive: true, force: true })

  // Packager Electron
  const appPaths = await packager({
    dir: ROOT,
    out: OUT_DIR,
    name: APP_NAME,
    platform: "win32",
    arch: "x64",
    overwrite: true,
    icon: path.join(ROOT, "build", "icon.ico"),
    asar: true,
    appCopyright: "Copyright © 2026 DT Courriers",
    appVersion: require("../package.json").version,
    // Ignore everything except what we explicitly need
    ignore: [
      /^\/\.git/,
      /^\/\.next\/(?!standalone|static)/,
      /^\/dist($|\/)/,
      /^\/src/,
      /^\/electron($|\/)/,
      /^\/scripts/,
      /^\/build($|\/)/,
      /^\/public\/(?!uploads)/,
      /^\/\.env\.local$/,
      /^\/\.env\.example/,
      /\.map$/,
    ],
  })

  const appOut = appPaths[0]
  console.log(`\n✅ App packagée dans : ${appOut}\n`)

  // Copier le standalone server + assets dans resources/app/
  const resourcesAppDir = path.join(appOut, "resources", "app")

  // Le standalone server.js
  console.log("📂 Copie de .next/standalone → resources/app/")
  await copyDir(path.join(ROOT, ".next", "standalone"), resourcesAppDir)

  // Les static assets
  console.log("📂 Copie de .next/static → resources/app/.next/static/")
  await copyDir(
    path.join(ROOT, ".next", "static"),
    path.join(resourcesAppDir, ".next", "static")
  )

  // Le public/ pour les uploads + assets statiques
  console.log("📂 Copie de public/ → resources/app/public/")
  await copyDir(path.join(ROOT, "public"), path.join(resourcesAppDir, "public"))

  // .env (pour DATABASE_URL, OPENAI_API_KEY, etc.)
  console.log("📂 Copie de .env → resources/app/.env")
  await fs.copyFile(path.join(ROOT, ".env"), path.join(resourcesAppDir, ".env"))

  // icon.png à la racine de resources (utilisé par main.ts)
  console.log("📂 Copie de l'icône → resources/icon.png")
  await fs.copyFile(
    path.join(ROOT, "build", "icon.png"),
    path.join(appOut, "resources", "icon.png")
  )

  console.log("\n✅ Build complet !")
  console.log(`\n📁 Dossier de l'app : ${appOut}`)
  console.log(`▶️  Exécutable : ${path.join(appOut, APP_NAME + ".exe")}`)
  console.log(`\n💡 Pour distribuer : zippez tout le dossier "${path.basename(appOut)}"`)
}

main().catch((e) => {
  console.error("❌ Packaging error:", e)
  process.exit(1)
})
