import { saveLibrary, toggleOwned } from '../data/games'
import { toast } from './useToast'

// Ouvre le jeu dans Steam via le protocole steam:// (fonctionne si Steam est installé sur l'appareil).
export function play(game) {
  toast(`Ouverture de ${game.title} dans Steam…`)
  window.location.href = `steam://run/${game.id}`
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
