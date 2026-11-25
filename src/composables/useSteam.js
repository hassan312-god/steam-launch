import { computed, reactive } from 'vue'
import { applySteam, clearSteam } from '../data/games'
import { theme } from './useTheme'
import { toast } from './useToast'

// Compte Steam connecté (via les fonctions /api/steam/*). Aucun secret ici : la clé API reste sur le serveur.
export const steam = reactive({ status: 'loading', profile: null, gamesVisible: true, count: 0 })

export const displayName = computed(() => steam.profile?.name || theme.username)

export async function loadSteam() {
  steam.status = 'loading'
  try {
    const r = await fetch('/api/steam/me', { credentials: 'same-origin' })
    const d = r.status === 503 ? null : await r.json()
    if (d?.loggedIn === false) {
      steam.status = 'out'
      steam.profile = null
      return clearSteam()
    }
    if (r.status === 503) return (steam.status = 'not_configured')
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

// Connexion dans une fenêtre popup : le launcher reste ouvert et se met à jour à la fermeture.
export function connectSteam() {
  const w = 520, h = 720
  const left = Math.round(window.screenX + (window.outerWidth - w) / 2)
  const top = Math.round(window.screenY + (window.outerHeight - h) / 2)
  const win = window.open('/api/steam/login?popup=1', 'ga-steam-login', `popup=yes,width=${w},height=${h},left=${left},top=${top}`)
  if (!win) return (window.location.href = '/api/steam/login') // popup bloquée : redirection classique

  let done = false
  const finish = async (announce) => {
    if (done) return
    done = true
    window.removeEventListener('message', onMsg)
    clearInterval(timer)
    await loadSteam()
    if (announce && steam.status === 'in') toast(`Connecté à Steam : ${steam.count} jeu${steam.count > 1 ? 'x' : ''} synchronisé${steam.count > 1 ? 's' : ''}`)
    else if (announce) toast('Connexion Steam non terminée', 'warn')
  }
  const onMsg = (e) => e.origin === window.location.origin && e.data?.type === 'ga-steam' && finish(true)
  window.addEventListener('message', onMsg)
  // Si l'utilisateur ferme la fenêtre à la main, on vérifie quand même l'état de la session.
  const timer = setInterval(() => win.closed && finish(true), 600)
}

export async function disconnectSteam() {
  await fetch('/api/steam/logout?json=1', { credentials: 'same-origin' })
  await loadSteam()
  toast('Déconnecté de Steam')
}
