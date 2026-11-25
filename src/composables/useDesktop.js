import { reactive } from 'vue'
import { toast } from './useToast'

// Pont avec l'application de bureau (Electron). Dans un navigateur normal, `available` vaut false et rien ne change.
export const desktop = reactive({ available: typeof window !== 'undefined' && !!window.launcher?.isDesktop, steamFound: false, libraries: 0, apps: {}, version: '', update: { status: 'idle', version: null, percent: 0, error: null }, settings: { openAtLogin: false, closeToTray: true, notifications: true }, canUpdate: typeof window !== 'undefined' && !!window.launcher?.update, canCmd: typeof window !== 'undefined' && !!window.launcher?.cmd, cmd: { ready: false, setup: { state: 'idle', message: '' }, account: null, auth: { state: 'idle', message: '' }, jobs: [] }, loginAsk: null })

export const isInstalled = (id) => !!desktop.apps[id]?.installed
// Un téléchargement piloté par le launcher (SteamCMD) : même forme que l'état lu dans les manifestes de Steam.
const fromJob = (j) => ({
  appid: j.appid,
  name: j.name,
  installed: false,
  downloading: true,
  paused: j.status === 'paused',
  queued: j.status === 'queued',
  failed: j.status === 'error',
  message: j.message,
  phase: j.phase,
  verify: j.verify,
  progress: j.progress || 0,
  bytesDownloaded: j.done || 0,
  bytesToDownload: j.total || 0,
  sizeOnDisk: 0,
  speed: j.speed || 0,
  eta: j.speed > 0 && j.total > j.done ? (j.total - j.done) / j.speed : null,
  job: true,
})
const liveJobs = () => desktop.cmd.jobs.filter((j) => j.status !== 'done').map(fromJob)
export const dlState = (id) => liveJobs().find((j) => j.appid === String(id)) ?? desktop.apps[id] ?? null
export const downloads = () => {
  const jobs = liveJobs()
  const ids = new Set(jobs.map((j) => j.appid))
  return [...jobs, ...Object.values(desktop.apps).filter((a) => a.downloading && !ids.has(a.appid))]
}

// Pilotage des téléchargements du launcher (SteamCMD) : pause, reprise, annulation, compte Steam.
export const cmd = {
  pause: (id) => window.launcher.cmd.pause(id),
  resume: (id) => window.launcher.cmd.resume(id),
  cancel: (id) => window.launcher.cmd.cancel(id),
  login: (u, p) => window.launcher.cmd.login(u, p),
  code: (c) => window.launcher.cmd.code(c),
  cancelLogin: () => window.launcher.cmd.cancelLogin(),
  logout: () => window.launcher.cmd.logout(),
  install: (id, name) => window.launcher.cmd.install(id, name),
}
export const installedCount = () => Object.values(desktop.apps).filter((a) => a.installed).length

// Notification native du système (centre de notifications de Windows) ; sans effet dans un navigateur.
export const notify = (title, body, route) => desktop.available && window.launcher.notify(title, body, route)

export async function setSetting(patch) {
  desktop.settings = await window.launcher.setSettings(patch)
}

const snap = {} // dernier relevé par jeu, pour calculer la vitesse réelle
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
    const t = Date.now()
    for (const a of Object.values(s.apps)) {
      const prev = snap[a.appid]
      let speed = 0
      if (a.downloading && prev && t > prev.t) {
        const inst = Math.max(0, (a.bytesDownloaded - prev.b) / ((t - prev.t) / 1000))
        speed = prev.speed * 0.6 + inst * 0.4 // lissage : la vitesse ne saute pas à chaque relevé
        if (speed < 1024) speed = 0
      }
      a.speed = speed
      a.eta = speed > 0 && a.bytesToDownload > a.bytesDownloaded ? (a.bytesToDownload - a.bytesDownloaded) / speed : null
      snap[a.appid] = { t, b: a.bytesDownloaded, speed }
    }
    desktop.steamFound = s.steamFound
    desktop.libraries = s.libraries.length
    desktop.apps = s.apps
  }
  window.launcher.version?.().then((v) => (desktop.version = v))
  window.launcher.update?.get().then((u) => (desktop.update = u))
  window.launcher.update?.onState((u) => (desktop.update = u))
  window.launcher.getSettings().then((st) => (desktop.settings = st))
  window.launcher.cmd?.state().then((st) => (desktop.cmd = st))
  window.launcher.cmd?.onState((st) => (desktop.cmd = st))
  window.launcher.scan().then(apply)
  window.launcher.onState(apply)
}

export const checkUpdate = () => window.launcher.update?.check()
export const installUpdate = () => window.launcher.update?.install()

const U = ['o', 'Ko', 'Mo', 'Go', 'To']
export function fmtBytes(n = 0) {
  let i = 0
  while (n >= 1024 && i < U.length - 1) (n /= 1024), i++
  return (n >= 100 || i === 0 ? Math.round(n) : n.toFixed(1)).toString().replace('.', ',') + ' ' + U[i]
}
export const fmtSpeed = (n) => (n > 0 ? fmtBytes(n) + '/s' : '—')
export function fmtEta(sec) {
  if (sec == null || !isFinite(sec)) return '—'
  if (sec < 60) return 'moins d’une minute'
  const m = Math.round(sec / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
}
