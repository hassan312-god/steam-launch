<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import PageBackdrop from '../components/PageBackdrop.vue'
import SplitText from '../components/bits/SplitText.vue'
import CountUp from '../components/bits/CountUp.vue'
import Ring from '../components/bits/Ring.vue'
import SpotlightCard from '../components/bits/SpotlightCard.vue'
import { byId, myGames as games } from '../data/games'
import { theme } from '../composables/useTheme'
import { prefersReduced } from '../composables/motion'

const filters = {
  Tout: () => true,
  Installés: (g) => g.installed,
  Favoris: (g) => g.fav,
  'Pas finis': (g) => g.progress < 50,
  Cloud: (g) => !g.installed,
}
const sorts = ['Joué récemment', 'Temps de jeu', 'Progression', 'Nom']
const hours = (g) => g.hours

const f = ref('Tout')
const sort = ref(sorts[0])
const list = computed(() => {
  const l = games.filter(filters[f.value])
  if (sort.value === 'Temps de jeu') return [...l].sort((a, b) => hours(b) - hours(a))
  if (sort.value === 'Progression') return [...l].sort((a, b) => b.progress - a.progress)
  if (sort.value === 'Nom') return [...l].sort((a, b) => a.title.localeCompare(b.title, 'fr'))
  return l
})
const totalHours = games.reduce((n, g) => n + g.hours, 0)
const installedCount = games.filter((g) => g.installed).length
const minCol = computed(() => ({ Compact: 140, Confort: 180, Géant: 240 })[theme.density] ?? 180)
const badge = (s) => (s === 'INSTALLÉ' ? 'bg-accent' : s === 'CLOUD' ? 'bg-soft' : 'bg-amber')

const root = ref(null)
const storage = ref(null)
let ctx
onMounted(() => {
  if (prefersReduced()) return
  ctx = gsap.context(() => {
    gsap.from('[data-head] > *', { opacity: 0, y: 24, stagger: 0.12, duration: 0.8, ease: 'power3.out', delay: 0.1 })
    gsap.from('[data-stat]', { opacity: 0, y: 40, scale: 0.95, stagger: 0.1, duration: 0.8, ease: 'power3.out', delay: 0.3 })
    gsap.from('[data-seg]', { scaleX: 0, transformOrigin: 'left', stagger: 0.15, duration: 0.9, ease: 'power3.out', delay: 0.8 })
  }, root.value)
})
onBeforeUnmount(() => ctx?.revert())

// Grille : entrée échelonnée à chaque changement de filtre / tri.
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
    <PageBackdrop :src="byId['1593500'].wide" />

    <main class="relative flex flex-col gap-8 shell pb-14 pt-2">
      <div data-head class="flex flex-col gap-2">
        <span class="eyebrow">La collection de Hassan</span>
        <h1 class="page-title m-0"><SplitText text="Bibliothèque" :delay="0.15" /></h1>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SpotlightCard data-stat class="card flex flex-col gap-1.5 p-6">
          <span class="text-[13px] text-mute">Temps de jeu total</span>
          <span class="font-display text-5xl font-black leading-none"><CountUp :to="totalHours" :duration="2" :delay="0.4" /><span class="text-[22px]"> h</span></span>
          <span class="text-[13px] font-semibold text-accent">+14 h cette semaine</span>
        </SpotlightCard>

        <div data-stat class="group relative flex min-h-[150px] flex-col justify-end overflow-hidden rounded-3xl">
          <img :src="byId['1245620'].wide" alt="" class="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] group-hover:scale-110" />
          <div class="absolute inset-0 bg-gradient-to-t from-ink/90 to-ink/10 to-80%" />
          <div class="relative flex flex-col gap-0.5 p-5">
            <span class="text-xs text-[#D7D8E0]">Ton jeu le plus joué</span>
            <span class="font-display text-lg font-extrabold">Elden Ring · 142 h</span>
          </div>
        </div>

        <div data-stat class="card flex items-center gap-[18px] p-6">
          <Ring :value="63" :size="92" :thickness="9" track="rgba(255,255,255,0.12)" inner="var(--color-panel)" :delay="0.5"><span class="font-display text-lg font-extrabold"><CountUp :to="63" :duration="1.4" :delay="0.5" />%</span></Ring>
          <div class="flex flex-col gap-1"><span class="text-[13px] text-mute">Succès débloqués</span><span class="text-lg font-bold"><CountUp :to="318" :duration="1.6" :delay="0.5" /> / 504</span></div>
        </div>

        <div data-stat ref="storage" class="card flex flex-col gap-2.5 p-6">
          <span class="text-[13px] text-mute">Stockage</span>
          <span class="font-display text-[28px] font-extrabold"><CountUp :to="612" :duration="1.8" :delay="0.5" /> <span class="text-[15px] text-mute">/ 1 000 Go</span></span>
          <div class="flex h-2.5 gap-[3px] overflow-hidden rounded-[5px]" role="img" aria-label="612 Go utilisés sur 1 000">
            <span data-seg class="w-[34%] bg-accent" /><span data-seg class="w-[18%] bg-cyan" /><span data-seg class="w-[9%] bg-hot" /><span class="flex-1 bg-white/[0.12]" />
          </div>
          <span class="text-xs text-mute">{{ installedCount }} jeux installés</span>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrer">
          <button
            v-for="(_, label) in filters"
            :key="label"
            type="button"
            :aria-pressed="f === label"
            class="h-[42px] rounded-full border px-[18px] text-sm font-bold transition-all duration-300 hover:-translate-y-0.5"
            :class="f === label ? 'border-accent bg-accent text-ink' : 'border-white/[0.14] bg-panel/80 text-white hover:border-white/40'"
            @click="f = label"
          >{{ label }} <span class="font-semibold opacity-60">{{ games.filter(filters[label]).length }}</span></button>
        </div>
        <div class="flex items-center gap-2.5">
          <label for="tri" class="text-[13px] text-mute">Trier par</label>
          <select id="tri" v-model="sort" class="h-[42px] rounded-full border border-white/[0.14] bg-panel px-4 text-sm text-white">
            <option v-for="s in sorts" :key="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <div class="grid gap-x-5 gap-y-[30px]" :style="{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))` }">
        <TransitionGroup :css="false" appear move-class="lib-move" @enter="enter" @leave="leave">
          <RouterLink v-for="(g, i) in list" :key="g.id" :data-i="i" :to="'/jeu/' + g.id" class="group flex flex-col gap-3 text-white no-underline">
            <div class="relative aspect-[2/3] overflow-hidden rounded-[22px] shadow-[0_18px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-translate-y-1.5">
              <img :src="g.cover" alt="" class="block size-full object-cover transition-transform duration-700 group-hover:scale-110" :class="g.installed ? '' : 'brightness-[0.8] grayscale-[0.6]'" />
              <span class="absolute left-2.5 top-2.5 rounded-full px-[9px] py-[5px] text-[11px] font-extrabold tracking-[0.06em] text-ink" :class="badge(g.state)">{{ g.state }}</span>
              <span v-if="g.fav" class="absolute right-2.5 top-2.5 flex size-[30px] items-center justify-center rounded-full bg-ink/70">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF3D9A" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" /></svg>
              </span>
            </div>
            <span class="text-[15px] font-bold">{{ g.title }}</span>
            <div class="flex flex-col gap-1.5">
              <div class="h-1 rounded-sm bg-white/[0.12]"><div class="h-1 rounded-sm bg-accent transition-[width] duration-700" :style="{ width: g.progress + '%' }" /></div>
              <span class="text-xs text-mute">{{ g.time }} · {{ g.progress }}% terminé</span>
            </div>
          </RouterLink>
        </TransitionGroup>
      </div>
    </main>
  </div>
</template>

<style>
.lib-move { transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
</style>
