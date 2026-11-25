<script setup>
// Tout le catalogue de jeux de Steam (plus de 200 000), en direct : filtres genre / prix, recherche, défilement infini.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import PageBackdrop from '../components/PageBackdrop.vue'
import SplitText from '../components/bits/SplitText.vue'
import CountUp from '../components/bits/CountUp.vue'
import { fmt, topSellers } from '../data/games'
import { useSteamSearch } from '../composables/useSteamSearch'
import { prefersReduced } from '../composables/motion'

// Identifiants de tags Steam.
const TAGS = [['Action', 19], ['Aventure', 21], ['RPG', 122], ['Indépendant', 492], ['Simulation', 599], ['Stratégie', 9], ['Course', 699], ['Sport', 701], ['FPS', 1663], ['Horreur', 1667], ['Puzzle', 1664], ['Survie', 1662], ['Monde ouvert', 1695], ['Multijoueur', 3859], ['Coopération', 1685], ['Anime', 4085]]
const PRICES = [['', 'Tous les prix'], ['free', 'Gratuits'], ['sale', 'En promotion']]

const moreTags = ref(false)
const mode = ref('popular')
const tag = ref(null)
const price = ref('')
const adult = ref(false) // contenu sexuellement explicite masqué par défaut
const items = ref([])
const total = ref(0)
const page = ref(0)
const hasMore = ref(false)
const loading = ref(false)
const error = ref(false)
const q = ref('')
let ctrl
let seq = 0

const { results: found, loading: searching, error: searchError } = useSteamSearch(q)

async function load(reset = false) {
  if (loading.value && !reset) return
  if (reset) {
    page.value = 0
    items.value = []
    hasMore.value = false
  }
  ctrl?.abort()
  ctrl = new AbortController()
  const mine = ++seq
  loading.value = true
  error.value = false
  const p = new URLSearchParams({ mode: mode.value, page: String(page.value) })
  if (mode.value === 'all') {
    if (tag.value) p.set('tag', String(tag.value))
    if (price.value) p.set('price', price.value)
    if (adult.value) p.set('adult', '1')
  }
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

// Le défilement infini charge la suite quand on approche du bas.
const sentinel = ref(null)
let io
onMounted(() => {
  load(true)
  io = new IntersectionObserver((e) => e[0].isIntersecting && hasMore.value && !loading.value && !error.value && !q.value && load(), { rootMargin: '700px' })
  io.observe(sentinel.value)
  if (!prefersReduced()) gsap.from('[data-head] > *', { opacity: 0, y: 24, stagger: 0.12, duration: 0.8, ease: 'power3.out', delay: 0.1 })
})
onBeforeUnmount(() => {
  io?.disconnect()
  ctrl?.abort()
})
// Choisir un filtre dans « Les plus joués » bascule sur tout le catalogue, filtré.
watch([tag, price, adult], () => { if (mode.value === 'popular' && (tag.value || price.value || adult.value)) mode.value = 'all' })
watch([mode, tag, price, adult], () => load(true))

function enter(el, done) {
  if (prefersReduced()) return done()
  gsap.fromTo(el, { opacity: 0, y: 24, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, delay: (el.dataset.i % 24) * 0.03, ease: 'power3.out', onComplete: done })
}
const showSearch = computed(() => q.value.trim().length >= 2)
const list = computed(() => (showSearch.value ? found.value : items.value))
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <PageBackdrop :src="(topSellers[0] || { wide: '' }).wide" :height="520" />

    <main class="shell relative flex flex-col gap-7 pb-16 pt-2">
      <div data-head class="flex flex-wrap items-end justify-between gap-5">
        <div class="flex flex-col gap-2">
          <span class="eyebrow"><template v-if="mode === 'all' && total && !showSearch"><CountUp :to="total" :duration="1.4" /> jeux sur Steam</template><template v-else-if="mode === 'popular'">Top 100 · jeux les plus joués en ce moment</template><template v-else>Catalogue Steam</template></span>
          <h1 class="page-title m-0">Catalogue</h1>
        </div>
        <div class="flex w-[380px] max-w-full flex-col gap-1.5">
          <label for="cq" class="text-xs font-semibold text-mute">Rechercher dans tout Steam</label>
          <input id="cq" v-model="q" type="search" autocomplete="off" placeholder="Un jeu, un studio…" class="h-[50px] rounded-full border border-white/[0.14] bg-panel/80 px-5 text-[15px] text-white placeholder:text-mute focus:border-accent focus:outline-none" />
        </div>
      </div>

      <div v-show="!showSearch" class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Affichage">
          <button type="button" :aria-pressed="mode === 'popular'" class="h-11 rounded-full border px-5 text-sm font-bold transition-colors" :class="mode === 'popular' ? 'border-accent bg-accent text-ink' : 'border-white/[0.14] bg-panel/80 text-white hover:border-white/40'" @click="mode = 'popular'">Les plus joués en ce moment</button>
          <button type="button" :aria-pressed="mode === 'all'" class="h-11 rounded-full border px-5 text-sm font-bold transition-colors" :class="mode === 'all' ? 'border-accent bg-accent text-ink' : 'border-white/[0.14] bg-panel/80 text-white hover:border-white/40'" @click="mode = 'all'">Tous les jeux</button>
        </div>
        <template v-if="true">
          <div class="flex flex-wrap gap-2" role="group" aria-label="Genre">
            <button type="button" :aria-pressed="tag === null" class="h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors" :class="tag === null ? 'border-white bg-white text-ink' : 'border-white/[0.14] bg-panel/80 text-white hover:border-white/40'" @click="tag = null">Tous les genres</button>
            <button v-for="[label, id] in (moreTags ? TAGS : TAGS.slice(0, 7))" :key="id" type="button" :aria-pressed="tag === id" class="h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors" :class="tag === id ? 'border-white bg-white text-ink' : 'border-white/[0.14] bg-panel/80 text-white hover:border-white/40'" @click="tag = tag === id ? null : id">{{ label }}</button>
            <button type="button" :aria-expanded="moreTags" class="h-10 shrink-0 rounded-full border border-dashed border-white/25 bg-transparent px-4 text-sm font-semibold text-soft transition-colors hover:border-white/50 hover:text-white" @click="moreTags = !moreTags">{{ moreTags ? 'Moins' : `+ ${TAGS.length - 7} genres` }}</button>
          </div>
          <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Prix">
            <button v-for="[v, label] in PRICES" :key="v" type="button" :aria-pressed="price === v" class="h-10 rounded-full border px-4 text-sm font-semibold transition-colors" :class="price === v ? 'border-accent bg-accent/15 text-accent' : 'border-white/[0.14] bg-panel/80 text-white hover:border-white/40'" @click="price = v">{{ label }}</button>
            <button type="button" :aria-pressed="adult" class="h-10 rounded-full border px-4 text-sm font-semibold transition-colors" :class="adult ? 'border-hot/60 bg-accent/10 text-hot' : 'border-white/[0.14] bg-panel/80 text-white hover:border-white/40'" @click="adult = !adult">{{ adult ? 'Contenu adulte affiché' : 'Contenu adulte masqué' }}</button>
            <span v-if="total" class="ml-2 text-sm text-mute" aria-live="polite">{{ fmt.format(total) }} jeu{{ total > 1 ? 'x' : '' }} · {{ fmt.format(items.length) }} affiché{{ items.length > 1 ? 's' : '' }}</span>
          </div>
        </template>
      </div>

      <p v-if="showSearch" class="m-0 text-sm text-mute" aria-live="polite">{{ found.length }} résultat{{ found.length > 1 ? 's' : '' }} pour « {{ q }} »<span v-if="searching"> · recherche sur tout Steam…</span><span v-if="searchError"> · la recherche Steam est indisponible pour le moment</span></p>

      <div class="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-x-5 gap-y-8 2xl:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
        <TransitionGroup :css="false" appear @enter="enter">
          <RouterLink v-for="(g, i) in list" :key="g.id" :data-i="i" :to="'/jeu/' + g.id" class="group flex flex-col gap-2.5 text-white no-underline">
            <div class="relative aspect-[2/3] overflow-hidden rounded-[20px] bg-panel shadow-[0_18px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-translate-y-1.5">
              <img :src="g.cover" alt="" loading="lazy" class="block size-full object-cover transition-transform duration-700 group-hover:scale-110" @error="$event.target.src = g.header" />
              <span v-if="g.discount" class="absolute left-2.5 top-2.5 rounded-full bg-accent px-[9px] py-[5px] text-[11px] font-extrabold text-ink">-{{ g.discount }} %</span>
              <span class="absolute bottom-2.5 left-2.5 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-extrabold backdrop-blur-md" :class="g.price === 'Gratuit' ? 'text-accent' : 'text-white'">{{ g.price }}</span>
            </div>
            <span class="text-[15px] font-bold leading-snug">{{ g.title }}</span>
            <span v-if="g.year" class="-mt-1.5 text-xs text-mute">{{ g.year }}</span>
          </RouterLink>
        </TransitionGroup>
      </div>

      <div v-if="loading && !showSearch" class="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5" aria-busy="true" aria-label="Chargement">
        <div v-for="n in 8" :key="n" class="aspect-[2/3] animate-pulse rounded-[20px] bg-panel" />
      </div>
      <p v-if="error && !showSearch" class="m-0 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-white/20 p-6 text-mute" role="alert">Le catalogue Steam est indisponible pour le moment.<button type="button" class="h-10 rounded-full bg-accent px-5 text-sm font-extrabold text-ink" @click="load(page === 0)">Réessayer</button></p>
      <p v-if="!loading && !error && !showSearch && !items.length" class="m-0 rounded-2xl border border-dashed border-white/20 p-6 text-mute">Aucun jeu ne correspond à ces filtres.</p>
      <div ref="sentinel" class="h-px" aria-hidden="true" />
      <button v-if="hasMore && !loading && !showSearch" type="button" class="mx-auto h-12 rounded-full border border-white/20 bg-transparent px-8 text-sm font-bold text-white hover:bg-white/10" @click="load()">Charger plus de jeux</button>
      <p v-if="!hasMore && items.length > 24 && !showSearch && !loading" class="m-0 text-center text-sm text-mute">Fin de la liste.</p>
    </main>
  </div>
</template>
