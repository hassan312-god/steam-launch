<script setup>
// Avis réels des joueurs Steam (API officielle), avec pagination.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import gsap from 'gsap'
import { fmt } from '../data/games'
import { prefersReduced } from '../composables/motion'

const props = defineProps({ appid: { type: String, required: true } })

const page = ref(1)
const cursors = ref(['*']) // cursors[i] = curseur de la page i+1
const reviews = ref([])
const summary = ref(null)
const loading = ref(true)
const error = ref('')
const lang = ref('french')
const open = ref({})
const list = ref(null)
let ctrl

const cursor = () => encodeURIComponent(cursors.value[page.value - 1])

// 1) fonction serveur ; 2) à défaut, appel direct de l'API officielle depuis le navigateur du visiteur.
async function fetchPage(signal) {
  try {
    const r = await fetch(`/api/reviews?appid=${props.appid}&lang=${lang.value}&cursor=${cursor()}`, { signal })
    const d = await r.json()
    if (r.ok) return d
  } catch (e) {
    if (e.name === 'AbortError') throw e
  }
  const r = await fetch(`https://store.steampowered.com/appreviews/${props.appid}?json=1&filter=all&review_type=all&purchase_type=all&num_per_page=10&language=${lang.value}&cursor=${cursor()}`, { signal })
  const d = await r.json()
  if (d.success !== 1) throw new Error('Avis Steam indisponibles pour le moment.')
  return {
    summary: d.query_summary,
    cursor: d.cursor,
    reviews: d.reviews.map((x) => ({ id: x.recommendationid, recommended: x.voted_up, hours: Math.round((x.author?.playtime_forever || 0) / 60), created: x.timestamp_created, votes: x.votes_up, text: x.review })),
  }
}

async function load() {
  ctrl?.abort()
  ctrl = new AbortController()
  loading.value = true
  error.value = ''
  try {
    const d = await fetchPage(ctrl.signal)
    // Aucun avis dans la langue : on bascule sur toutes les langues.
    if (!d.reviews.length && page.value === 1 && lang.value !== 'all') {
      lang.value = 'all'
      return load()
    }
    reviews.value = d.reviews
    summary.value = d.summary
    cursors.value[page.value] = d.cursor
    open.value = {}
    loading.value = false
    await nextTick()
    if (!prefersReduced()) gsap.fromTo(list.value?.children ?? [], { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out' })
  } catch (e) {
    if (e.name === 'AbortError') return
    error.value = 'Les avis Steam sont indisponibles pour le moment.'
    loading.value = false
  }
}
function go(p) {
  page.value = p
  load()
  list.value?.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' })
}
function reset() {
  page.value = 1
  cursors.value = ['*']
  lang.value = 'french'
  reviews.value = []
  summary.value = null
  load()
}
watch(() => props.appid, reset, { immediate: true })
onBeforeUnmount(() => ctrl?.abort())

const total = computed(() => summary.value?.total_reviews ?? 0)
const hasNext = computed(() => reviews.value.length === 10 && !!cursors.value[page.value])
// Pages déjà atteintes (la pagination Steam avance de page en page).
const pages = computed(() => Array.from({ length: Math.max(page.value, 1) + (hasNext.value ? 1 : 0) }, (_, i) => i + 1))
const date = (t) => new Date(t * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const long = (t) => t.length > 380
</script>

<template>
  <section class="flex flex-col gap-4" aria-labelledby="rev-h">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id="rev-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">Avis des joueurs</h2>
      <span v-if="summary && summary.review_score_desc" class="text-sm text-mute"><strong class="text-accent">{{ summary.review_score_desc }}</strong> · {{ fmt.format(total) }} avis{{ lang === 'all' ? ' (toutes langues)' : '' }}</span>
    </div>

    <p v-if="error" class="m-0 rounded-2xl border border-dashed border-white/20 p-6 text-mute" role="alert">{{ error }} <button type="button" class="ml-1 border-0 bg-transparent p-0 font-bold text-accent underline" @click="load">Réessayer</button></p>

    <div v-else-if="loading && !reviews.length" class="flex flex-col gap-3" aria-busy="true" aria-label="Chargement des avis">
      <div v-for="n in 3" :key="n" class="h-[120px] animate-pulse rounded-2xl bg-panel" />
    </div>

    <ul v-else ref="list" class="m-0 flex list-none flex-col gap-3 p-0 transition-opacity" :class="loading ? 'opacity-50' : ''">
      <li v-for="r in reviews" :key="r.id" class="card flex flex-col gap-3 p-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="flex items-center gap-2 text-sm font-bold" :class="r.recommended ? 'text-accent' : 'text-hot'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path v-if="r.recommended" d="M2 21h4V9H2zM23 10a2 2 0 0 0-2-2h-6.3l1-4.6v-.3a1.5 1.5 0 0 0-.4-1L14.2 1 7.6 7.6A2 2 0 0 0 7 9v10a2 2 0 0 0 2 2h9a2 2 0 0 0 1.8-1.2l3-7a2 2 0 0 0 .2-.8z" /><path v-else d="M22 3h-4v12h4zM1 14a2 2 0 0 0 2 2h6.3l-1 4.6v.3a1.5 1.5 0 0 0 .4 1l1.1 1.1 6.6-6.6A2 2 0 0 0 17 15V5a2 2 0 0 0-2-2H6a2 2 0 0 0-1.8 1.2l-3 7A2 2 0 0 0 1 12z" /></svg>
            {{ r.recommended ? 'Recommandé' : 'Non recommandé' }}
          </span>
          <span class="text-xs text-mute">{{ r.hours }} h de jeu · {{ date(r.created) }}</span>
        </div>
        <p class="m-0 whitespace-pre-line text-sm leading-relaxed text-soft" :class="long(r.text) && !open[r.id] ? 'line-clamp-5' : ''">{{ r.text }}</p>
        <div class="flex items-center justify-between gap-3 text-xs text-mute">
          <span>{{ fmt.format(r.votes) }} personne{{ r.votes > 1 ? 's' : '' }} ont trouvé cet avis utile</span>
          <button v-if="long(r.text)" type="button" class="border-0 bg-transparent p-0 text-xs font-bold text-accent" @click="open[r.id] = !open[r.id]">{{ open[r.id] ? 'Réduire' : 'Lire la suite' }}</button>
        </div>
      </li>
    </ul>

    <nav v-if="!error && reviews.length" class="flex flex-wrap items-center justify-center gap-2 pt-2" aria-label="Pagination des avis">
      <button type="button" :disabled="page === 1 || loading" class="h-10 rounded-full border border-white/[0.14] bg-panel/80 px-4 text-sm font-semibold text-white transition-colors enabled:hover:border-white/40 disabled:opacity-40" @click="go(page - 1)">← Précédent</button>
      <button v-for="p in pages" :key="p" type="button" :aria-current="p === page ? 'page' : undefined" :disabled="loading || p > page + 1" class="size-10 rounded-full border text-sm font-bold transition-colors" :class="p === page ? 'border-accent bg-accent text-ink' : 'border-white/[0.14] bg-panel/80 text-white enabled:hover:border-white/40'" @click="go(p)">{{ p }}</button>
      <button type="button" :disabled="!hasNext || loading" class="h-10 rounded-full border border-white/[0.14] bg-panel/80 px-4 text-sm font-semibold text-white transition-colors enabled:hover:border-white/40 disabled:opacity-40" @click="go(page + 1)">Suivant →</button>
    </nav>
  </section>
</template>
