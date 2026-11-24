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

// Fiches détaillées (page « Jeu »)
export const details = {
  'ashfall-odyssey': { studio: 'Cinder & Co', genre: 'Action-aventure', year: 2024, size: 84, price: '39,99 €', desc: 'Traverse un royaume ravagé par les cendres, sur les traces du premier roi. Combats nerveux, choix lourds de conséquences et une bande-son qui te suit jusqu’au bout de la nuit.', tags: ['Aventure', 'Solo', 'Histoire'], total: 48, got: 33, ach: [['Cendres du premier roi', 'Termine le chapitre 5', true], ['Braise vive', 'Enchaîne 20 esquives parfaites', true], ['Le dernier serment', 'Fais le choix du roi', false], ['Forgeron d’âmes', 'Améliore toutes les armes', false]] },
  tidebound: { studio: 'Saltwater Games', genre: 'RPG coopératif', year: 2023, size: 61, price: '34,99 €', desc: 'Une marée qui ne redescend jamais. Monte ton équipage, explore les îles englouties et affronte des raids à 4 sur fond de grandes histoires.', tags: ['Coop', 'RPG', 'Monde ouvert'], total: 60, got: 50, ach: [['Plus haut que la vague', 'Atteins le sommet du phare', true], ['Équipage au complet', 'Recrute 8 compagnons', true], ['Raid sans pitié', 'Termine le raid du chapitre 5', false], ['Cartographe', 'Découvre toutes les îles', true]] },
  'neon-drift': { studio: 'Afterglow', genre: 'Course arcade', year: 2025, size: 28, price: '22,49 €', desc: 'Dérape dans des circuits de néons, bats les records de tes amis et débloque des voitures pensées pour glisser.', tags: ['Course', 'Multi', 'Arcade'], total: 36, got: 11, ach: [['Dérapage parfait', 'Garde un drift 10 secondes', true], ['Néon Est', 'Termine le circuit en moins de 1:45', true], ['Pole position', 'Gagne 10 courses classées', false]] },
  'pale-orchard': { studio: 'Fieldnote', genre: 'Gestion cosy', year: 2022, size: 12, price: '19,99 €', desc: 'Cultive ton verger, prépare tes récoltes d’automne et laisse le temps filer au rythme des saisons.', tags: ['Chill', 'Solo', 'Cozy'], total: 40, got: 28, ach: [['Récolte d’automne', 'Récolte 500 fruits', true], ['Maître confiturier', 'Prépare 30 recettes', true], ['Hiver doux', 'Passe un hiver complet', false]] },
  'saffron-skies': { studio: 'Dune Air', genre: 'Aventure aérienne', year: 2024, size: 47, price: '29,99 €', desc: 'Pilote ton dirigeable au-dessus des dunes, commerce entre les cités et perce les secrets du ciel safran.', tags: ['Aventure', 'Exploration', 'Histoire'], total: 52, got: 50, ach: [['Capitaine des dunes', 'Deviens capitaine de rang 10', true], ['Tempête de sable', 'Traverse une tempête sans atterrir', true], ['Ciel complet', 'Visite toutes les cités', false], ['Collectionneur', 'Réunis toutes les cartes', false]] },
  'iron-hollow': { studio: 'Lampwick', genre: 'Survie', year: 2025, size: 36, price: '24,99 €', desc: 'Descends dans une mine abandonnée avec une seule lampe. Chaque zone débloquée rend la suivante plus dangereuse.', tags: ['Survie', 'Frissons', 'Solo'], total: 30, got: 4, ach: [['Dernière lampe', 'Rallume la lampe de la zone 2', true], ['Sans lumière', 'Survis 5 min dans le noir', false], ['Chef de mine', 'Débloque toutes les zones', false]] },
  glasswing: { studio: 'Prism Hand', genre: 'Plateforme narrative', year: 2023, size: 18, price: '19,99 €', desc: 'Un papillon de cristal, des grottes qui chantent. Avance doucement, écoute, et laisse l’histoire se révéler.', tags: ['Histoire', 'Chill', 'Plateforme'], total: 28, got: 13, ach: [['Ailes de cristal', 'Répare tes deux ailes', true], ['Chant des grottes', 'Réveille les 12 cristaux', false]] },
  'quiet-comet': { studio: 'Lowlight', genre: 'Exploration zen', year: 2022, size: 9, price: '14,99 €', desc: 'Voyage à dos de comète à travers des paysages stellaires. Pas de combat, juste du calme et de la découverte.', tags: ['Chill', 'Exploration', 'Zen'], total: 24, got: 21, ach: [['Passager de la comète', 'Termine le voyage', true], ['Constellations', 'Relie toutes les étoiles', true], ['Nuit blanche', 'Joue 3 h sans pause', false]] },
  frostline: { studio: 'Coldfront', genre: 'Survie', year: 2025, size: 41, price: '24,99 €', desc: 'Le gel avance. Construis, chauffe, tiens bon. Un survival coopératif dans un monde qui se fige.', tags: ['Survie', 'Coop', 'Construction'], total: 32, got: 1, ach: [['Premier givre', 'Allume ton premier feu', true], ['Cabane chaude', 'Construis un abri', false]] },
  'rust-rivet': { studio: 'Bolt & Nut', genre: 'Construction', year: 2024, size: 22, price: '17,49 €', desc: 'Assemble, soude, rivète. Construis des machines absurdes et fais-les marcher.', tags: ['Construction', 'Chill', 'Créatif'], total: 34, got: 0, ach: [['Premier boulon', 'Assemble ta première machine', false], ['Ça roule', 'Fais avancer un véhicule', false]] },
}
