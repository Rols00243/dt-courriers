#
# Build manuel DT Courriers en app Windows portable.
# Bypass complet de electron-packager / electron-builder (problemes de symlinks).
#
# Usage : powershell -ExecutionPolicy Bypass -File scripts/manual-package.ps1
#

$ErrorActionPreference = "Stop"

$ROOT = Split-Path -Parent $PSScriptRoot
$DIST = Join-Path $ROOT "dist"
$APP_NAME = "DT Courriers"
$ELECTRON_VERSION = "42.2.0"
$ARCH = "x64"

$APP_OUT = Join-Path $DIST "$APP_NAME-win32-$ARCH"
$RESOURCES = Join-Path $APP_OUT "resources"
$RESOURCES_APP = Join-Path $RESOURCES "app"

Write-Host ""
Write-Host "Packaging DT Courriers pour Windows $ARCH..." -ForegroundColor Cyan
Write-Host ""

# 1. Verifications prealables
$standaloneDir = Join-Path $ROOT ".next\standalone"
if (-not (Test-Path $standaloneDir)) {
    Write-Error ".next/standalone manquant. Lancez d'abord : npm run build"
}

$mainJs = Join-Path $ROOT "dist-electron\main.js"
if (-not (Test-Path $mainJs)) {
    Write-Error "dist-electron/main.js manquant. Lancez d'abord : npm run electron:compile"
}

# 2. Nettoyer / preparer dist (cmd rmdir gere mieux les chemins longs que Remove-Item)
if (Test-Path $DIST) {
    Write-Host "Nettoyage du dossier dist/ (peut prendre 30s)..."
    cmd /c "rmdir /s /q `"$DIST`"" 2>$null
    # Si rmdir a echoue (chemins trop longs), retente avec robocopy /MIR depuis un dir vide
    if (Test-Path $DIST) {
        $emptyDir = Join-Path $env:TEMP "dt-empty-$([guid]::NewGuid())"
        New-Item -ItemType Directory -Path $emptyDir | Out-Null
        robocopy $emptyDir $DIST /MIR /NJH /NJS /NDL /NC /NS /NP | Out-Null
        Remove-Item -Recurse -Force $emptyDir -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force $DIST -ErrorAction SilentlyContinue
    }
}
New-Item -ItemType Directory -Path $APP_OUT -Force | Out-Null
Write-Host "[OK] Dossier dist/ prepare" -ForegroundColor Green

# 3. Trouver le zip Electron dans le cache
$electronCache = Join-Path $env:LOCALAPPDATA "electron\Cache"
$zipFile = Get-ChildItem -Path $electronCache -Recurse -Filter "electron-v$ELECTRON_VERSION-win32-$ARCH.zip" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $zipFile) {
    Write-Host "Electron pas en cache - telechargement..." -ForegroundColor Yellow
    $url = "https://github.com/electron/electron/releases/download/v$ELECTRON_VERSION/electron-v$ELECTRON_VERSION-win32-$ARCH.zip"
    $zipFile = Join-Path $env:TEMP "electron-v$ELECTRON_VERSION-win32-$ARCH.zip"
    Invoke-WebRequest -Uri $url -OutFile $zipFile -UseBasicParsing
    Write-Host "[OK] Electron telecharge" -ForegroundColor Green
} else {
    Write-Host "[OK] Electron trouve en cache : $($zipFile.FullName)" -ForegroundColor Green
}

# 4. Extraire Electron dans le dossier dist (Expand-Archive gere les symlinks)
$zipPath = if ($zipFile -is [System.IO.FileInfo]) { $zipFile.FullName } else { $zipFile }
Write-Host "Extraction d'Electron depuis $zipPath..."
Expand-Archive -LiteralPath $zipPath -DestinationPath $APP_OUT -Force
Write-Host "[OK] Electron extrait dans $APP_OUT" -ForegroundColor Green

# 5. Renommer electron.exe en "DT Courriers.exe"
$electronExe = Join-Path $APP_OUT "electron.exe"
$targetExe = Join-Path $APP_OUT "$APP_NAME.exe"
Rename-Item -Path $electronExe -NewName "$APP_NAME.exe" -Force
Write-Host "[OK] electron.exe renomme en '$APP_NAME.exe'" -ForegroundColor Green

# 6. Supprimer le default_app d'Electron (notre app va remplacer)
$defaultApp = Join-Path $RESOURCES "default_app.asar"
if (Test-Path $defaultApp) {
    Remove-Item $defaultApp -Force
}

# 7. Creer resources/app/ et copier notre app
New-Item -ItemType Directory -Path $RESOURCES_APP -Force | Out-Null

Write-Host "Copie des fichiers de l'app..."

# package.json minimal pour Electron
$pkg = Get-Content (Join-Path $ROOT "package.json") | ConvertFrom-Json
$minimalPkg = @{
    name = $pkg.name
    version = $pkg.version
    main = "dist-electron/main.js"
    description = $pkg.description
    author = $pkg.author
} | ConvertTo-Json -Depth 10
Set-Content -Path (Join-Path $RESOURCES_APP "package.json") -Value $minimalPkg -Encoding UTF8

# dist-electron (main.js, preload.js)
Copy-Item -Path (Join-Path $ROOT "dist-electron") -Destination (Join-Path $RESOURCES_APP "dist-electron") -Recurse -Force

# .next/standalone -> resources/app/ (utilise robocopy pour bien copier .env et server.js)
Write-Host "  - .next/standalone (peut prendre 30s)..."
robocopy $standaloneDir $RESOURCES_APP /E /NJH /NJS /NDL /NC /NS /NP | Out-Null

# .next/static
$staticSrc = Join-Path $ROOT ".next\static"
$staticDest = Join-Path $RESOURCES_APP ".next\static"
New-Item -ItemType Directory -Path (Split-Path $staticDest) -Force -ErrorAction SilentlyContinue | Out-Null
Copy-Item -Path $staticSrc -Destination $staticDest -Recurse -Force

# public/ — on EXCLUT public/uploads/ (données utilisateur, peuvent contenir
# des fichiers aux noms très longs qui dépassent MAX_PATH Windows)
$publicSrc = Join-Path $ROOT "public"
$publicDst = Join-Path $RESOURCES_APP "public"
robocopy $publicSrc $publicDst /E /XD "uploads" /NJH /NJS /NDL /NC /NS /NP | Out-Null

# Créer un dossier uploads/ vide pour que l'app puisse y écrire
New-Item -ItemType Directory -Path (Join-Path $publicDst "uploads") -Force -ErrorAction SilentlyContinue | Out-Null

# .env
$envSrc = Join-Path $ROOT ".env"
Copy-Item -Path $envSrc -Destination (Join-Path $RESOURCES_APP ".env") -Force

# node_modules essentiels pour Electron main process (tree-kill)
# Ces deps ne sont PAS dans le bundle standalone Next.js, il faut les copier
$nodeModulesNeeded = @("tree-kill")
foreach ($mod in $nodeModulesNeeded) {
    $src = Join-Path $ROOT "node_modules\$mod"
    $dst = Join-Path $RESOURCES_APP "node_modules\$mod"
    if (Test-Path $src) {
        if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
        robocopy $src $dst /E /NJH /NJS /NDL /NC /NS /NP | Out-Null
        Write-Host "    - node_modules\$mod copie"
    }
}

Write-Host "[OK] App copiee dans resources/app/" -ForegroundColor Green

# 8. Icone
$iconSrc = Join-Path $ROOT "build\icon.png"
Copy-Item -Path $iconSrc -Destination (Join-Path $RESOURCES "icon.png") -Force

# 9. Resume
$totalSize = (Get-ChildItem $APP_OUT -Recurse | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 1)

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "BUILD TERMINE !" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Dossier      : $APP_OUT"
Write-Host "Executable   : $APP_OUT\$APP_NAME.exe"
Write-Host "Taille totale: $totalSizeMB MB"
Write-Host ""
Write-Host "Pour lancer : double-cliquez sur '$APP_NAME.exe'"
Write-Host "Pour distribuer : zippez le dossier complet."
Write-Host ""
