// Récupère les fiches de vrais jeux Steam (API publique du magasin) -> src/data/catalog.json
// Usage : node scripts/fetch-steam.mjs
import { writeFileSync } from 'node:fs'

const IDS = [
  1245620, 1091500, 292030, 1174180, 271590, 1086940, 367520, 413150, 105600, 646570, 1145360, 1966720,
  1623730, 252490, 1593500, 1817070, 1888930, 2358720, 1426210, 548430, 892970, 782330, 227300, 244210,
  1551360, 960090, 2050650, 289070, 1190460, 504230, 1794680, 2215430, 1716740, 1627720, 2054970, 1313140,
  1868140, 322330, 108600, 294100, 2379780, 1332010, 570, 730, 1172470, 381210, 2369390, 1943950, 1203620,
  1659420, 1403440, 2208920, 1229490, 3164500,
  440, 578080, 359550, 2073850, 1085660, 1599340, 346110, 1196590, 883710, 952060, 1250410, 1237970, 374320,
  570940, 1325200, 582010, 2246340, 1687950, 1235140, 524220, 814380, 1888160, 990080, 870780, 632470, 435150,
  255710, 703080, 427520, 526870, 264710, 275850, 242760, 1326470, 815370, 739630, 2881650, 945360, 1097150,
  252950, 550, 620, 546560, 220, 4000, 1145350, 588650, 268910, 1057090, 1030300, 391540, 632360, 250900,
  311690, 1092790, 653530, 753640, 383870, 304430, 48000, 1182900, 860510, 414340, 412020, 534380, 1172620,
  553850, 261550, 1142710, 268500, 1466860, 281990, 1158310, 394360, 620980, 3527290, 3241660, 2001120,
  1903340, 1771300, 3017860, 3159330, 2677660, 2183900, 1030840, 205100, 480490, 337000, 8870, 397540, 377160,
  22380, 489830, 1693980, 2124490, 214490, 750920, 1029690, 552520, 447040, 517630, 690790, 2488620,
]
const CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const ok = async (u) => {
  try { return (await fetch(u, { method: 'HEAD' })).ok } catch { return false }
}
const strip = (h = '') => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()

const feat = await (await fetch('https://store.steampowered.com/api/featuredcategories?cc=fr&l=french')).json()
const ids = (k) => (feat[k]?.items || []).map((i) => i.id)
const specials = ids('specials')
const top = ids('top_sellers')
const news = ids('new_releases').slice(0, 14)
// Configuration requise : le HTML Steam (<li><strong>Libellé :</strong> valeur</li>) devient [[libellé, valeur], …].
const parseReq = (html = '') => {
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

const out = []
for (const id of [...new Set([...IDS, ...specials, ...top, ...news])]) {
  try {
    const r = await fetch(`https://store.steampowered.com/api/appdetails?appids=${id}&l=french&cc=fr`)
    const j = (await r.json())[id]
    if (!j?.success || j.data.type !== 'game') { console.log('skip', id); continue }
    const d = j.data
    const cover = `${CDN}/${id}/library_600x900.jpg`
    const hero = `${CDN}/${id}/library_hero.jpg`
    const logo = `${CDN}/${id}/logo.png`
    const [hasCover, hasHero, hasLogo] = await Promise.all([ok(cover), ok(hero), ok(logo)])
    const shots = (d.screenshots || []).slice(0, 10).map((s) => s.path_full.split('?')[0])
    const g = {
      id: String(id),
      title: d.name,
      cover: hasCover ? cover : d.header_image.split('?')[0],
      wide: hasHero ? hero : (shots[0] || d.header_image.split('?')[0]),
      header: d.header_image.split('?')[0],
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
    out.push(g)
    console.log('ok', id, g.title, `v:${g.movies.length} s:${g.shots.length} a:${g.ach.length}`)
  } catch (e) {
    console.log('fail', id, e.message)
  }
  await sleep(1100)
}
writeFileSync(new URL('../src/data/catalog.json', import.meta.url), JSON.stringify(out))
const kept = new Set(out.map((g) => g.id))
const keep = (l) => [...new Set(l.map(String))].filter((i) => kept.has(i))
writeFileSync(new URL('../src/data/lists.json', import.meta.url), JSON.stringify({ specials: keep(specials), top: keep(top), news: keep(news) }))
console.log('total', out.length)
