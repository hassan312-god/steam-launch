// Catalogue réel : données issues de l'API publique du magasin Steam (voir scripts/fetch-steam.mjs).
import catalog from './catalog.json'

const cat = Object.fromEntries(catalog.map((g) => [g.id, g]))

// Bibliothèque de Hassan : id -> [heures, progression %, installé, favori, étiquette d'accueil]
const library = {
  1245620: [142, 68, true, true, 'REPRENDRE · CHAPITRE 6'],
  1086940: [167, 84, true, true, 'AWA JOUE EN CE MOMENT'],
  1551360: [38, 31, true, false, 'DOUBLE XP CE SOIR'],
  413150: [96, 71, true, true, 'TA RÉCOLTE EST PRÊTE'],
  1593500: [54, 96, true, true, 'PLUS QUE 2 SUCCÈS'],
  367520: [31, 47, true, false, 'NOUVELLE ZONE DÉBLOQUÉE'],
  1145360: [73, 88, true, true, 'ÉVASION NUMÉRO 61'],
  1091500: [88, 76, true, false, 'MISE À JOUR DISPONIBLE'],
  292030: [120, 92, true, true, 'REPRENDRE · SKELLIGE'],
  892970: [47, 52, true, false, 'ÉVÉNEMENT DE SAISON'],
  504230: [12, 28, true, false, 'REPRENDRE · CHAPITRE 4'],
  105600: [210, 64, true, false, 'MONDE EXPERT DISPONIBLE'],
  1174180: [18, 22, false, false, 'REPRENDRE'],
  646570: [64, 58, false, true, 'REPRENDRE'],
  1426210: [14, 100, false, false, 'TERMINÉ'],
  548430: [41, 45, false, false, 'REPRENDRE'],
  782330: [26, 80, false, false, 'REPRENDRE'],
  1868140: [22, 40, false, false, 'REPRENDRE'],
  2379780: [33, 35, false, true, 'REPRENDRE'],
  1332010: [9, 100, false, false, 'TERMINÉ'],
  1794680: [27, 60, false, false, 'REPRENDRE'],
  1190460: [3, 4, false, false, 'REPRENDRE'],
  2358720: [0, 0, false, false, 'À INSTALLER'],
  2050650: [0, 0, false, false, 'À INSTALLER'],
}

const has = (g, ...k) => k.some((x) => g.genres.includes(x))
const moodsOf = (g) => {
  const m = []
  if (has(g, 'Action', 'Course automobile', 'Sport')) m.push('adr')
  if (has(g, 'Indépendant', 'Simulation', 'Occasionnel')) m.push('chill')
  if (has(g, 'RPG', 'Aventure')) m.push('hist')
  if (g.cats.some((c) => /Coopération|Multijoueur/.test(c))) m.push('potes')
  return m.length ? m : ['chill']
}

const build = (c) => {
  const lib = library[c.id]
  const [h, p, installed, fav, tag] = lib ?? [0, 0, false, false, 'À DÉCOUVRIR']
  return {
    ...c,
    slug: c.id,
    owned: !!lib,
    hours: h,
    time: h + ' h',
    progress: p,
    installed,
    fav,
    tag,
    trophy: c.ach[0]?.name ?? 'Premier succès',
    moods: moodsOf(c),
    state: !lib ? 'MAGASIN' : installed ? 'INSTALLÉ' : 'CLOUD',
    discount: c.discount,
    tags: [...c.genres.filter((x) => x !== 'Accès anticipé' && x !== 'Free-to-play'), ...(c.cats.includes('Coopération') ? ['Coop'] : []), c.cats.includes('Multijoueur') ? 'Multijoueur' : 'Solo'].slice(0, 5),
    gotAch: Math.round((c.total * p) / 100),
    sizeGo: c.size || null,
  }
}

export const games = catalog.map(build)
export const byId = Object.fromEntries(games.map((g) => [g.id, g]))
export const bySlug = byId
export const myGames = games.filter((g) => g.owned)
export const storeGames = games.filter((g) => !g.owned)

// Jeux mis en avant sur l'accueil.
export const homeGameIds = ['1245620', '1086940', '1551360', '413150', '1593500', '367520', '1145360', '1091500']

export const moods = [
  ['tout', 'Tout'],
  ['chill', 'Chill'],
  ['adr', 'Adrénaline'],
  ['hist', 'Une histoire'],
  ['potes', 'Avec des potes'],
]

export const weekHours = [1.5, 2.2, 0.8, 3.1, 2.6, 4.0, 0.2]

const radarMeta = [
  ['2215430', 94, 'Même sens de l’aventure qu’Elden Ring'],
  ['1627720', 91, 'Tu aimes les défis exigeants'],
  ['1817070', 87, 'Action et histoire, comme God of War'],
  ['1623730', 82, 'Joué par Awa'],
  ['1716740', 79, 'Exploration comme Baldur’s Gate 3'],
  ['2054970', 74, 'Un RPG de plus pour ta liste'],
]
export const radar = radarMeta.map(([id, match, why]) => ({ game: byId[id], match, why }))

export const genres = [
  ['Action', '782330'],
  ['Aventure', '1332010'],
  ['RPG', '1086940'],
  ['Indépendant', '504230'],
  ['Simulation', '413150'],
  ['Stratégie', '289070'],
].map(([label, id]) => ({ label, game: byId[id] }))

export const friends = [
  { ini: 'AM', name: 'Awa', status: 'Baldur’s Gate 3', col: '#9FE2BF', online: true, playing: '1086940' },
  { ini: 'LS', name: 'Lina', status: 'Forza Horizon 5', col: '#FF8FB3', online: true, playing: '1551360' },
  { ini: 'KD', name: 'Karim', status: 'En ligne', col: '#FFC857', online: true },
  { ini: 'OB', name: 'Omar', status: 'Absent', col: '#8AB4FF', away: true },
  { ini: 'FN', name: 'Fatou', status: 'Hier', col: '#C8C9D2' },
  { ini: 'YT', name: 'Yanis', status: 'Il y a 3 j', col: '#E0A3FF' },
  { ini: 'MS', name: 'Moussa', status: 'Il y a 5 j', col: '#FFB86B' },
]

export const compat = [
  { ini: 'AM', name: 'Awa', pct: 92, col: '#9FE2BF', shared: '6 jeux en commun · RPG' },
  { ini: 'LS', name: 'Lina', pct: 81, col: '#FF8FB3', shared: '4 jeux en commun · Course' },
  { ini: 'KD', name: 'Karim', pct: 67, col: '#FFC857', shared: '3 jeux en commun · Action' },
]

export const feed = [
  { ini: 'LS', col: '#FF8FB3', who: 'Lina', what: 'a battu ton record sur Forza Horizon 5 (1:42.08)', when: 'Il y a 12 min', id: '1551360' },
  { ini: 'KD', col: '#FFC857', who: 'Karim', what: 'a acheté Elden Ring — ton jeu n°1', when: 'Il y a 2 h', id: '1245620' },
  { ini: 'AM', col: '#9FE2BF', who: 'Awa', what: 'a terminé l’acte 2 de Baldur’s Gate 3', when: 'Hier', id: '1086940' },
  { ini: 'OB', col: '#8AB4FF', who: 'Omar', what: 'a débloqué un succès dans Hollow Knight', when: 'Il y a 2 jours', id: '367520' },
]

export const accents = [
  ['Citron', '#B6FF3D'],
  ['Rose', '#FF3D9A'],
  ['Cyan', '#2BD9FF'],
  ['Orange', '#FF7A2F'],
  ['Lavande', '#B79CFF'],
  ['Blanc', '#FFFFFF'],
]

export const walls = [
  ['Elden Ring', '1245620'],
  ['Baldur’s Gate 3', '1086940'],
  ['Cyberpunk 2077', '1091500'],
  ['God of War', '1593500'],
]
