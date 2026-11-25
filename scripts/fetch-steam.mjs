// Récupère les fiches de vrais jeux Steam (API publique du magasin) -> src/data/catalog.json
// Usage : node scripts/fetch-steam.mjs
import { writeFileSync } from 'node:fs'

const IDS = [
  1245620, 1091500, 292030, 1174180, 271590, 1086940, 367520, 413150, 105600, 646570, 1145360, 1966720,
  1623730, 252490, 1593500, 1817070, 1888930, 2358720, 1426210, 548430, 892970, 782330, 227300, 244210,
  1551360, 960090, 2050650, 289070, 1190460, 504230, 1794680, 2215430, 1716740, 1627720, 2054970, 1313140,
  1868140, 322330, 108600, 294100, 2379780, 1332010, 570, 730, 1172470, 381210, 2369390, 1943950, 1245620,
  1203620, 1659420, 1403440, 1811260, 2208920, 1229490, 3164500,
]
const CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const ok = async (u) => {
  try { return (await fetch(u, { method: 'HEAD' })).ok } catch { return false }
}
const strip = (h = '') => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()

const out = []
for (const id of [...new Set(IDS)]) {
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
console.log('total', out.length)
