// GET /api/steam/callback : Steam renvoie ici l'utilisateur ; on vérifie la signature auprès de Steam.
import { sessionCookie } from './_steam.mjs'

export default async (req) => {
  const url = new URL(req.url)
  const q = url.searchParams
  const fail = (why) => Response.redirect(url.origin + '/parametres?steam=' + why, 302)

  const claimed = q.get('openid.claimed_id') || ''
  const m = claimed.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/)
  if (!m || q.get('openid.mode') !== 'id_res') return fail('refuse')
  // La redirection doit bien être celle que nous avons demandée.
  if (q.get('openid.return_to') !== url.origin + '/api/steam/callback') return fail('refuse')

  // Vérification auprès de Steam : on renvoie les mêmes paramètres avec le mode check_authentication.
  const body = new URLSearchParams(q)
  body.set('openid.mode', 'check_authentication')
  const r = await fetch('https://steamcommunity.com/openid/login', { method: 'POST', body })
  const text = await r.text()
  if (!/is_valid\s*:\s*true/.test(text)) return fail('invalide')

  return new Response(null, {
    status: 302,
    headers: { location: url.origin + '/bibliotheque?steam=ok', 'set-cookie': sessionCookie(m[1], url.protocol === 'https:') },
  })
}
export const config = { path: '/api/steam/callback' }
