// G.A Launcher — application de bureau.
// Elle affiche le launcher web et lui donne accès, via un pont sécurisé (preload), à l'état réel de Steam
// sur cet ordinateur : jeux installés, téléchargements en cours, lancement, installation, désinstallation.
const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron')
const path = require('node:path')
const { scan } = require('./steam-local.cjs')

const URL_APP = process.env.GA_URL || 'https://ga-launcher-hassan.netlify.app'
const ORIGIN = new URL(URL_APP).origin
// Fenêtres internes autorisées : connexion officielle Steam (OpenID) uniquement.
const POPUP_OK = (u) => u.startsWith(ORIGIN) || u.startsWith('https://steamcommunity.com/openid')
const APPID = /^\d{1,9}$/

let win
if (!app.requestSingleInstanceLock()) app.quit()
app.on('second-instance', () => win && (win.isMinimized() && win.restore(), win.focus()))

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#06060A',
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
  win.loadURL(URL_APP)
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
ipcMain.handle('steam:install', (_e, id) => steam('install', id))
ipcMain.handle('steam:play', (_e, id) => steam('rungameid', id))
ipcMain.handle('steam:uninstall', (_e, id) => steam('uninstall', id))
ipcMain.handle('steam:folder', (_e, id) => {
  const a = scan().apps[check(id)]
  if (a) shell.showItemInFolder(a.folder)
  return !!a
})

app.whenReady().then(() => {
  createWindow()
  startWatching()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
})
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
