<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import PageBackdrop from '../components/PageBackdrop.vue'
import SplitText from '../components/bits/SplitText.vue'
import CountUp from '../components/bits/CountUp.vue'
import SpotlightCard from '../components/bits/SpotlightCard.vue'
import { homeGames, myGames } from '../data/games'
import { toggleFav } from '../composables/useLaunch'
import { theme } from '../composables/useTheme'
import { prefersReduced } from '../composables/motion'

const filters = {
  Tout: () => true,
  Favoris: (g) => g.fav,
  Gratuits: (g) => g.free,
  'En promotion': (g) => g.discount > 0,
  'Coopération': (g) => g.cats.some((c) => /Coopération/.test(c)),
}
const sorts = ['Ajout récent', 'Nom', 'Prix', 'Metacritic']

const f = ref('Tout')
const sort = ref(sorts[0])
const all = myGames
const list = computed(() => {
  const l = all.value.filter(filters[f.value])
  if (sort.value === 'Ajout récent') return [...l].reverse()
  if (sort.value === 'Nom') return [...l].sort((a, b) => a.title.localeCompare(b.title, 'fr'))
  if (sort.value === 'Prix') return [...l].sort((a, b) => b.num - a.num)
  return [...l].sort((a, b) => (b.metacritic ?? 0) - (a.metacritic ?? 0))
})

// Statistiques calculées sur ta vraie sélection.
const count = computed(() => all.value.length)
const favCount = computed(() => all.value.filter((g) => g.fav).length)
const worth = computed(() => Math.round(all.value.reduce((n, g) => n + g.num, 0)))
const topGenre = computed(() => {
  const c = {}
  all.value.forEach((g) => g.genres.forEach((x) => (c[x] = (c[x] || 0) + 1)))
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0]
})
const minCol = computed(() => ({ Compact: 140, Confort: 180, Géant: 240 })[theme.density] ?? 180)
const suggestions = homeGames.slice(0, 6)

const root = ref(null)
let ctx
onMounted(() => {
  if (prefersReduced()) return
  ctx = gsap.context(() => {
    gsap.from('[data-head] > *', { opacity: 0, y: 24, stagger: 0.12, duration: 0.8, ease: 'power3.out', delay: 0.1 })
    gsap.from('[data-stat]', { opacity: 0, y: 40, scale: 0.95, stagger: 0.1, duration: 0.8, ease: 'power3.out', delay: 0.3 })
  }, root.value)
})
onBeforeUnmount(() => ctx?.revert())

function enter(el, done) {
  if (prefersReduced()) return done()
  gsap.fromTo(el, { opacity: 0, y: 30, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, delay: Math.min(el.dataset.i * 0.045, 0.6), ease: 'power3.out', onComplete: done })
}
function leave(el, done) {
  gsap.to(el, { opacity: 0, scale: 0.9, duration: 0.18, onComplete: done })
}
</script>

<template>
  <div ref="root" class="relative min-h-screen overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <PageBackdrop :src="(all[0] ?? homeGames[0]).wide" />

    <main class="shell relative flex flex-col gap-8 pb-14 pt-2">
      <div data-head class="flex flex-col gap-2">
        <span class="eyebrow">La collection de {{ theme.username }}</span>
        <h1 class="page-title m-0"><SplitText text="Bibliothèque" :delay="0.15" /></h1>
      </div>

      <!-- Bibliothèque vide : on invite à choisir de vrais jeux -->
      <section v-if="!count" class="flex flex-col gap-6 rounded-3xl border border-dashed border-white/20 p-8 sm:p-12" aria-labelledby="empty-h">
        <div class="flex flex-col gap-2">
          <h2 id="empty-h" class="m-0 font-display text-2xl font-extrabold">Ta bibliothèque est vide</h2>
          <p class="m-0 max-w-[560px] text-soft">Ouvre la fiche d’un jeu et clique sur « Ajouter à ma bibliothèque ». Voici quelques idées du moment :</p>
        </div>
        <div class="no-scrollbar flex gap-4 overflow-x-auto py-2">
          <RouterLink v-for="g in suggestions" :key="g.id" :to="'/jeu/' + g.id" class="w-[150px] shrink-0 text-white no-underline transition-transform hover:-translate-y-1">
            <img :src="g.cover" alt="" loading="lazy" class="aspect-[2/3] w-full rounded-2xl object-cover" />
            <span class="mt-2 block text-sm font-bold">{{ g.title }}</span>
          </RouterLink>
        </div>
        <RouterLink to="/magasin" class="flex h-[52px] items-center self-start rounded-full bg-accent px-7 text-[15px] font-extrabold text-ink no-underline">Parcourir le magasin</RouterLink>
      </section>

      <template v-else>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SpotlightCard data-stat class="card flex flex-col gap-1.5 p-6">
            <span class="text-[13px] text-mute">Jeux dans ta bibliothèque</span>
            <span class="font-display text-5xl font-black leading-none"><CountUp :to="count" :duration="1.4" :delay="0.4" /></span>
            <span class="text-[13px] font-semibold text-accent">{{ favCount }} en favori{{ favCount > 1 ? 's' : '' }}</span>
          </SpotlightCard>
          <SpotlightCard data-stat class="card flex flex-col gap-1.5 p-6">
            <span class="text-[13px] text-mute">Valeur au prix Steam</span>
            <span class="font-display text-5xl font-black leading-none"><CountUp :to="worth" :duration="1.6" :delay="0.5" /><span class="text-[22px]"> €</span></span>
            <span class="text-[13px] text-mute">Somme des prix actuels</span>
          </SpotlightCard>
          <SpotlightCard data-stat class="card flex flex-col gap-1.5 p-6">
            <span class="text-[13px] text-mute">Genre le plus présent</span>
            <span class="font-display text-3xl font-black leading-tight">{{ topGenre?.[0] }}</span>
            <span class="text-[13px] text-mute">{{ topGenre?.[1] }} jeu{{ topGenre?.[1] > 1 ? 'x' : '' }}</span>
          </SpotlightCard>
          <SpotlightCard data-stat class="card flex flex-col gap-1.5 p-6">
            <span class="text-[13px] text-mute">Dernier ajout</span>
            <span class="font-display text-xl font-extrabold leading-tight">{{ all[all.length - 1].title }}</span>
            <span class="text-[13px] text-mute">{{ all[all.length - 1].price || 'Gratuit' }}</span>
          </SpotlightCard>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrer">
            <button
              v-for="(_, label) in filters"
              :key="label"
              type="button"
              :aria-pressed="f === label"
              class="h-[42px] rounded-full border px-[18px] text-sm font-bold transition-colors duration-300"
              :class="f === label ? 'border-accent bg-accent text-ink' : 'border-white/[0.14] bg-panel/80 text-white hover:border-white/40'"
              @click="f = label"
            >{{ label }} <span class="font-semibold opacity-60">{{ all.filter(filters[label]).length }}</span></button>
          </div>
          <div class="flex items-center gap-2.5">
            <label for="tri" class="text-[13px] text-mute">Trier par</label>
            <select id="tri" v-model="sort" class="h-[42px] rounded-full border border-white/[0.14] bg-panel px-4 text-sm text-white">
              <option v-for="s in sorts" :key="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <p v-if="!list.length" class="m-0 rounded-3xl border border-dashed border-white/20 p-8 text-mute">Aucun jeu ne correspond à ce filtre.</p>
        <div class="grid gap-x-5 gap-y-[30px]" :style="{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))` }">
          <TransitionGroup :css="false" appear move-class="lib-move" @enter="enter" @leave="leave">
            <div v-for="(g, i) in list" :key="g.id" :data-i="i" class="group relative flex flex-col gap-3">
              <RouterLink :to="'/jeu/' + g.id" class="flex flex-col gap-3 text-white no-underline">
                <div class="relative aspect-[2/3] overflow-hidden rounded-[22px] shadow-[0_18px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-translate-y-1.5">
                  <img :src="g.cover" alt="" loading="lazy" class="block size-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <span v-if="g.discount" class="absolute left-2.5 top-2.5 rounded-full bg-hot px-[9px] py-[5px] text-[11px] font-extrabold tracking-[0.06em] text-ink">-{{ g.discount }} %</span>
                </div>
                <span class="text-[15px] font-bold">{{ g.title }}</span>
                <span class="-mt-1.5 text-xs text-mute">{{ g.genres.slice(0, 2).join(' · ') }}</span>
              </RouterLink>
              <button type="button" :aria-pressed="g.fav" :aria-label="g.fav ? 'Retirer des favoris' : 'Ajouter aux favoris'" class="absolute right-2.5 top-2.5 flex size-[34px] items-center justify-center rounded-full border-0 bg-ink/70 transition-transform hover:scale-110" @click="toggleFav(g)">
                <svg width="15" height="15" viewBox="0 0 24 24" :fill="g.fav ? '#FF3D9A' : 'none'" stroke="#FF3D9A" stroke-width="2" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" /></svg>
              </button>
            </div>
          </TransitionGroup>
        </div>
      </template>
    </main>
  </div>
</template>

<style>
.lib-move { transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
</style>
