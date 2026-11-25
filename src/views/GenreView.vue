<script setup>
// Page d'un genre : tout le catalogue Steam de ce genre (API officielle), avec tri et filtres.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import gsap from 'gsap'
import PageBackdrop from '../components/PageBackdrop.vue'
import SplitText from '../components/bits/SplitText.vue'
import CountUp from '../components/bits/CountUp.vue'
import Dropdown from '../components/Dropdown.vue'
import { fmt, genres as top } from '../data/games'
import { prefersReduced } from '../composables/motion'

const TAGS = { Action: 19, Aventure: 21, RPG: 122, Indépendant: 492, Simulation: 599, Stratégie: 9, Course: 699, Sport: 701, FPS: 1663, Horreur: 1667, Puzzle: 1664, Survie: 1662, 'Monde ouvert': 1695, Multijoueur: 3859, Coopération: 1685, Anime: 4085 }
const route = useRoute()
const label = computed(() => String(route.params.label))
const tagId = computed(() => TAGS[label.value])
const art = computed(() => top.find((g) => g.label === label.value)?.game?.wide || top[0]?.game?.wide || '')

const SORTS = ['Pertinence Steam', 'Prix croissant', 'Prix décroissant', 'Plus récents', 'Nom (A → Z)', 'Promotions d’abord']
const sort = ref(SORTS[0])
const PRICES = [['', 'Tous les prix'], ['free', 'Gratuits'], ['sale', 'En promotion']]
const price = ref('')

const items = ref([])
const total = ref(0)
const page = ref(0)
const hasMore = ref(false)
const loading = ref(false)
const error = ref(false)
let seq = 0
let ctrl

async function load(reset = false) {
  if (!tagId.value) return
  if (reset) (ctrl?.abort(), (page.value = 0), (items.value = []), (hasMore.value = false))
  ctrl = new AbortController()
  const mine = ++seq
  loading.value = true
  error.value = false
  const p = new URLSearchParams({ mode: 'all', page: String(page.value), tag: String(tagId.value) })
  if (price.value) p.set('price', price.value)
  try {
    const r = await fetch('/api/steam/catalog?' + p, { signal: ctrl.signal })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'catalog')
    if (mine !== seq) return
    const seen = new Set(items.value.map((x) => x.id))
    items.value.push(...d.items.filter((x) => !seen.has(x.id)))
    total.value = d.total
    hasMore.value = d.hasMore
    page.value++
    loading.value = false
  } catch (e) {
    if (e.name === 'AbortError') return
    error.value = true
    loading.value = false
  }
}

const num = (g) => (g.price === 'Gratuit' ? 0 : parseFloat(String(g.price).replace(',', '.').replace(/[^\d.]/g, '')) || 9e9)
const shown = computed(() => {
  const l = [...items.value]
  switch (sort.value) {
    case 'Prix croissant': return l.sort((a, b) => num(a) - num(b))
    case 'Prix décroissant': return l.sort((a, b) => (num(b) === 9e9 ? -1 : num(a) === 9e9 ? 1 : num(b) - num(a)))
    case 'Plus récents': return l.sort((a, b) => Number(b.year || 0) - Number(a.year || 0))
    case 'Nom (A → Z)': return l.sort((a, b) => a.title.localeCompare(b.title, 'fr'))
    case 'Promotions d’abord': return l.sort((a, b) => b.discount - a.discount)
    default: return l
  }
})

const sentinel = ref(null)
let io
onMounted(() => {
  load(true)
  io = new IntersectionObserver((e) => e[0].isIntersecting && hasMore.value && !loading.value && !error.value && load(), { rootMargin: '700px' })
  io.observe(sentinel.value)
  if (!prefersReduced()) gsap.from('[data-head] > *', { opacity: 0, y: 24, stagger: 0.12, duration: 0.8, ease: 'power3.out', delay: 0.1 })
})
onBeforeUnmount(() => (io?.disconnect(), ctrl?.abort()))
watch([label, price], () => load(true))
function enter(el, done) {
  if (prefersReduced()) return done()
  gsap.fromTo(el, { opacity: 0, y: 24, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, delay: (el.dataset.i % 24) * 0.03, ease: 'power3.out', onComplete: done })
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <PageBackdrop :src="art" :height="560" />
    <main class="shell relative flex flex-col gap-7 pb-16 pt-2">
      <div data-head class="flex flex-col gap-3">
        <RouterLink to="/magasin" class="flex w-fit items-center gap-2 text-sm font-semibold text-soft no-underline hover:text-white">‹ Magasin</RouterLink>
        <span v-if="total" class="eyebrow"><CountUp :to="total" :duration="1.4" /> jeux sur Steam</span>
        <h1 class="page-title m-0">{{ label }}</h1>
      </div>

      <p v-if="!tagId" class="m-0 rounded-3xl border border-dashed border-white/20 p-8 text-mute">Ce genre n’existe pas. <RouterLink to="/magasin" class="font-bold text-accent">Retour au magasin</RouterLink></p>
      <template v-else>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Prix">
            <button v-for="[v, l] in PRICES" :key="v" type="button" :aria-pressed="price === v" class="h-10 rounded-full border px-4 text-sm font-semibold transition-colors" :class="price === v ? 'border-accent bg-accent/15 text-accent' : 'border-white/[0.14] bg-panel/80 text-white hover:border-white/40'" @click="price = v">{{ l }}</button>
          </div>
          <div class="flex items-center gap-2.5"><span class="text-[13px] text-mute">Trier par</span><Dropdown v-model="sort" :options="SORTS" label="Trier par" /></div>
        </div>
        <p v-if="sort !== SORTS[0] && hasMore" class="m-0 text-xs text-mute">Le tri s’applique aux {{ fmt.format(items.length) }} jeux déjà chargés ; fais défiler pour en charger d’autres.</p>

        <div class="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-x-5 gap-y-[30px]" aria-live="polite">
          <TransitionGroup :css="false" appear @enter="enter">
            <RouterLink v-for="(g, i) in shown" :key="g.id" :data-i="i" :to="'/jeu/' + g.id" class="group flex flex-col gap-2.5 text-white no-underline">
              <div class="relative aspect-[2/3] overflow-hidden rounded-[20px] bg-panel shadow-[0_18px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-translate-y-1.5">
                <img :src="g.cover" alt="" loading="lazy" class="block size-full object-cover transition-transform duration-700 group-hover:scale-110" @error="$event.target.src = g.header" />
                <span v-if="g.discount" class="absolute left-2.5 top-2.5 rounded-full bg-accent px-[9px] py-[5px] text-[11px] font-extrabold text-ink">-{{ g.discount }} %</span>
                <span class="absolute bottom-2.5 left-2.5 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-extrabold backdrop-blur-md" :class="g.price === 'Gratuit' ? 'text-accent' : 'text-white'">{{ g.price }}</span>
              </div>
              <span class="text-[15px] font-bold leading-tight">{{ g.title }}</span>
              <span class="-mt-1.5 text-[13px] text-mute">{{ g.year }}</span>
            </RouterLink>
          </TransitionGroup>
          <template v-if="loading && !items.length"><div v-for="n in 12" :key="n" class="aspect-[2/3] animate-pulse rounded-[20px] bg-panel" /></template>
        </div>
        <p v-if="error" class="m-0 text-sm text-hot" role="alert">Steam ne répond pas. <button type="button" class="border-0 bg-transparent p-0 font-bold text-accent underline" @click="load()">Réessayer</button></p>
        <p v-else-if="!loading && !items.length" class="m-0 rounded-3xl border border-dashed border-white/20 p-8 text-mute">Aucun jeu pour ce filtre.</p>
        <div ref="sentinel" class="h-10" aria-hidden="true" />
        <p v-if="loading && items.length" class="m-0 text-center text-sm text-mute" role="status">Chargement…</p>
      </template>
    </main>
  </div>
</template>
