// GET /api/steam/app?id=1086940 : fiche d'un jeu Steam (n'importe lequel), au format du launcher.
import { fetchApp, normalizeApp, normalizeFull } from './_normalize.mjs'

export default async (req) => {
  const q = new URL(req.url).searchParams
  const id = q.get('id') || ''
  const full = q.get('full') === '1' // fiche complète (éditions, DLC, langues, annonces, évaluations…)
  if (!/^\d{1,9}$/.test(id)) return Response.json({ error: 'id invalide' }, { status: 400 })
  try {
    const d = await fetchApp(id)
    if (!d || ['hardware', 'series', 'advertising'].includes(d.type)) return Response.json({ error: 'introuvable' }, { status: 404 })
    const body = full ? await normalizeFull(d, id) : await normalizeApp(d, id)
    return Response.json(body, { headers: { 'cache-control': 'public, max-age=1800' } })
  } catch (e) {
    return Response.json({ error: 'steam_unavailable', detail: String(e.message) }, { status: 502 })
  }
}
export const config = { path: '/api/steam/app' }
