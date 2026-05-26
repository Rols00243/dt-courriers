/**
 * DT Courriers — Electron main process
 */
import { app, BrowserWindow, shell, Menu, dialog } from "electron"
import { spawn, ChildProcess } from "child_process"
import path from "path"
import fs from "fs"
import treeKill from "tree-kill"
import http from "http"

// ---- LOG SETUP (très tôt, avant tout) ----
const LOG_FILE = path.join(
  process.env.APPDATA || process.env.HOME || "",
  "dt-courriers",
  "app.log"
)
try {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true })
} catch {}

function log(...args: unknown[]) {
  const msg = `[${new Date().toISOString()}] ${args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ")}`
  try {
    fs.appendFileSync(LOG_FILE, msg + "\n", "utf8")
  } catch {}
  // eslint-disable-next-line no-console
  console.log(msg)
}

log("=== main.ts CHARGÉ ===")
log("process.execPath:", process.execPath)
log("process.resourcesPath:", process.resourcesPath ?? "undefined")
log("app.isPackaged:", app.isPackaged)
log("__dirname:", __dirname)

const isDev = !app.isPackaged
const APP_PORT = parseInt(process.env.APP_PORT ?? "3000", 10)
const APP_URL = `http://localhost:${APP_PORT}`

let mainWindow: BrowserWindow | null = null
let nextProcess: ChildProcess | null = null

function waitForServer(timeoutMs = 60000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      const req = http.get(APP_URL, () => resolve())
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Serveur Next.js indisponible après ${timeoutMs}ms`))
        } else {
          setTimeout(check, 500)
        }
      })
      req.setTimeout(2000, () => {
        req.destroy()
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Timeout"))
        } else {
          setTimeout(check, 500)
        }
      })
    }
    check()
  })
}

async function startNextServer(): Promise<void> {
  if (isDev) {
    log("Mode dev : attente du serveur externe Next.js...")
    await waitForServer()
    return
  }

  const resourcesPath = process.resourcesPath
  const serverScript = path.join(resourcesPath, "app", "server.js")
  log("serverScript:", serverScript)
  log("server.js existe ?", fs.existsSync(serverScript))

  if (!fs.existsSync(serverScript)) {
    throw new Error(`server.js introuvable : ${serverScript}`)
  }

  const standaloneDir = path.dirname(serverScript)
  log("Spawn du serveur Next.js...")
  log("  execPath:", process.execPath)
  log("  cwd:", standaloneDir)

  nextProcess = spawn(process.execPath, [serverScript], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      PORT: String(APP_PORT),
      NODE_ENV: "production",
      HOSTNAME: "127.0.0.1",
      ELECTRON_RUN_AS_NODE: "1",
      // NextAuth v5 : autoriser localhost/127.0.0.1 comme hôte de confiance
      AUTH_TRUST_HOST: "true",
      NEXTAUTH_URL: `http://localhost:${APP_PORT}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  })

  log("Spawn lancé, pid:", nextProcess.pid ?? "undefined")

  nextProcess.stdout?.on("data", (d) => log(`[next] ${d.toString().trim()}`))
  nextProcess.stderr?.on("data", (d) => log(`[next-err] ${d.toString().trim()}`))
  nextProcess.on("exit", (code, signal) =>
    log(`Serveur Next.js arrêté (code=${code}, signal=${signal})`)
  )
  nextProcess.on("error", (e) => log(`Spawn error: ${e.message}`))

  log("Attente que le serveur réponde...")
  await waitForServer()
  log("Serveur Next.js prêt !")
}

function createWindow() {
  log("createWindow()")
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: "DT Courriers",
    backgroundColor: "#0f172a",
    show: false,
    autoHideMenuBar: true,
    icon: path.join(
      isDev ? __dirname : process.resourcesPath,
      isDev ? "../build/icon.png" : "icon.png"
    ),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  Menu.setApplicationMenu(null)

  mainWindow.once("ready-to-show", () => {
    log("Window ready-to-show")
    mainWindow?.show()
    if (isDev) mainWindow?.webContents.openDevTools({ mode: "detach" })
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL)) return { action: "allow" }
    shell.openExternal(url)
    return { action: "deny" }
  })

  mainWindow.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(APP_URL)) {
      e.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.loadURL(APP_URL).catch((e) => log(`loadURL error: ${e}`))
  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

function cleanup() {
  if (nextProcess?.pid) {
    log(`Arrêt du serveur Next.js (pid=${nextProcess.pid})`)
    try {
      treeKill(nextProcess.pid, "SIGTERM")
    } catch (e) {
      log(`Erreur cleanup: ${e}`)
    }
    nextProcess = null
  }
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  log("Une instance tourne déjà - quit")
  app.quit()
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    log("app.whenReady fired")
    try {
      await startNextServer()
      createWindow()
    } catch (err) {
      log(`Démarrage échoué : ${err}`)
      dialog.showErrorBox(
        "Erreur de démarrage",
        `Le serveur de l'application n'a pas pu démarrer.\n\n${err}\n\nJournal :\n${LOG_FILE}`
      )
      app.quit()
    }
  })
}

app.on("window-all-closed", () => {
  log("window-all-closed")
  cleanup()
  if (process.platform !== "darwin") app.quit()
})

app.on("before-quit", () => {
  log("before-quit")
  cleanup()
})

app.on("will-quit", () => {
  log("will-quit")
  cleanup()
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
