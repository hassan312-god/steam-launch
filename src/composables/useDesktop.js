import { reactive } from 'vue'
import { toast } from './useToast'

// Pont avec l'application de bureau (Electron). Dans un navigateur normal, `available` vaut false et rien ne change.
export const desktop = reactive({ available: typeof window !== 'undefined' && !!window.launcher?.isDesktop, steamFound: false, libraries: 0, apps: {} })

export const isInstalled = (id) => !!desktop.apps[id]?.installed
export const dlState = (id) => desktop.apps[id] ?? null
export const downloads = () => Object.values(desktop.apps).filter((a) => a.downloading)
export const installedCount = () => Object.values(desktop.apps).filter((a) => a.installed).length

let started = false
export function startDesktop() {
  if (!desktop.available || started) return
  started = true
  const apply = (s) => {
    // Notification réelle quand un téléchargement se termine.
    for (const a of Object.values(s.apps)) {
      const before = desktop.apps[a.appid]
      if (before?.downloading && a.installed && !a.downloading) toast(`${a.name} est installé`)
    }
    desktop.steamFound = s.steamFound
    desktop.libraries = s.libraries.length
    desktop.apps = s.apps
  }
  window.launcher.scan().then(apply)
  window.launcher.onState(apply)
}
