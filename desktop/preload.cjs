// Pont minimal et sûr entre le launcher (page web) et l'application de bureau : uniquement des actions Steam précises.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('launcher', {
  isDesktop: true,
  platform: process.platform,
  scan: () => ipcRenderer.invoke('steam:scan'),
  install: (id) => ipcRenderer.invoke('steam:install', String(id)),
  play: (id) => ipcRenderer.invoke('steam:play', String(id)),
  openDownloads: () => ipcRenderer.invoke('steam:downloads'),
  uninstall: (id) => ipcRenderer.invoke('steam:uninstall', String(id)),
  showFolder: (id) => ipcRenderer.invoke('steam:folder', String(id)),
  version: () => ipcRenderer.invoke('app:version'),
  update: {
    get: () => ipcRenderer.invoke('updater:get'),
    check: () => ipcRenderer.invoke('updater:check'),
    install: () => ipcRenderer.invoke('updater:install'),
    onState: (cb) => {
      const fn = (_e, st) => cb(st)
      ipcRenderer.on('updater:state', fn)
      return () => ipcRenderer.removeListener('updater:state', fn)
    },
  },
  notify: (title, body, route) => ipcRenderer.invoke('notify', { title, body, route }),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  onNavigate: (cb) => {
    const fn = (_e, route) => cb(route)
    ipcRenderer.on('navigate', fn)
    return () => ipcRenderer.removeListener('navigate', fn)
  },
  cmd: {
    state: () => ipcRenderer.invoke('steamcmd:state'),
    suggest: () => ipcRenderer.invoke('steamcmd:suggest'),
    login: (user, password) => ipcRenderer.invoke('steamcmd:login', { user: String(user), password: String(password) }),
    code: (code) => ipcRenderer.invoke('steamcmd:code', String(code)),
    cancelLogin: () => ipcRenderer.invoke('steamcmd:cancel-login'),
    logout: () => ipcRenderer.invoke('steamcmd:logout'),
    install: (appid, name) => ipcRenderer.invoke('steamcmd:install', { appid: String(appid), name: String(name || '') }),
    pause: (id) => ipcRenderer.invoke('steamcmd:pause', String(id)),
    resume: (id) => ipcRenderer.invoke('steamcmd:resume', String(id)),
    cancel: (id) => ipcRenderer.invoke('steamcmd:cancel', String(id)),
    onState: (cb) => {
      const fn = (_e, st) => cb(st)
      ipcRenderer.on('steamcmd:state', fn)
      return () => ipcRenderer.removeListener('steamcmd:state', fn)
    },
  },
  onState: (cb) => {
    const fn = (_e, state) => cb(state)
    ipcRenderer.on('steam:state', fn)
    return () => ipcRenderer.removeListener('steam:state', fn)
  },
})
