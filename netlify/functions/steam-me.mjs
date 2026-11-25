// GET /api/steam/me : profil + jeux possédés du compte connecté (steamid lu uniquement dans le cookie signé).
import { apiKey, readSession, steam } from './_steam.mjs'

export default async (req) => {
  const json = (d, status = 200) => Response.json(d, { status, headers: { 'cache-control': 'private, no-store' } })
  if (!apiKey()) return json({ error: 'not_configured' }, 503)
  const id = readSession(req)
  if (!id) return json({ error: 'not_logged_in' }, 401)
  try {
    const [sum, owned] = await Promise.all([
      steam('/ISteamUser/GetPlayerSummaries/v2/', { steamids: id }),
      steam('/IPlayerService/GetOwnedGames/v1/', { steamid: id, include_appinfo: 1, include_played_free_games: 1 }),
    ])
    const p = sum.response?.players?.[0]
    if (!p) return json({ error: 'not_found' }, 404)
    const games = owned.response?.games || []
    return json({
      profile: { id, name: p.personaname, avatar: p.avatarfull, url: p.profileurl, public: p.communityvisibilitystate === 3 },
      // `games` est absent quand les détails de jeu du profil sont privés.
      gamesVisible: owned.response?.game_count !== undefined,
      games: games.map((g) => ({ appid: String(g.appid), name: g.name, minutes: g.playtime_forever || 0, last: g.rtime_last_played || 0 })),
    })
  } catch (e) {
    return json({ error: 'steam_unavailable', detail: String(e.message) }, 502)
  }
}
export const config = { path: '/api/steam/me' }
