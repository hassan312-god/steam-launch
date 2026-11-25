// GET /api/steam/search?q=elden : recherche dans TOUT le catalogue Steam (pas seulement les jeux du launcher).
// 1) la recherche du magasin trouve des identifiants ; 2) l'API Steam (clé côté serveur) en donne le type, l'image et le prix :
//    on ne garde que les vrais jeux (ni bande-son, ni DLC, ni logiciel).
import { apiKey } from './_steam.mjs'

const ASSETS = 'https://shared.akamai.steamstatic.com/store_item_assets/'
const fmtPrice = (o) => o?.formatted_final_price || ''

export default async (req) => {
  const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 60)
  if (q.length < 2) return Response.json({ results: [] })
  const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'public, max-age=300' } })
  try {
    const r = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=french&cc=fr`)
    if (!r.ok) throw new Error('Steam a répondu ' + r.status)
    const hits = ((await r.json()).items || []).filter((i) => i.type === 'app').slice(0, 14)
    if (!hits.length) return json({ results: [] })

    // Sans clé (ou si l'API échoue) : on garde les résultats bruts de la recherche du magasin.
    const basic = () =>
      hits.slice(0, 10).map((i) => ({
        id: String(i.id),
        title: i.name,
        header: (i.tiny_image || '').split('?')[0],
        cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${i.id}/library_600x900.jpg`,
        price: i.price ? (i.price.final / 100).toLocaleString('fr-FR', { style: 'currency', currency: i.price.currency || 'EUR' }) : 'Gratuit',
        discount: i.price && i.price.initial > i.price.final ? Math.round((1 - i.price.final / i.price.initial) * 100) : 0,
        year: '',
      }))
    if (!apiKey()) return json({ results: basic(), filtered: false })

    const input = { ids: hits.map((i) => ({ appid: i.id })), context: { language: 'french', country_code: 'FR' }, data_request: { include_basic_info: true, include_assets: true, include_release: true } }
    const url = `https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?key=${apiKey()}&input_json=${encodeURIComponent(JSON.stringify(input))}`
    const g = await fetch(url)
    if (!g.ok) return json({ results: basic(), filtered: false })
    const items = (await g.json()).response?.store_items || []
    const order = new Map(hits.map((h, i) => [h.id, i]))
    const results = items
      .filter((i) => i.type === 0 && i.visible !== false) // 0 = jeu
      .sort((a, b) => order.get(a.appid) - order.get(b.appid))
      .slice(0, 10)
      .map((i) => {
        const a = i.assets || {}
        const img = (f) => (f ? ASSETS + a.asset_url_format.replace('${FILENAME}', f) : '')
        const b = i.best_purchase_option
        return {
          id: String(i.appid),
          title: i.name,
          header: img(a.header) || img(a.small_capsule),
          cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${i.appid}/library_600x900.jpg`,
          price: i.is_free ? 'Gratuit' : fmtPrice(b) || 'Prix à venir',
          discount: b?.discount_pct || 0,
          year: i.release?.steam_release_date ? String(new Date(i.release.steam_release_date * 1000).getFullYear()) : '',
        }
      })
    return json({ results, filtered: true })
  } catch (e) {
    return Response.json({ error: 'steam_unavailable', detail: String(e.message) }, { status: 502 })
  }
}
export const config = { path: '/api/steam/search' }
