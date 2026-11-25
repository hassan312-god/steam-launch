import { reactive } from 'vue'
import { saveLibrary } from '../data/games'
import { toast } from './useToast'

// État de l'écran de lancement / d'installation (simulés : un site web ne peut pas lancer un vrai jeu).
export const launch = reactive({ game: null, mode: 'play', note: '' })

export const play = (game, note = '') => Object.assign(launch, { game, mode: 'play', note })
export const install = (game) => Object.assign(launch, { game, mode: 'install', note: '' })
export const close = () => (launch.game = null)

export function finish() {
  const g = launch.game
  if (!g) return
  if (launch.mode === 'install') {
    g.installed = true
    g.state = 'INSTALLÉ'
    saveLibrary()
    toast(`${g.title} est installé`)
  } else {
    toast(`${g.title} est en cours d’exécution`)
  }
  launch.game = null
}

export function toggleFav(g) {
  g.fav = !g.fav
  saveLibrary()
  toast(g.fav ? `${g.title} ajouté aux favoris` : `${g.title} retiré des favoris`)
}
