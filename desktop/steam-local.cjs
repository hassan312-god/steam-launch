// Lecture de l'état RÉEL de Steam sur la machine : où il est installé, quels jeux sont installés, quels téléchargements sont en cours.
// Steam écrit un fichier appmanifest_<appid>.acf par jeu dans chaque dossier de bibliothèque (steamapps/).
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execFileSync } = require('node:child_process')

// Format texte « VDF » de Valve : "clé" "valeur" et "clé" { … }
function parseVdf(text) {
  const tokens = text.match(/"(?:[^"\\]|\\.)*"|[{}]/g) || []
  let i = 0
  const read = () => {
    const obj = {}
    while (i < tokens.length) {
      const t = tokens[i++]
      if (t === '}') return obj
      const key = t.slice(1, -1).toLowerCase()
      const next = tokens[i++]
      if (next === '{') obj[key] = read()
      else obj[key] = (next || '""').slice(1, -1).replace(/\\\\/g, '\\')
    }
    return obj
  }
  return read()
}

function steamRoots() {
  const home = os.homedir()
  const list = []
  if (process.platform === 'win32') {
    try {
      const out = execFileSync('reg', ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'], { encoding: 'utf8' })
      const m = out.match(/SteamPath\s+REG_SZ\s+(.+)/)
      if (m) list.push(m[1].trim())
    } catch { /* clé absente */ }
    list.push('C:\\Program Files (x86)\\Steam', 'C:\\Program Files\\Steam')
  } else if (process.platform === 'darwin') {
    list.push(path.join(home, 'Library/Application Support/Steam'))
  } else {
    list.push(path.join(home, '.steam/steam'), path.join(home, '.local/share/Steam'), path.join(home, '.var/app/com.valvesoftware.Steam/.local/share/Steam'))
  }
  return list.filter((p) => fs.existsSync(path.join(p, 'steamapps')))
}

// Tous les dossiers « steamapps » (une bibliothèque par disque / dossier choisi dans Steam).
function libraries() {
  const set = new Set()
  for (const root of steamRoots()) {
    set.add(path.join(root, 'steamapps'))
    try {
      const vdf = parseVdf(fs.readFileSync(path.join(root, 'steamapps', 'libraryfolders.vdf'), 'utf8'))
      const folders = vdf.libraryfolders || {}
      for (const f of Object.values(folders)) {
        const p = typeof f === 'string' ? f : f.path
        if (p && fs.existsSync(path.join(p, 'steamapps'))) set.add(path.join(p, 'steamapps'))
      }
    } catch { /* pas de libraryfolders.vdf */ }
  }
  return [...set]
}

// StateFlags (bits observés dans les manifestes) : 4 = complètement installé, 2 = mise à jour requise,
// 256 / 1024 = mise à jour ou téléchargement en cours, 512 = en pause / file d'attente.
function describe(dir, file) {
  let a
  try {
    a = parseVdf(fs.readFileSync(path.join(dir, file), 'utf8')).appstate
  } catch {
    return null
  }
  if (!a || !/^\d+$/.test(a.appid || '')) return null
  const flags = Number(a.stateflags || 0)
  const toDl = Number(a.bytestodownload || 0)
  const dl = Number(a.bytesdownloaded || 0)
  const busy = (flags & (256 | 1024)) !== 0 || (toDl > 0 && dl < toDl && !(flags & 4))
  return {
    appid: a.appid,
    name: a.name || '',
    installed: (flags & 4) !== 0,
    downloading: busy,
    paused: (flags & 512) !== 0 && busy,
    progress: toDl > 0 ? Math.min(1, dl / toDl) : flags & 4 ? 1 : 0,
    bytesDownloaded: dl,
    bytesToDownload: toDl,
    sizeOnDisk: Number(a.sizeondisk || 0),
    folder: path.join(dir, 'common', a.installdir || ''),
  }
}

function scan() {
  const libs = libraries()
  const apps = {}
  for (const dir of libs) {
    let files = []
    try {
      files = fs.readdirSync(dir).filter((f) => /^appmanifest_\d+\.acf$/.test(f))
    } catch { /* dossier illisible */ }
    for (const f of files) {
      const d = describe(dir, f)
      if (d) apps[d.appid] = d
    }
  }
  return { steamFound: libs.length > 0, libraries: libs, apps }
}

// Nom de compte du dernier utilisateur connecté dans le client Steam de cet ordinateur (config/loginusers.vdf).
function lastAccount() {
  for (const root of steamRoots()) {
    try {
      const users = parseVdf(fs.readFileSync(path.join(root, 'config', 'loginusers.vdf'), 'utf8')).users || {}
      const list = Object.values(users).filter((u) => u && u.accountname)
      const u = list.find((x) => x.mostrecent === '1') || list[0]
      if (u && /^[A-Za-z0-9_.-]{2,64}$/.test(u.accountname)) return u.accountname
    } catch { /* fichier absent */ }
  }
  return null
}

module.exports = { parseVdf, scan, libraries, lastAccount }
