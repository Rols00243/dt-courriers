/**
 * Génère les icônes Windows (.ico) et PNG depuis le SVG source.
 * Usage : npm run icons (ou node scripts/generate-icons.js)
 *
 * Requiert : sharp + to-ico (installés à la demande si manquants)
 */
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const BUILD_DIR = path.join(__dirname, "..", "build")
const SVG_PATH = path.join(BUILD_DIR, "icon.svg")
const PNG_PATH = path.join(BUILD_DIR, "icon.png")
const ICO_PATH = path.join(BUILD_DIR, "icon.ico")

function ensureDeps() {
  try {
    require.resolve("sharp")
    require.resolve("to-ico")
  } catch {
    console.log("📦 Installation de sharp et to-ico...")
    execSync("npm install --save-dev --no-save sharp to-ico", { stdio: "inherit" })
  }
}

async function main() {
  if (!fs.existsSync(SVG_PATH)) {
    console.error(`❌ SVG source introuvable : ${SVG_PATH}`)
    process.exit(1)
  }

  ensureDeps()

  const sharp = require("sharp")
  const toIco = require("to-ico")

  const svgBuffer = fs.readFileSync(SVG_PATH)

  // PNG 1024x1024 (utilisé par electron-builder + Linux)
  console.log("🎨 Génération du PNG 1024x1024...")
  await sharp(svgBuffer).resize(1024, 1024).png().toFile(PNG_PATH)

  // ICO multi-résolutions (Windows)
  console.log("🎨 Génération du ICO multi-résolutions...")
  const sizes = [16, 24, 32, 48, 64, 128, 256]
  const pngBuffers = await Promise.all(
    sizes.map((s) => sharp(svgBuffer).resize(s, s).png().toBuffer())
  )
  const icoBuffer = await toIco(pngBuffers)
  fs.writeFileSync(ICO_PATH, icoBuffer)

  console.log("✅ Icônes générées :")
  console.log(`   ${PNG_PATH}`)
  console.log(`   ${ICO_PATH}`)
}

main().catch((e) => {
  console.error("❌ Erreur :", e)
  process.exit(1)
})
