// GET /api/steam/app?id=1086940 : fiche d'un jeu Steam (n'importe lequel), au format du launcher.
import { fetchApp, normalizeApp } from './_normalize.mjs'

export default async (req) => {
  const id = new URL(req.url).searchParams.get('id') || ''
  if (!/^\d{1,9}$/.test(id)) return Response.json({ error: 'id invalide' }, { status: 400 })
  try {
    const d = await fetchApp(id)
    if (!d || d.type !== 'game') return Response.json({ error: 'introuvable' }, { status: 404 })
    return Response.json(await normalizeApp(d, id), { headers: { 'cache-control': 'public, max-age=1800' } })
  } catch (e) {
    return Response.json({ error: 'steam_unavailable', detail: String(e.message) }, { status: 502 })
  }
}
export const config = { path: '/api/steam/app' }
