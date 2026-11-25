// Normalise la réponse de l'API publique du magasin Steam (appdetails) vers la forme utilisée par le launcher.
// Partagé entre le script de catalogue (scripts/fetch-steam.mjs) et les fonctions Netlify.
const CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps'

export const strip = (h = '') => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()

const exists = async (u) => {
  try {
    return (await fetch(u, { method: 'HEAD' })).ok
  } catch {
    return false
  }
}

// Configuration requise : <li><strong>Libellé :</strong> valeur</li> devient { rows: [[libellé, valeur], …], note }.
export function parseReq(html = '') {
  const rows = []
  let note = ''
  for (const m of html.matchAll(/<li>(.*?)<\/li>/gs)) {
    const li = m[1]
    const lab = li.match(/<strong>(.*?)<\/strong>/s)
    const label = lab ? strip(lab[1]).replace(/\s*:\s*$/, '') : ''
    const value = strip(li.replace(/<strong>.*?<\/strong>/s, ''))
    if (label && value) rows.push([label, value])
    else if (!label && value) note = value
  }
  return rows.length || note ? { rows, note } : null
}

export async function fetchApp(id) {
  const r = await fetch(`https://store.steampowered.com/api/appdetails?appids=${id}&l=french&cc=fr`)
  const j = (await r.json())?.[id]
  return j?.success ? j.data : null
}

export async function normalizeApp(d, id = d.steam_appid) {
  id = String(id)
  const cover = `${CDN}/${id}/library_600x900.jpg`
  const hero = `${CDN}/${id}/library_hero.jpg`
  const logo = `${CDN}/${id}/logo.png`
  const [hasCover, hasHero, hasLogo] = await Promise.all([exists(cover), exists(hero), exists(logo)])
  const header = d.header_image.split('?')[0]
  const shots = (d.screenshots || []).slice(0, 10).map((s) => s.path_full.split('?')[0])
  return {
    id,
    kind: d.type || 'game', // game | dlc | music | demo …
    parent: d.fullgame?.appid ? { id: String(d.fullgame.appid), name: d.fullgame.name } : null,
    title: d.name,
    cover: hasCover ? cover : header,
    wide: hasHero ? hero : shots[0] || header,
    header,
    logo: hasLogo ? logo : null,
    desc: strip(d.short_description),
    studio: (d.developers || [])[0] || '',
    genres: (d.genres || []).map((x) => x.description),
    cats: (d.categories || []).map((x) => x.description),
    year: d.release_date?.date || '',
    free: !!d.is_free,
    price: d.is_free ? 'Gratuit' : d.price_overview?.final_formatted || '',
    discount: d.price_overview?.discount_percent || 0,
    metacritic: d.metacritic?.score || null,
    total: d.achievements?.total || 0,
    ach: (d.achievements?.highlighted || []).slice(0, 6).map((a) => ({ name: a.name, icon: a.path.split('?')[0] })),
    shots,
    movies: (d.movies || []).slice(0, 3).map((m) => ({ name: strip(m.name), thumb: m.thumbnail.split('?')[0], hls: m.hls_h264 || null })).filter((m) => m.hls),
    req: { min: parseReq(d.pc_requirements?.minimum), rec: parseReq(d.pc_requirements?.recommended) },
    recs: d.recommendations?.total || 0,
    size: Number((strip(d.pc_requirements?.minimum || '').match(/(?:Espace disque|Stockage|Storage|Hard Drive)[^0-9]*(\d+)\s*(?:GB|Go)/i) || [])[1]) || null,
  }
}

// ---------------------------------------------------------------------------------------------------
// Fiche complète (style page Steam) : description longue, éditions, DLC, langues, annonces, évaluations…
// Tout est converti en texte brut / données structurées : aucun HTML venant de Steam n'est injecté dans la page.
const money = (cents, cur = 'EUR') => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: cur })

// HTML Steam -> blocs { t: 'h' | 'p' | 'li', text }
export function htmlToBlocks(html = '') {
  const out = []
  const clean = (x) => strip(x.replace(/<br\s*\/?>/gi, ' ')).replace(/\s+/g, ' ').trim()
  const re = /<(h[1-6]|li|p)[^>]*>(.*?)<\/\1>|<br\s*\/?>/gis
  let last = 0
  const pushLoose = (chunk) => {
    for (const part of chunk.split(/<br\s*\/?>/i)) {
      const t = clean(part)
      if (t) out.push({ t: 'p', text: t })
    }
  }
  for (const m of html.matchAll(/<(h[1-6]|li)[^>]*>(.*?)<\/\1>/gis)) {
    pushLoose(html.slice(last, m.index).replace(/<\/?(ul|ol|p|div|span|strong|em|b|i|a)[^>]*>/gi, ' '))
    const t = clean(m[2])
    if (t) out.push({ t: m[1].toLowerCase() === 'li' ? 'li' : 'h', text: t })
    last = m.index + m[0].length
  }
  pushLoose(html.slice(last).replace(/<\/?(ul|ol|p|div|span|strong|em|b|i|a)[^>]*>/gi, ' '))
  return out.slice(0, 60)
}

// "Tchèque, Anglais<strong>*</strong>, Français" -> [{ name, audio }]
export function parseLanguages(html = '') {
  const body = html.split(/<br\s*\/?>/i)[0]
  return body
    .split(',')
    .map((x) => ({ name: strip(x).replace(/\*/g, '').trim(), audio: /<strong>\*<\/strong>/.test(x) }))
    .filter((x) => x.name)
}

const REVIEW_LABEL = (pct, n) => {
  if (n === 0) return ''
  if (pct >= 95 && n >= 500) return 'Extrêmement positives'
  if (pct >= 80 && n >= 50) return 'Très positives'
  if (pct >= 80) return 'Positives'
  if (pct >= 70) return 'Plutôt positives'
  if (pct >= 40) return 'Mitigées'
  if (pct >= 20) return 'Plutôt négatives'
  return n >= 500 ? 'Extrêmement négatives' : 'Très négatives'
}

async function getJson(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(String(r.status))
  return r.json()
}

// Texte d'annonce : BBCode / balises retirés ; `paragraphs` garde les sauts de ligne pour la lecture dans le launcher.
function newsText(raw = '', paragraphs = false) {
  const t = raw.replace(/\[\/?(p|\*|list|h\d|b|i|u|url|img|previewyoutube|quote|code)[^\]]*\]/gi, paragraphs ? '\n' : ' ').replace(/\[[^\]]*\]/g, ' ').replace(/\{[A-Z_]+\}\S*/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/[\\*#]+/g, ' ')
  return paragraphs ? t.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n') : t.replace(/\s+/g, ' ').trim()
}

export async function normalizeFull(d, id) {
  id = String(id)
  const [dlc, news, hist] = await Promise.all([
    Promise.allSettled((d.dlc || []).slice(0, 8).map((x) => fetchApp(x))),
    getJson(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${id}&count=4&maxlength=4000&format=json`).catch(() => null),
    getJson(`https://store.steampowered.com/appreviewhistogram/${id}?l=french`).catch(() => null),
  ])

  // Éditions et prix d'achat (les « options » de la page Steam).
  const packages = (d.package_groups || []).flatMap((g) => g.subs || []).map((s) => ({
    id: String(s.packageid),
    title: strip(s.option_text || '').replace(/\s+-\s+[\d\s,.]+\s?€.*$/, '').replace(/\s+-\s+Gratuit.*$/i, ''),
    free: !s.price_in_cents_with_discount,
    price: s.price_in_cents_with_discount ? money(s.price_in_cents_with_discount) : 'Gratuit',
    discount: Number(s.percent_savings) || 0,
  }))

  // Évaluations : somme de l'historique mensuel (toutes langues).
  let reviews = null
  const roll = hist?.results?.rollups
  if (roll?.length) {
    const up = roll.reduce((n, r) => n + r.recommendations_up, 0)
    const down = roll.reduce((n, r) => n + r.recommendations_down, 0)
    const total = up + down
    const pct = total ? Math.round((up / total) * 100) : 0
    reviews = { up, down, total, percent: pct, label: REVIEW_LABEL(pct, total) }
  }

  return {
    about: htmlToBlocks(d.about_the_game || d.detailed_description || ''),
    languages: parseLanguages(d.supported_languages),
    platforms: { windows: !!d.platforms?.windows, mac: !!d.platforms?.mac, linux: !!d.platforms?.linux },
    publisher: (d.publishers || []).filter(Boolean).join(', '),
    developers: (d.developers || []).filter(Boolean).join(', '),
    website: /^https?:\/\//.test(d.website || '') ? d.website : '',
    controller: d.controller_support === 'full' ? 'Manette : compatibilité complète' : d.controller_support === 'partial' ? 'Manette : compatibilité partielle' : '',
    age: Number(d.required_age) || 0,
    contentNotes: strip(d.content_descriptors?.notes || ''),
    features: [...new Set((d.categories || []).map((c) => c.description))],
    packages,
    dlc: dlc
      .filter((x) => x.status === 'fulfilled' && x.value)
      .map((x) => x.value)
      .map((x) => ({ id: String(x.steam_appid), title: x.name, header: (x.header_image || '').split('?')[0], price: x.is_free ? 'Gratuit' : x.price_overview?.final_formatted || '', discount: x.price_overview?.discount_percent || 0 })),
    dlcTotal: (d.dlc || []).length,
    news: (news?.appnews?.newsitems || []).map((n) => ({
      id: String(n.gid),
      title: n.title,
      date: n.date * 1000,
      label: n.feedlabel,
      url: /^https?:\/\//.test(n.url || '') ? n.url : '',
      text: newsText(n.contents).slice(0, 240),
      body: newsText(n.contents, true).slice(0, 3500),
    })),
    reviews,
  }
}
