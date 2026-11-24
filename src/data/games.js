const cover = (slug) => `/img/covers/${slug}.jpg`
const wide = (slug) => `/img/wide/${slug}.jpg`

export const games = [
  { id: 'ashfall-odyssey', slug: 'ashfall', title: 'Ashfall Odyssey', time: '42 h', progress: 68, trophy: 'Cendres du premier roi', tag: 'REPRENDRE · CHAPITRE 6', moods: ['adr', 'hist'], state: 'INSTALLÉ', installed: true, fav: true },
  { id: 'tidebound', slug: 'tidebound', title: 'Tidebound', time: '67 h', progress: 84, trophy: 'Plus haut que la vague', tag: 'AWA JOUE EN CE MOMENT', moods: ['hist', 'potes'], state: 'INSTALLÉ', installed: true, fav: true },
  { id: 'neon-drift', slug: 'neon-drift', title: 'Neon Drift', time: '18 h', progress: 31, trophy: 'Dérapage parfait', tag: 'DOUBLE XP CE SOIR', moods: ['adr', 'potes'], state: 'INSTALLÉ', installed: true, fav: false },
  { id: 'pale-orchard', slug: 'pale-orchard', title: 'Pale Orchard', time: '54 h', progress: 71, trophy: 'Récolte d’automne', tag: 'TA RÉCOLTE EST PRÊTE', moods: ['chill'], state: 'INSTALLÉ', installed: true, fav: false },
  { id: 'saffron-skies', slug: 'saffron-skies', title: 'Saffron Skies', time: '125 h', progress: 96, trophy: 'Capitaine des dunes', tag: 'PLUS QUE 2 SUCCÈS', moods: ['chill', 'hist'], state: 'MISE À JOUR', installed: true, fav: true },
  { id: 'iron-hollow', slug: 'iron-hollow', title: 'Iron Hollow', time: '9 h', progress: 12, trophy: 'Dernière lampe', tag: 'NOUVELLE ZONE DÉBLOQUÉE', moods: ['adr'], state: 'INSTALLÉ', installed: true, fav: false },
  { id: 'glasswing', slug: 'glasswing', title: 'Glasswing', time: '21 h', progress: 47, trophy: 'Ailes de cristal', tag: 'REPRENDRE · GROTTE 3', moods: ['chill', 'hist'], state: 'CLOUD', installed: false, fav: false },
  { id: 'quiet-comet', slug: 'quiet-comet', title: 'Quiet Comet', time: '73 h', progress: 88, trophy: 'Passager de la comète', tag: 'MODE ZEN DISPONIBLE', moods: ['chill'], state: 'INSTALLÉ', installed: true, fav: true },
  { id: 'frostline', slug: 'frostline', title: 'Frostline', time: '3 h', progress: 4, trophy: 'Premier givre', tag: 'À DÉCOUVRIR', moods: ['adr'], state: '62 %', installed: false, fav: false },
  { id: 'rust-rivet', slug: 'rust-rivet', title: 'Rust & Rivet', time: '0 h', progress: 0, trophy: 'Premier boulon', tag: 'À DÉCOUVRIR', moods: ['chill'], state: 'CLOUD', installed: false, fav: false },
].map((g) => ({ ...g, cover: cover(g.slug), wide: wide(g.slug) }))

export const byId = Object.fromEntries(games.map((g) => [g.id, g]))
export const bySlug = Object.fromEntries(games.map((g) => [g.slug, g]))

// Jeux mis en avant sur l'accueil (même ordre que la maquette).
export const homeGameIds = ['ashfall-odyssey', 'tidebound', 'neon-drift', 'pale-orchard', 'saffron-skies', 'iron-hollow', 'glasswing', 'quiet-comet']

export const moods = [
  ['tout', 'Tout'],
  ['chill', 'Chill'],
  ['adr', 'Adrénaline'],
  ['hist', 'Une histoire'],
  ['potes', 'Avec des potes'],
]

export const weekHours = [1.5, 2.2, 0.8, 3.1, 2.6, 4.0, 0.2]

export const radar = [
  { title: 'Tidebound II', slug: 'tidebound', match: 94, why: 'Suite de ton jeu préféré', price: 'Précommande', off: '' },
  { title: 'Quiet Comet', slug: 'quiet-comet', match: 91, why: 'Ambiance chill', price: '5,99 €', off: '-60 %' },
  { title: 'Rust & Rivet', slug: 'rust-rivet', match: 87, why: 'Tu aimes construire', price: '17,49 €', off: '-30 %' },
  { title: 'Frostline', slug: 'frostline', match: 82, why: 'Survie, comme Iron Hollow', price: '24,99 €', off: '' },
  { title: 'Ashfall: Embers', slug: 'ashfall', match: 79, why: 'Extension d’Ashfall', price: '14,99 €', off: '' },
  { title: 'Pale Orchard+', slug: 'pale-orchard', match: 74, why: 'Joué par Awa', price: '9,99 €', off: '-20 %' },
]

export const genres = [
  { label: 'Adrénaline', slug: 'ashfall' },
  { label: 'Grandes histoires', slug: 'glasswing' },
  { label: 'Course', slug: 'neon-drift' },
  { label: 'Frissons', slug: 'iron-hollow' },
  { label: 'Chill & cozy', slug: 'pale-orchard' },
  { label: 'Exploration', slug: 'quiet-comet' },
]

export const friends = [
  { ini: 'AM', name: 'Awa', status: 'Tidebound', col: '#9FE2BF', online: true, playing: 'tidebound' },
  { ini: 'LS', name: 'Lina', status: 'Neon Drift', col: '#FF8FB3', online: true, playing: 'neon-drift' },
  { ini: 'KD', name: 'Karim', status: 'En ligne', col: '#FFC857', online: true },
  { ini: 'OB', name: 'Omar', status: 'Absent', col: '#8AB4FF', away: true },
  { ini: 'FN', name: 'Fatou', status: 'Hier', col: '#C8C9D2' },
  { ini: 'YT', name: 'Yanis', status: 'Il y a 3 j', col: '#E0A3FF' },
  { ini: 'MS', name: 'Moussa', status: 'Il y a 5 j', col: '#FFB86B' },
]

export const compat = [
  { ini: 'AM', name: 'Awa', pct: 92, col: '#9FE2BF', shared: '6 jeux en commun · Aventure' },
  { ini: 'LS', name: 'Lina', pct: 81, col: '#FF8FB3', shared: '4 jeux en commun · Course' },
  { ini: 'KD', name: 'Karim', pct: 67, col: '#FFC857', shared: '3 jeux en commun · RPG' },
]

export const feed = [
  { ini: 'LS', col: '#FF8FB3', who: 'Lina', what: 'a battu ton record sur le circuit Néon Est (1:42.08)', when: 'Il y a 12 min', slug: 'neon-drift' },
  { ini: 'KD', col: '#FFC857', who: 'Karim', what: 'a acheté Saffron Skies — ton jeu n°1', when: 'Il y a 2 h', slug: 'saffron-skies' },
  { ini: 'AM', col: '#9FE2BF', who: 'Awa', what: 'a terminé le chapitre 4 de Tidebound', when: 'Hier', slug: 'tidebound' },
  { ini: 'OB', col: '#8AB4FF', who: 'Omar', what: 'a débloqué « Dernière lampe » dans Iron Hollow', when: 'Il y a 2 jours', slug: 'iron-hollow' },
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
  ['Ashfall', 'ashfall'],
  ['Tidebound', 'tidebound'],
  ['Neon Drift', 'neon-drift'],
  ['Quiet Comet', 'quiet-comet'],
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
