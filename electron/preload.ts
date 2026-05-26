/**
 * Preload script — pont sécurisé entre le renderer (Next.js) et le main process.
 *
 * On expose uniquement ce qui est nécessaire via contextBridge.
 * Le renderer n'a PAS d'accès direct à Node.js (contextIsolation: true).
 */
import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  version: process.versions.electron,
  isElectron: true,
  // Méthodes IPC réservées pour futures fonctionnalités (auto-update, etc.)
  send: (channel: string, ...args: unknown[]) => {
    const allowed = ["app:check-update", "app:install-update"]
    if (allowed.includes(channel)) ipcRenderer.send(channel, ...args)
  },
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    const allowed = ["update-available", "update-downloaded", "update-error"]
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (_e, ...args) => listener(...args))
    }
  },
})
