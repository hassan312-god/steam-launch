// Utilitaires partagés : session signée (cookie) + appels à l'API Web Steam.
// La clé STEAM_API_KEY reste côté serveur (variable d'environnement Netlify), jamais envoyée au navigateur.
import { createHmac, timingSafeEqual } from 'node:crypto'

const env = (k) => (typeof Netlify !== 'undefined' ? Netlify.env.get(k) : undefined) ?? process.env[k]
export const apiKey = () => env('STEAM_API_KEY')

const COOKIE = 'ga_sid'
const sign = (steamid) => createHmac('sha256', apiKey() || 'dev').update('ga-session|' + steamid).digest('hex')

export function sessionCookie(steamid, secure) {
  const v = `${steamid}.${sign(steamid)}`
  return `${COOKIE}=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${secure ? '; Secure' : ''}`
}
export const clearCookie = (secure) => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`

// Renvoie le steamid de la session si le cookie est authentique, sinon null.
export function readSession(req) {
  const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d{17})\\.([a-f0-9]{64})`))
  if (!m) return null
  const good = Buffer.from(sign(m[1]))
  const got = Buffer.from(m[2])
  return good.length === got.length && timingSafeEqual(good, got) ? m[1] : null
}

export async function steam(path, params) {
  const url = new URL('https://api.steampowered.com' + path)
  Object.entries({ ...params, key: apiKey() }).forEach(([k, v]) => url.searchParams.set(k, v))
  const r = await fetch(url)
  if (!r.ok) throw new Error('Steam a répondu ' + r.status)
  return r.json()
}
