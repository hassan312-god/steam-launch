// GET /api/steam/callback : Steam renvoie ici l'utilisateur ; on vérifie la signature auprès de Steam.
import { sessionCookie } from './_steam.mjs'

export default async (req) => {
  const url = new URL(req.url)
  const q = url.searchParams
  const popup = q.get('popup') === '1'
  const secure = url.protocol === 'https:'
  // En popup : on prévient le launcher (fenêtre d'origine) puis on se ferme ; sinon redirection classique.
  const page = (ok, cookie) =>
    new Response(
      `<!doctype html><meta charset="utf-8"><title>Connexion Steam</title><body style="margin:0;background:#06060A;color:#fff;font:16px system-ui;display:grid;place-items:center;height:100vh;text-align:center">` +
        `<p>${ok ? 'Connecté à Steam ✓ — tu peux fermer cette fenêtre.' : 'Connexion Steam refusée.'}</p>` +
        `<script>try{window.opener&&window.opener.postMessage({type:'ga-steam',ok:${ok}},location.origin)}catch(e){}setTimeout(function(){window.close()},300)</script>`,
      { headers: { 'content-type': 'text/html; charset=utf-8', ...(cookie ? { 'set-cookie': cookie } : {}) } },
    )
  const fail = (why) => (popup ? page(false) : Response.redirect(url.origin + '/parametres?steam=' + why, 302))

  const claimed = q.get('openid.claimed_id') || ''
  const m = claimed.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/)
  if (!m || q.get('openid.mode') !== 'id_res') return fail('refuse')
  // La redirection doit bien être celle que nous avons demandée.
  if (q.get('openid.return_to') !== url.origin + '/api/steam/callback' + (popup ? '?popup=1' : '')) return fail('refuse')

  // Vérification auprès de Steam : on renvoie les mêmes paramètres avec le mode check_authentication.
  const body = new URLSearchParams(q)
  body.set('openid.mode', 'check_authentication')
  const r = await fetch('https://steamcommunity.com/openid/login', { method: 'POST', body })
  const text = await r.text()
  if (!/is_valid\s*:\s*true/.test(text)) return fail('invalide')

  const cookie = sessionCookie(m[1], secure)
  if (popup) return page(true, cookie)
  return new Response(null, { status: 302, headers: { location: url.origin + '/bibliotheque?steam=ok', 'set-cookie': cookie } })
}
export const config = { path: '/api/steam/callback' }
