// GET /api/steam/logout : efface la session.
import { clearCookie } from './_steam.mjs'

export default async (req) => {
  const url = new URL(req.url)
  return new Response(null, { status: 302, headers: { location: url.origin + '/parametres', 'set-cookie': clearCookie(url.protocol === 'https:') } })
}
export const config = { path: '/api/steam/logout' }
