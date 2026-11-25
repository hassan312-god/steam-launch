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
