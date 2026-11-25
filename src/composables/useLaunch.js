import { saveLibrary, toggleOwned } from '../data/games'
import { desktop } from './useDesktop'
import { toast } from './useToast'

// Déclenche le client Steam installé sur l'appareil (protocole steam://) SANS quitter le launcher :
// l'URL est chargée dans un iframe invisible, la page courante ne bouge pas.
function openSteam(url) {
  const f = document.createElement('iframe')
  f.style.display = 'none'
  f.src = url
  document.body.appendChild(f)
  setTimeout(() => f.remove(), 3000)
}

// Application de bureau : le launcher pilote directement le client Steam et suit l'état réel.
// Navigateur : on déclenche le client Steam via l'iframe invisible ci-dessus.
export function play(game) {
  if (desktop.available) window.launcher.play(game.id)
  else openSteam(`steam://run/${game.id}`)
  toast(`Lancement de ${game.title}…`)
}

export function install(game) {
  // Par défaut : le client Steam déjà connecté (aucun mot de passe). Si l'utilisateur a connecté son compte au téléchargement
  // intégré (facultatif, page Téléchargements), le launcher télécharge lui-même avec pause et reprise.
  if (desktop.available && desktop.canCmd && desktop.cmd.account) {
    window.launcher.cmd.install(game.id, game.title)
    toast(`Téléchargement de ${game.title} lancé`)
    return
  }
  if (desktop.available) window.launcher.install(game.id)
  else openSteam(`steam://install/${game.id}`)
  toast(desktop.available ? `${game.title} : demande envoyée à ton client Steam` : `Installation de ${game.title} demandée au client Steam`)
}

// Repli : confier l'installation au client Steam (ouvre sa fenêtre).
export function installWithSteamClient(game) {
  if (desktop.available) window.launcher.install(game.id)
  else openSteam(`steam://install/${game.id}`)
}

export function uninstall(game) {
  if (desktop.available) window.launcher.uninstall(game.id)
  toast(`Désinstallation de ${game.title} demandée`)
}

export const showFolder = (game) => desktop.available && window.launcher.showFolder(game.id)

export function toggleFav(g) {
  g.fav = !g.fav
  saveLibrary()
  toast(g.fav ? `${g.title} ajouté aux favoris` : `${g.title} retiré des favoris`)
}

export function toggleLibrary(g) {
  toggleOwned(g)
  toast(g.owned ? `${g.title} ajouté à ta bibliothèque` : `${g.title} retiré de ta bibliothèque`)
}
