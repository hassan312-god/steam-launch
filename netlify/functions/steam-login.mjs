// GET /api/steam/login : redirige vers la connexion officielle Steam (OpenID 2.0).
export default async (req) => {
  const u = new URL(req.url)
  const origin = u.origin
  const popup = u.searchParams.get('popup') === '1' // connexion dans une fenêtre : le launcher reste ouvert
  const p = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': origin + '/api/steam/callback' + (popup ? '?popup=1' : ''),
    'openid.realm': origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })
  return Response.redirect('https://steamcommunity.com/openid/login?' + p, 302)
}
export const config = { path: '/api/steam/login' }
