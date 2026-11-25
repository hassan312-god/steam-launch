// Proxy vers l'API officielle des avis Steam (le navigateur ne peut pas l'appeler directement : pas de CORS).
// GET /api/reviews?appid=1086940&cursor=*&lang=french  ->  { summary, reviews, cursor }
export default async (req) => {
  const q = new URL(req.url).searchParams
  const appid = q.get('appid') || ''
  const lang = /^[a-z]{2,12}$/i.test(q.get('lang') || '') ? q.get('lang') : 'french'
  const cursor = q.get('cursor') || '*'
  if (!/^\d{1,9}$/.test(appid)) return Response.json({ error: 'appid invalide' }, { status: 400 })

  const url = `https://store.steampowered.com/appreviews/${appid}?json=1&filter=all&review_type=all&purchase_type=all&num_per_page=10&language=${lang}&cursor=${encodeURIComponent(cursor)}`
  try {
    const res = await fetch(url, { redirect: 'manual', headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error('Steam a répondu ' + res.status)
    const d = await res.json()
    if (d.success !== 1) throw new Error('Réponse Steam inattendue')
    return Response.json(
      {
        summary: d.query_summary,
        cursor: d.cursor,
        reviews: (d.reviews || []).map((r) => ({
          id: r.recommendationid,
          recommended: r.voted_up,
          hours: Math.round((r.author?.playtime_forever || 0) / 60),
          created: r.timestamp_created,
          votes: r.votes_up,
          text: r.review,
        })),
      },
      { headers: { 'cache-control': 'public, max-age=300' } },
    )
  } catch (e) {
    return Response.json({ error: 'Avis Steam indisponibles pour le moment.', detail: String(e.message) }, { status: 502 })
  }
}

export const config = { path: '/api/reviews' }
