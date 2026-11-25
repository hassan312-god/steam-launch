import { reactive } from 'vue'
import { toast } from './useToast'

// Pont avec l'application de bureau (Electron). Dans un navigateur normal, `available` vaut false et rien ne change.
export const desktop = reactive({ available: typeof window !== 'undefined' && !!window.launcher?.isDesktop, steamFound: false, libraries: 0, apps: {}, version: '', update: { status: 'idle', version: null, percent: 0, error: null }, settings: { openAtLogin: false, closeToTray: true, notifications: true }, canUpdate: typeof window !== 'undefined' && !!window.launcher?.update })

export const isInstalled = (id) => !!desktop.apps[id]?.installed
export const dlState = (id) => desktop.apps[id] ?? null
export const downloads = () => Object.values(desktop.apps).filter((a) => a.downloading)
export const installedCount = () => Object.values(desktop.apps).filter((a) => a.installed).length

// Notification native du système (centre de notifications de Windows) ; sans effet dans un navigateur.
export const notify = (title, body, route) => desktop.available && window.launcher.notify(title, body, route)

export async function setSetting(patch) {
  desktop.settings = await window.launcher.setSettings(patch)
}

let started = false
export function startDesktop() {
  if (!desktop.available || started) return
  started = true
  const apply = (s) => {
    // Notification réelle quand un téléchargement se termine.
    for (const a of Object.values(s.apps)) {
      const before = desktop.apps[a.appid]
      if (before?.downloading && a.installed && !a.downloading) {
        toast(`${a.name} est installé`)
        notify('Installation terminée', `${a.name} est prêt à jouer.`, '/jeu/' + a.appid)
      }
    }
    desktop.steamFound = s.steamFound
    desktop.libraries = s.libraries.length
    desktop.apps = s.apps
  }
  window.launcher.version?.().then((v) => (desktop.version = v))
  window.launcher.update?.get().then((u) => (desktop.update = u))
  window.launcher.update?.onState((u) => (desktop.update = u))
  window.launcher.getSettings().then((st) => (desktop.settings = st))
  window.launcher.scan().then(apply)
  window.launcher.onState(apply)
}

export const checkUpdate = () => window.launcher.update?.check()
export const installUpdate = () => window.launcher.update?.install()
