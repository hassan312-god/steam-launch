import { ref, watch } from 'vue'

// Recherche dans tout le catalogue Steam via /api/steam/search (avec délai anti-rafale et annulation de la requête précédente).
export function useSteamSearch(query, { delay = 280 } = {}) {
  const results = ref([])
  const loading = ref(false)
  const error = ref(false)
  let timer
  let ctrl

  watch(query, (q) => {
    clearTimeout(timer)
    ctrl?.abort()
    const term = (q || '').trim()
    if (term.length < 2) {
      results.value = []
      loading.value = false
      error.value = false
      return
    }
    loading.value = true
    timer = setTimeout(async () => {
      ctrl = new AbortController()
      try {
        const r = await fetch('/api/steam/search?q=' + encodeURIComponent(term), { signal: ctrl.signal })
        const d = await r.json()
        if (!r.ok) throw new Error('search')
        results.value = d.results
        error.value = false
        loading.value = false
      } catch (e) {
        if (e.name === 'AbortError') return
        results.value = []
        error.value = true
        loading.value = false
      }
    }, delay)
  })

  return { results, loading, error }
}
