// G.A Launcher — application de bureau.
// Elle affiche le launcher web et lui donne accès, via un pont sécurisé (preload), à l'état réel de Steam
// sur cet ordinateur : jeux installés, téléchargements en cours, lancement, installation, désinstallation.
const { app, BrowserWindow, ipcMain, shell, Menu, Tray, Notification, nativeImage } = require('electron')
const fs = require('node:fs')
const { autoUpdater } = require('electron-updater')
const path = require('node:path')
const { scan } = require('./steam-local.cjs')

const URL_APP = process.env.GA_URL || 'https://ga-launcher-hassan.netlify.app'
const ORIGIN = new URL(URL_APP).origin
// Fenêtres internes autorisées : connexion officielle Steam (OpenID) uniquement.
const POPUP_OK = (u) => u.startsWith(ORIGIN) || u.startsWith('https://steamcommunity.com/openid')
const APPID = /^\d{1,9}$/

// Sous Windows, cet identifiant est nécessaire pour que les notifications apparaissent sous le nom « G.A Launcher ».
app.setAppUserModelId('com.ga.launcher')

// Réglages de l'application, enregistrés dans le dossier de données de l'utilisateur.
const SETTINGS_FILE = () => path.join(app.getPath('userData'), 'settings.json')
const defaults = { openAtLogin: false, closeToTray: true, notifications: true }
let settings = { ...defaults }
const loadSettings = () => {
  try {
    settings = { ...defaults, ...JSON.parse(fs.readFileSync(SETTINGS_FILE(), 'utf8')) }
  } catch { /* premier lancement */ }
}
const saveSettings = () => {
  try {
    fs.writeFileSync(SETTINGS_FILE(), JSON.stringify(settings))
  } catch { /* disque en lecture seule : on garde en mémoire */ }
  app.setLoginItemSettings({ openAtLogin: !!settings.openAtLogin, args: ['--hidden'] })
}

let win
let tray
let quitting = false
if (!app.requestSingleInstanceLock()) app.quit()
app.on('second-instance', () => win && (win.isMinimized() && win.restore(), win.focus()))

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#06060A',
    show: false,
    title: 'G.A Launcher',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  Menu.setApplicationMenu(null)

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (POPUP_OK(url)) return { action: 'allow', overrideBrowserWindowOptions: { width: 520, height: 720, autoHideMenuBar: true, parent: win, modal: false } }
    if (/^https:\/\//.test(url)) shell.openExternal(url) // tout le reste s'ouvre dans le navigateur, jamais dans le launcher
    return { action: 'deny' }
  })
  // Le launcher ne navigue jamais hors de son site.
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(ORIGIN)) {
      e.preventDefault()
      if (/^https:\/\//.test(url)) shell.openExternal(url)
    }
  })
  win.webContents.on('did-fail-load', (_e, code, _d, url, isMain) => {
    if (isMain && code !== -3) win.loadFile(path.join(__dirname, 'offline.html'), { query: { retry: URL_APP } })
  })
  // Fermer la fenêtre réduit l'application dans la zone de notification (comme Steam), sauf si l'option est coupée.
  win.on('close', (e) => {
    if (!quitting && settings.closeToTray) {
      e.preventDefault()
      win.hide()
    }
  })
  if (!process.argv.includes('--hidden')) win.once('ready-to-show', () => win.show())
  win.loadURL(URL_APP)
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png')).resize({ width: 24, height: 24 })
  tray = new Tray(icon)
  tray.setToolTip('G.A Launcher')
  const show = () => (win.show(), win.focus())
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Ouvrir G.A Launcher', click: show },
      { label: 'Quitter', click: () => ((quitting = true), app.quit()) },
    ]),
  )
  tray.on('click', show)
}

// --- Pont Steam ---------------------------------------------------------------------------------
let timer
const emit = () => win && !win.isDestroyed() && win.webContents.send('steam:state', scan())
// On surveille Steam toutes les 1,5 s tant que le launcher est ouvert (les manifestes changent pendant un téléchargement).
const startWatching = () => (timer ||= setInterval(emit, 1500))

const check = (id) => {
  if (!APPID.test(String(id))) throw new Error('appid invalide')
  return String(id)
}
// Les actions passent par le protocole steam:// : c'est le client Steam qui télécharge, vérifie et lance le jeu.
const steam = (action, id) => shell.openExternal(`steam://${action}/${check(id)}`)

ipcMain.handle('steam:scan', () => scan())

// Notification native du système (centre de notifications Windows / macOS / Linux). Un clic ouvre le launcher.
ipcMain.handle('notify', (_e, { title, body, route } = {}) => {
  if (!settings.notifications || !Notification.isSupported()) return false
  const n = new Notification({ title: String(title || 'G.A Launcher').slice(0, 80), body: String(body || '').slice(0, 200), icon: path.join(__dirname, 'icon.png') })
  n.on('click', () => {
    win.show()
    win.focus()
    if (/^\/[\w/-]*$/.test(route || '')) win.webContents.send('navigate', route)
  })
  n.show()
  return true
})
ipcMain.handle('settings:get', () => settings)
ipcMain.handle('settings:set', (_e, patch = {}) => {
  for (const k of Object.keys(defaults)) if (typeof patch[k] === 'boolean') settings[k] = patch[k]
  saveSettings()
  return settings
})
ipcMain.handle('steam:install', (_e, id) => steam('install', id))
ipcMain.handle('steam:downloads', () => shell.openExternal('steam://open/downloads')) // file de téléchargement du client Steam (pause / priorité)
ipcMain.handle('steam:play', (_e, id) => steam('rungameid', id))
ipcMain.handle('steam:uninstall', (_e, id) => steam('uninstall', id))
ipcMain.handle('steam:folder', (_e, id) => {
  const a = scan().apps[check(id)]
  if (a) shell.showItemInFolder(a.folder)
  return !!a
})

// --- Mise à jour automatique (Releases GitHub) --------------------------------------------------------
// L'application vérifie au démarrage puis toutes les 4 h, télécharge en arrière-plan, et propose de redémarrer pour installer.
// Windows et Linux (AppImage) : automatique. macOS exige une application signée : la mise à jour y reste manuelle.
let updateState = { status: 'idle', version: null, percent: 0, error: null }
const setUpdate = (patch) => {
  updateState = { ...updateState, ...patch }
  if (win && !win.isDestroyed()) win.webContents.send('updater:state', updateState)
}
function toast(title, body) {
  if (settings.notifications && Notification.isSupported()) new Notification({ title, body, icon: path.join(__dirname, 'icon.png') }).show()
}
function setupUpdater() {
  if (!app.isPackaged) return // en développement : pas de mise à jour
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('checking-for-update', () => setUpdate({ status: 'checking', error: null }))
  autoUpdater.on('update-not-available', () => setUpdate({ status: 'latest' }))
  autoUpdater.on('update-available', (i) => {
    setUpdate({ status: 'downloading', version: i.version, percent: 0 })
    toast('Mise à jour disponible', `La version ${i.version} se télécharge en arrière-plan.`)
  })
  autoUpdater.on('download-progress', (p) => setUpdate({ status: 'downloading', percent: Math.round(p.percent) }))
  autoUpdater.on('update-downloaded', (i) => {
    setUpdate({ status: 'ready', version: i.version, percent: 100 })
    toast('Mise à jour prête', `Redémarre G.A Launcher pour installer la version ${i.version}.`)
  })
  autoUpdater.on('error', (e) => setUpdate({ status: 'error', error: String(e?.message || e).slice(0, 200) }))
  const check = () => autoUpdater.checkForUpdates().catch(() => {})
  setTimeout(check, 8000)
  setInterval(check, 4 * 60 * 60 * 1000)
}
ipcMain.handle('app:version', () => app.getVersion())
ipcMain.handle('updater:get', () => updateState)
ipcMain.handle('updater:check', () => {
  if (!app.isPackaged) {
    setUpdate({ status: 'latest' })
    return updateState
  }
  return autoUpdater.checkForUpdates().then(() => updateState).catch(() => updateState)
})
ipcMain.handle('updater:install', () => {
  if (updateState.status !== 'ready') return false
  quitting = true
  autoUpdater.quitAndInstall(false, true)
  return true
})

app.on('before-quit', () => (quitting = true))
app.whenReady().then(() => {
  loadSettings()
  createWindow()
  createTray()
  setupUpdater()
  startWatching()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
})
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
