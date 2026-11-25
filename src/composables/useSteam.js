import { computed, reactive } from 'vue'
import { applySteam, clearSteam } from '../data/games'
import { theme } from './useTheme'

// Compte Steam connecté (via les fonctions /api/steam/*). Aucun secret ici : la clé API reste sur le serveur.
export const steam = reactive({ status: 'loading', profile: null, gamesVisible: true, count: 0 })

export const displayName = computed(() => steam.profile?.name || theme.username)

export async function loadSteam() {
  steam.status = 'loading'
  try {
    const r = await fetch('/api/steam/me', { credentials: 'same-origin' })
    if (r.status === 401) {
      steam.status = 'out'
      steam.profile = null
      return clearSteam()
    }
    if (r.status === 503) return (steam.status = 'not_configured')
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'erreur')
    steam.profile = d.profile
    steam.gamesVisible = d.gamesVisible
    steam.count = d.games.length
    applySteam(d.games)
    steam.status = 'in'
  } catch {
    // Pas de serveur de fonctions (ou hors ligne) : on reste en mode local.
    steam.status = 'unavailable'
  }
}
