// Pont minimal et sûr entre le launcher (page web) et l'application de bureau : uniquement des actions Steam précises.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('launcher', {
  isDesktop: true,
  platform: process.platform,
  scan: () => ipcRenderer.invoke('steam:scan'),
  install: (id) => ipcRenderer.invoke('steam:install', String(id)),
  play: (id) => ipcRenderer.invoke('steam:play', String(id)),
  uninstall: (id) => ipcRenderer.invoke('steam:uninstall', String(id)),
  showFolder: (id) => ipcRenderer.invoke('steam:folder', String(id)),
  onState: (cb) => {
    const fn = (_e, state) => cb(state)
    ipcRenderer.on('steam:state', fn)
    return () => ipcRenderer.removeListener('steam:state', fn)
  },
})
