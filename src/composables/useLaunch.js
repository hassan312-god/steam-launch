import { saveLibrary, toggleOwned } from '../data/games'
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

// Si le jeu n'est pas installé, le client Steam propose directement de l'installer.
export function play(game) {
  openSteam(`steam://run/${game.id}`)
  toast(`${game.title} : demande envoyée au client Steam`)
}

export function install(game) {
  openSteam(`steam://install/${game.id}`)
  toast(`Installation de ${game.title} demandée au client Steam`)
}

export function toggleFav(g) {
  g.fav = !g.fav
  saveLibrary()
  toast(g.fav ? `${g.title} ajouté aux favoris` : `${g.title} retiré des favoris`)
}

export function toggleLibrary(g) {
  toggleOwned(g)
  toast(g.owned ? `${g.title} ajouté à ta bibliothèque` : `${g.title} retiré de ta bibliothèque`)
}
