// GET /api/steam/store : les sélections du moment de la vitrine Steam (promotions, meilleures ventes, nouveautés, bientôt).
import { fetchApp } from './_normalize.mjs'

const SECTIONS = [
  ['top_sellers', 'Meilleures ventes', 'Le classement Steam du moment'],
  ['specials', 'Promotions du moment', 'Les offres en cours sur Steam'],
  ['new_releases', 'Nouveautés', 'Les dernières sorties'],
  ['coming_soon', 'Prochainement', 'À venir sur Steam'],
]

export default async (req) => {
  try {
    const r = await fetch('https://store.steampowered.com/api/featuredcategories?cc=fr&l=french')
    if (!r.ok) throw new Error('Steam a répondu ' + r.status)
    const d = await r.json()

    // Steam mélange jeux, DLC, bandes-son et matériel : on ne garde que les vrais jeux (un contrôle léger par id).
    const uniq = new Map()
    for (const [key] of SECTIONS) for (const i of (d[key]?.items || []).slice(0, 16)) uniq.set(i.id, i)
    const verdicts = await Promise.all(
      [...uniq.keys()].map(async (id) => {
        try {
          return [id, (await fetchApp(id))?.type === 'game']
        } catch {
          return [id, false]
        }
      }),
    )
    const isGame = new Map(verdicts)

    const sections = SECTIONS.map(([key, title, sub]) => ({
      id: key,
      title,
      sub,
      items: (d[key]?.items || [])
        .filter((i) => isGame.get(i.id))
        .map((i) => ({
          id: String(i.id),
          title: i.name,
          header: i.large_capsule_image || i.header_image,
          cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${i.id}/library_600x900.jpg`,
          discount: i.discount_percent || 0,
          price: i.final_price ? (i.final_price / 100).toLocaleString('fr-FR', { style: 'currency', currency: i.currency || 'EUR' }) : '',
          free: !i.final_price && !i.discounted,
        })),
    })).filter((s) => s.items.length)

    return Response.json({ sections }, { headers: { 'cache-control': 'public, max-age=600' } })
  } catch (e) {
    return Response.json({ error: 'steam_unavailable', detail: String(e.message) }, { status: 502 })
  }
}
export const config = { path: '/api/steam/store' }
