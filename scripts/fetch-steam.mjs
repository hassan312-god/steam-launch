// Récupère les fiches de vrais jeux Steam (API publique du magasin) -> src/data/catalog.json
// Usage : node scripts/fetch-steam.mjs
import { writeFileSync } from 'node:fs'
import { fetchApp, normalizeApp } from '../netlify/functions/_normalize.mjs'

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const feat = await (await fetch('https://store.steampowered.com/api/featuredcategories?cc=fr&l=french')).json()
const ids = (k) => (feat[k]?.items || []).map((i) => i.id)
const specials = ids('specials')
const top = ids('top_sellers')
const news = ids('new_releases').slice(0, 14)
const out = []
for (const id of [...new Set([...IDS, ...specials, ...top, ...news])]) {
  try {
    const d = await fetchApp(id)
    if (!d || d.type !== 'game') { console.log('skip', id); continue }
    const g = await normalizeApp(d, id)
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
