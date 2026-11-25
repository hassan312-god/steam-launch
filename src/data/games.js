// Catalogue réel : données issues de l'API publique du magasin Steam (voir scripts/fetch-steam.mjs).
// Aucune donnée inventée : la seule chose propre à l'utilisateur est sa bibliothèque et ses favoris (enregistrés localement).
import { reactive, computed } from 'vue'
import catalog from './catalog.json'
import lists from './lists.json'

const has = (g, ...k) => k.some((x) => g.genres.includes(x))
const moodsOf = (g) => {
  const m = []
  if (has(g, 'Action', 'Course automobile', 'Sport')) m.push('adr')
  if (has(g, 'Indépendant', 'Simulation', 'Occasionnel')) m.push('chill')
  if (has(g, 'RPG', 'Aventure')) m.push('hist')
  if (g.cats.some((c) => /Coopération|Multijoueur/.test(c))) m.push('potes')
  return m.length ? m : ['chill']
}
const priceNum = (p) => (p === 'Gratuit' || !p ? 0 : Number(p.replace(/[^\d,]/g, '').replace(',', '.')) || 0)

const KEY = 'ga-library'
let saved = { library: [], fav: [] }
try {
  saved = { ...saved, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
} catch {
  /* stockage indisponible */
}

// On écarte les logiciels (le catalogue Steam en contient) : seuls les vrais jeux restent.
const SOFT = ['Utilitaires', 'Production audio', 'Production vidéo', 'Conception et illustration', 'Retouche photo', 'Développement de logiciels', 'Formation', 'Modélisation et animation', 'Enregistrement audio', 'Création de jeux vidéo']
export const games = catalog.filter((c) => !c.genres.some((x) => SOFT.includes(x))).map((c) =>
  reactive({
    ...c,
    slug: c.id,
    moods: moodsOf(c),
    num: priceNum(c.price),
    owned: saved.library.includes(c.id),
    fav: saved.fav.includes(c.id),
    sizeGo: c.size || null,
  }),
)
export const byId = Object.fromEntries(games.map((g) => [g.id, g]))
export const bySlug = byId

// Ordre d'ajout conservé : la bibliothèque est une liste.
const order = reactive([...saved.library.filter((id) => byId[id])])
export const myGames = computed(() => order.map((id) => byId[id]))
export const storeGames = computed(() => games.filter((g) => !g.owned))

export function saveLibrary() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ library: [...order], fav: games.filter((g) => g.fav).map((g) => g.id) }))
  } catch {
    /* stockage indisponible */
  }
}
export function toggleOwned(g) {
  g.owned = !g.owned
  if (g.owned) order.push(g.id)
  else order.splice(order.indexOf(g.id), 1)
  saveLibrary()
}

const pick = (ids) => ids.map((i) => byId[i]).filter(Boolean)
export const topSellers = pick(lists.top)
export const specials = pick(lists.specials).sort((a, b) => b.discount - a.discount)
export const newReleases = pick(lists.news)
export const topRated = [...games].filter((g) => g.metacritic).sort((a, b) => b.metacritic - a.metacritic).slice(0, 14)
export const freeGames = games.filter((g) => g.free)
export const mostDiscounted = [...games].filter((g) => g.discount > 0).sort((a, b) => b.discount - a.discount)

// Sélection de l'accueil : meilleures ventes, promotions, puis les plus recommandés.
const seen = new Set()
export const homeGames = [...topSellers, ...specials, ...[...games].sort((a, b) => b.recs - a.recs)]
  .filter((g) => (seen.has(g.id) ? false : seen.add(g.id)))
  .slice(0, 12)

export const tagOf = (g) =>
  lists.top.includes(g.id) ? 'MEILLEURE VENTE' : g.discount > 0 ? `EN PROMOTION · -${g.discount} %` : lists.news.includes(g.id) ? 'NOUVEAUTÉ' : g.metacritic >= 85 ? `METACRITIC ${g.metacritic}` : 'À LA UNE'

export const moods = [
  ['tout', 'Tout'],
  ['chill', 'Chill'],
  ['adr', 'Adrénaline'],
  ['hist', 'Une histoire'],
  ['potes', 'Avec des potes'],
]

export const genres = ['Action', 'Aventure', 'RPG', 'Indépendant', 'Simulation', 'Stratégie'].map((label) => {
  const list = games.filter((g) => g.genres.includes(label))
  return { label, count: list.length, game: [...list].sort((a, b) => b.recs - a.recs)[0] }
})

export const fmt = new Intl.NumberFormat('fr-FR')

export const accents = [
  ['Citron', '#B6FF3D'],
  ['Rose', '#FF3D9A'],
  ['Cyan', '#2BD9FF'],
  ['Orange', '#FF7A2F'],
  ['Lavande', '#B79CFF'],
  ['Blanc', '#FFFFFF'],
]

// Fonds de profil : jeux réels du catalogue (si présents).
export const walls = ['1245620', '1086940', '1091500', '1593500'].filter((id) => byId[id]).map((id) => [byId[id].title, id])

// Notifications générées à partir des vraies promotions du magasin.
export const notifications = mostDiscounted.slice(0, 5).map((g) => ({
  id: 'n' + g.id,
  cover: g.cover,
  text: `${g.title} est à -${g.discount} % (${g.price})`,
  when: 'Promotion Steam en cours',
  to: '/jeu/' + g.id,
}))
