// Téléchargement de jeux DANS le launcher, avec SteamCMD (l'outil officiel en ligne de commande de Valve).
// SteamCMD est téléchargé une fois depuis les serveurs de Valve ; le launcher le pilote : connexion, installation, pause (arrêt du
// processus), reprise (SteamCMD reprend où il s'était arrêté) et progression exacte (octets lus dans sa sortie).
// Sécurité : le mot de passe n'est jamais enregistré ni envoyé ailleurs qu'à SteamCMD ; seul le nom de compte est conservé.
const { spawn, execFile } = require('node:child_process')
const { EventEmitter } = require('node:events')
const fs = require('node:fs')
const path = require('node:path')

const URLS = {
  win32: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip',
  darwin: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz',
  linux: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz',
}
const APPID = /^\d{1,9}$/
const USER = /^[A-Za-z0-9_.-]{2,64}$/
const PROGRESS = /Update state \(0x[0-9a-f]+\) ([a-z ]+), progress: ([\d.]+) \((\d+) \/ (\d+)\)/i
const safeName = (n, id) => String(n || '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'app' + id

// Messages d'erreur de SteamCMD, traduits.
function explain(raw = '') {
  if (/Invalid Password/i.test(raw)) return 'Mot de passe incorrect.'
  if (/Rate Limit/i.test(raw)) return 'Trop de tentatives : réessaie dans quelques minutes.'
  if (/Account Logon Denied|Two.?factor code mismatch|Invalid Login Auth Code/i.test(raw)) return 'Code Steam Guard refusé ou expiré.'
  if (/No subscription/i.test(raw)) return 'Ce jeu n’est pas dans ta bibliothèque Steam : ajoute-le (ou achète-le) avant de le télécharger.'
  if (/Disk write failure|No space/i.test(raw)) return 'Espace disque insuffisant ou dossier non accessible en écriture.'
  if (/Cached credentials not found|password/i.test(raw)) return 'Connexion Steam expirée : reconnecte-toi.'
  return raw.slice(0, 160) || 'Erreur inconnue.'
}

class SteamCmd extends EventEmitter {
  constructor({ dir, libraries }) {
    super()
    this.dir = dir
    this.libraries = libraries
    this.jobs = new Map()
    this.auth = { state: 'idle', message: '' } // idle | working | code | confirm | ok | error
    this.setup = { state: 'idle', message: '' } // idle | working | error
    this.account = null
    this.loginProc = null
    this._last = 0
    this._load()
  }

  exe() {
    return path.join(this.dir, process.platform === 'win32' ? 'steamcmd.exe' : 'steamcmd.sh')
  }
  ready() {
    return fs.existsSync(this.exe())
  }
  _file(n) {
    return path.join(this.dir, n)
  }
  _load() {
    try {
      this.account = JSON.parse(fs.readFileSync(this._file('ga-account.json'), 'utf8')).account || null
    } catch { /* aucun compte */ }
    try {
      for (const j of JSON.parse(fs.readFileSync(this._file('ga-jobs.json'), 'utf8'))) this.jobs.set(j.appid, { ...j, status: j.status === 'done' ? 'done' : 'paused', speed: 0, proc: null })
    } catch { /* aucun téléchargement mémorisé */ }
  }
  _save() {
    try {
      fs.mkdirSync(this.dir, { recursive: true })
      fs.writeFileSync(this._file('ga-account.json'), JSON.stringify({ account: this.account }))
      fs.writeFileSync(this._file('ga-jobs.json'), JSON.stringify([...this.jobs.values()].map(({ proc, ...j }) => j)))
    } catch { /* disque en lecture seule */ }
  }
  state() {
    return {
      ready: this.ready(),
      setup: this.setup,
      account: this.account,
      auth: this.auth,
      jobs: [...this.jobs.values()].map(({ proc, ...j }) => j),
    }
  }
  push(force = false) {
    const t = Date.now()
    if (!force && t - this._last < 400) return
    this._last = t
    this.emit('state', this.state())
  }

  // --- Installation de SteamCMD (une seule fois) ---------------------------------------------------
  async ensure() {
    if (this.ready()) return true
    const url = URLS[process.platform]
    if (!url) throw new Error('Système non pris en charge')
    this.setup = { state: 'working', message: 'Téléchargement de SteamCMD…' }
    this.push(true)
    try {
      fs.mkdirSync(this.dir, { recursive: true })
      const res = await fetch(url)
      if (!res.ok) throw new Error('Serveur Valve : ' + res.status)
      const archive = this._file(path.basename(url))
      fs.writeFileSync(archive, Buffer.from(await res.arrayBuffer()))
      await new Promise((ok, ko) => execFile('tar', ['-xf', archive, '-C', this.dir], (e) => (e ? ko(e) : ok())))
      fs.rmSync(archive, { force: true })
      if (process.platform !== 'win32') fs.chmodSync(this.exe(), 0o755)
      if (!this.ready()) throw new Error('Archive SteamCMD inattendue')
      this.setup = { state: 'idle', message: '' }
      this.push(true)
      return true
    } catch (e) {
      this.setup = { state: 'error', message: 'Installation de SteamCMD impossible : ' + String(e.message || e).slice(0, 120) }
      this.push(true)
      return false
    }
  }

  _spawn() {
    const p = spawn(this.exe(), [], { cwd: this.dir, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
    p.stdin.on('error', () => {})
    return p
  }
  _kill(p) {
    if (!p || p.killed) return
    if (process.platform === 'win32') execFile('taskkill', ['/pid', String(p.pid), '/T', '/F'], () => {})
    else p.kill('SIGTERM')
  }

  // --- Connexion au compte Steam ---------------------------------------------------------------------
  async login(user, password) {
    if (!USER.test(String(user)) || typeof password !== 'string' || !password || /[\r\n]/.test(password)) {
      this.auth = { state: 'error', message: 'Nom de compte ou mot de passe invalide.' }
      this.push(true)
      return
    }
    if (!(await this.ensure())) return
    this._kill(this.loginProc)
    this.auth = { state: 'working', message: 'Connexion à Steam…' }
    this.push(true)
    const p = (this.loginProc = this._spawn())
    let buf = ''
    let finished = false
    const end = (state, message) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      this.auth = { state, message }
      if (state === 'ok') (this.account = user), this._save()
      this.push(true)
      try { p.stdin.write('quit\n') } catch { /* déjà fermé */ }
      setTimeout(() => this._kill(p), 1500)
    }
    const timer = setTimeout(() => end('error', 'Steam ne répond pas : réessaie.'), 180000)
    const onData = (d) => {
      buf = (buf + d.toString()).slice(-2000)
      if (/Logged in OK|Waiting for user info\.\.\.OK/i.test(buf)) return end('ok', '')
      if (/FAILED|Login Failure|Invalid Password|Rate Limit/i.test(buf) && !/Steam Guard code|Two-factor code/i.test(buf.split(/FAILED|Login Failure/).pop() || '')) {
        return end('error', explain(buf))
      }
      if (/Steam Guard code|Two-factor code|Enter the current code/i.test(buf) && this.auth.state !== 'code') {
        this.auth = { state: 'code', message: /email/i.test(buf) ? 'Un code vient d’être envoyé à ton e-mail Steam.' : 'Saisis le code de ton application Steam Guard.' }
        buf = ''
        this.push(true)
      } else if (/confirm the login in the Steam Mobile app/i.test(buf) && this.auth.state !== 'confirm') {
        this.auth = { state: 'confirm', message: 'Confirme la connexion dans l’application Steam sur ton téléphone.' }
        this.push(true)
      }
    }
    p.stdout.on('data', onData)
    p.stderr.on('data', onData)
    p.on('close', () => end(this.auth.state === 'ok' ? 'ok' : 'error', 'Connexion interrompue.'))
    p.stdin.write(`login ${user} ${password}\n`)
  }
  submitCode(code) {
    if (this.auth.state !== 'code' || !/^[A-Za-z0-9]{4,8}$/.test(String(code))) return false
    this.auth = { state: 'working', message: 'Vérification du code…' }
    this.push(true)
    this.loginProc?.stdin.write(String(code).toUpperCase() + '\n')
    return true
  }
  cancelLogin() {
    this._kill(this.loginProc)
    this.auth = { state: 'idle', message: '' }
    this.push(true)
  }
  logout() {
    for (const j of this.jobs.values()) this._stop(j, 'paused')
    this.account = null
    this.auth = { state: 'idle', message: '' }
    try { fs.rmSync(path.join(this.dir, 'config', 'config.vdf'), { force: true }) } catch { /* rien à effacer */ }
    this._save()
    this.push(true)
  }

  // --- Téléchargements -----------------------------------------------------------------------------
  _target(name, id) {
    const libs = this.libraries()
    const lib = libs.find((l) => { try { fs.accessSync(l, fs.constants.W_OK); return true } catch { return false } })
    const folder = safeName(name, id)
    return { lib: lib || null, dir: lib ? path.join(lib, 'common', folder) : path.join(this.dir, 'steamapps', 'common', folder), folder }
  }
  async install(appid, name) {
    if (!APPID.test(String(appid))) return false
    appid = String(appid)
    if (!this.account) {
      this.auth = { state: 'error', message: 'Connecte ton compte Steam pour télécharger.' }
      this.push(true)
      return false
    }
    if (!(await this.ensure())) return false
    const prev = this.jobs.get(appid)
    if (prev && prev.status === 'running') return true
    const t = this._target(name, appid)
    const job = { appid, name: String(name || 'Jeu ' + appid).slice(0, 120), dir: t.dir, lib: t.lib, folder: t.folder, status: 'queued', progress: 0, done: 0, total: 0, speed: 0, message: '', started: Date.now(), proc: null }
    this.jobs.set(appid, job)
    this._pump()
    return true
  }
  resume(appid) {
    const j = this.jobs.get(String(appid))
    if (!j || j.status === 'running' || j.status === 'done') return false
    j.status = 'queued'
    j.message = ''
    this._pump()
    return true
  }
  pause(appid) {
    const j = this.jobs.get(String(appid))
    if (!j) return false
    this._stop(j, 'paused')
    this._pump()
    return true
  }
  cancel(appid) {
    const j = this.jobs.get(String(appid))
    if (!j) return false
    this._stop(j, 'paused')
    this.jobs.delete(String(appid))
    this._save()
    this.push(true)
    this._pump()
    return true
  }
  _stop(j, status) {
    if (j.status === 'done') return
    j.userStop = true
    j.status = status
    j.speed = 0
    this._kill(j.proc)
    this._save()
    this.push(true)
  }
  // Un seul téléchargement à la fois : les autres attendent leur tour.
  _pump() {
    if ([...this.jobs.values()].some((j) => j.status === 'running')) return this.push(true)
    const next = [...this.jobs.values()].find((j) => j.status === 'queued')
    if (next) this._run(next)
    this.push(true)
  }
  _run(job) {
    job.status = 'running'
    job.userStop = false
    job.message = ''
    job.speed = 0
    let last = { t: Date.now(), b: job.done }
    fs.mkdirSync(job.dir, { recursive: true })
    const p = (job.proc = this._spawn())
    let tail = ''
    let ok = false
    let err = ''
    const onData = (d) => {
      for (const line of d.toString().split(/[\r\n]+/)) {
        tail = (tail + ' ' + line).slice(-1500)
        const m = line.match(PROGRESS)
        if (m) {
          job.phase = /verif/i.test(m[1]) ? 'verifying' : /commit|stag/i.test(m[1]) ? 'finishing' : 'downloading'
          if (job.phase === 'verifying') job.verify = Math.min(1, Number(m[2]) / 100) // la vérification repart de 0 % : elle ne fait pas reculer le téléchargement
          else {
            job.progress = Math.min(1, Number(m[2]) / 100)
            job.done = Number(m[3])
            job.total = Number(m[4])
          }
          const t = Date.now()
          if (t - last.t >= 1000) {
            const inst = Math.max(0, (job.done - last.b) / ((t - last.t) / 1000))
            job.speed = job.speed ? job.speed * 0.6 + inst * 0.4 : inst
            last = { t, b: job.done }
          }
          this.push()
        }
      }
      // Le message final peut être coupé entre deux paquets : on le cherche dans la fin cumulée de la sortie.
      if (!ok && /Success! App '\d+' fully installed/i.test(tail)) (ok = true), quit()
      else if (!err) {
        const e = tail.match(/(ERROR! Failed to install app[^\[]*|Login Failure[^\[]*|FAILED \([^)]*\)|Cached credentials not found[^\[]*|Invalid Password)/i)
        if (e) (err = e[1]), quit()
      }
    }
    p.stdout.on('data', onData)
    p.stderr.on('data', onData)
    p.on('close', () => {
      job.proc = null
      job.speed = 0
      if (job.userStop) return // pause ou annulation voulue
      if (ok) {
        job.status = 'done'
        job.progress = 1
        this._finalize(job)
      } else {
        job.status = 'error'
        job.message = explain(err || tail)
      }
      this._save()
      this.push(true)
      this.emit(ok ? 'done' : 'failed', job)
      this._pump()
    })
    const w = (s) => { try { p.stdin.write(s + '\n') } catch { /* processus arrêté */ } }
    // « quit » n'est envoyé qu'une fois le jeu installé (ou en échec) : en mode interactif, il couperait le téléchargement.
    const quit = () => { w('quit'); setTimeout(() => this._kill(p), 4000) }
    w(`force_install_dir "${job.dir}"`)
    w(this.account === 'anonymous' ? 'login anonymous' : `login ${this.account}`)
    w(`app_update ${job.appid} validate`)
    this._save()
  }
  // Steam reconnaît le jeu comme installé quand son fichier appmanifest est dans le dossier de la bibliothèque.
  _finalize(job) {
    if (!job.lib) return
    try {
      const src = path.join(job.dir, 'steamapps', `appmanifest_${job.appid}.acf`)
      let text = fs.readFileSync(src, 'utf8')
      text = text.replace(/("installdir"\s+)"[^"]*"/i, `$1"${job.folder.replace(/\\/g, '\\\\')}"`)
      fs.writeFileSync(path.join(job.lib, `appmanifest_${job.appid}.acf`), text)
    } catch { /* manifeste absent : le jeu reste installé dans son dossier */ }
  }
  shutdown() {
    for (const j of this.jobs.values()) if (j.status === 'running') this._stop(j, 'paused')
    this._kill(this.loginProc)
  }
}

module.exports = { SteamCmd, explain, safeName }
