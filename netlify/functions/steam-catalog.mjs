// GET /api/steam/catalog?mode=popular|all&tag=19&price=free|sale&page=0 : parcourt TOUT le catalogue de jeux de Steam.
//  - popular : le classement Steam des jeux les plus joués en ce moment (100 jeux)
//  - all     : l'ensemble des jeux (plus de 200 000), filtrable par genre (tag) et par prix
import { apiKey } from './_steam.mjs'

const PAGE = 24
const ASSETS = 'https://shared.akamai.steamstatic.com/store_item_assets/'
const CTX = { language: 'french', country_code: 'FR', steam_realm: 1 }
const API = 'https://api.steampowered.com/'

const call = async (path, input) => {
  const r = await fetch(`${API}${path}?key=${apiKey()}&input_json=${encodeURIComponent(JSON.stringify(input))}`)
  if (!r.ok) throw new Error('Steam a répondu ' + r.status)
  return (await r.json()).response
}

export default async (req) => {
  const q = new URL(req.url).searchParams
  const json = (b, status = 200) => Response.json(b, { status, headers: { 'cache-control': 'public, max-age=600' } })
  if (!apiKey()) return json({ error: 'not_configured' }, 503)

  const mode = q.get('mode') === 'popular' ? 'popular' : 'all'
  const page = Math.max(0, Math.min(Number(q.get('page')) || 0, 4000))
  const tag = /^\d{1,6}$/.test(q.get('tag') || '') ? Number(q.get('tag')) : null
  const price = q.get('price')
  const adult = q.get('adult') === '1' // par défaut, le contenu sexuellement explicite est masqué

  try {
    let ids, total
    if (mode === 'popular') {
      const r = await call('ISteamChartsService/GetMostPlayedGames/v1/', { context: CTX })
      const all = (r.ranks || []).map((x) => x.appid)
      total = all.length
      ids = all.slice(page * PAGE, page * PAGE + PAGE)
    } else {
      const filters = { type_filters: { include_games: true } }
      if (tag) filters.tagids_must_match = [{ tagids: [tag] }]
      if (!adult) filters.tagids_exclude = [9130, 6650, 12095, 24904] // Hentai, Nudité, Contenu sexuel, NSFW
      if (price === 'free') filters.price_filters = { only_free_items: true }
      if (price === 'sale') filters.price_filters = { min_discount_percent: 1 }
      const r = await call('IStoreQueryService/Query/v1/', { context: CTX, query: { start: page * PAGE, count: PAGE, sort: 0, filters }, data_request: {} })
      total = r.metadata?.total_matching_records ?? 0
      ids = (r.ids || []).map((x) => x.appid)
    }
    if (!ids.length) return json({ total, items: [], hasMore: false })

    const g = await call('IStoreBrowseService/GetItems/v1/', { ids: ids.map((appid) => ({ appid })), context: CTX, data_request: { include_basic_info: true, include_assets: true, include_release: true } })
    const byId = new Map((g.store_items || []).map((i) => [i.appid, i]))
    const items = ids
      .map((id) => byId.get(id))
      .filter((i) => i && i.name && i.visible !== false && i.type === 0)
      .map((i) => {
        const a = i.assets || {}
        const img = (f) => (f ? ASSETS + a.asset_url_format.replace('${FILENAME}', f) : '')
        const b = i.best_purchase_option
        return {
          id: String(i.appid),
          title: i.name,
          header: img(a.header) || img(a.small_capsule),
          cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${i.appid}/library_600x900.jpg`,
          price: i.is_free ? 'Gratuit' : b?.formatted_final_price || 'Prix à venir',
          discount: b?.discount_pct || 0,
          year: i.release?.steam_release_date ? String(new Date(i.release.steam_release_date * 1000).getFullYear()) : '',
        }
      })
    return json({ total, items, hasMore: (page + 1) * PAGE < total })
  } catch (e) {
    return Response.json({ error: 'steam_unavailable', detail: String(e.message) }, { status: 502 })
  }
}
export const config = { path: '/api/steam/catalog' }
