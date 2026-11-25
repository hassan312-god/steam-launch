<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import PageBackdrop from '../components/PageBackdrop.vue'
import SplitText from '../components/bits/SplitText.vue'
import SpotlightCard from '../components/bits/SpotlightCard.vue'
import TiltedCard from '../components/bits/TiltedCard.vue'
import Ring from '../components/bits/Ring.vue'
import { byId, games, genres, radar } from '../data/games'
import { prefersReduced } from '../composables/motion'

const q = ref('')
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const list = computed(() => radar.filter((r) => !q.value || norm(r.game.title + ' ' + r.why).includes(norm(q.value))))
const genre = ref(null)
const genreList = computed(() => (genre.value ? games.filter((x) => x.genres.includes(genre.value)) : []))
const counts = Object.fromEntries(genres.map((x) => [x.label, games.filter((g) => g.genres.includes(x.label)).length]))
const genreSection = ref(null)
async function pickGenre(label) {
  genre.value = genre.value === label ? null : label
  if (!genre.value) return
  await nextTick()
  genreSection.value?.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' })
}
function gEnter(el, done) {
  if (prefersReduced()) return done()
  gsap.fromTo(el, { opacity: 0, y: 30, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, delay: Math.min(el.dataset.i * 0.04, 0.5), ease: 'power3.out', onComplete: done })
}
function gLeave(el, done) {
  gsap.to(el, { opacity: 0, scale: 0.92, duration: 0.15, onComplete: done })
}
const featured = byId['2215430']
const wish = byId['1627720']
const duo = byId['1551360']
const free = byId['1172470']

const root = ref(null)
let ctx
onMounted(() => {
  if (prefersReduced()) return
  ctx = gsap.context(() => {
    gsap.from('[data-head] > *', { opacity: 0, y: 24, stagger: 0.12, duration: 0.8, ease: 'power3.out', delay: 0.1 })
    gsap.from('[data-tile]', { opacity: 0, y: 50, scale: 0.96, stagger: 0.1, duration: 0.9, ease: 'power3.out', delay: 0.25 })
  }, root.value)
})
onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div ref="root" class="relative min-h-screen overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <PageBackdrop :src="featured.wide" :height="600" />

    <main class="relative flex flex-col gap-9 shell pb-14 pt-2">
      <div data-head class="flex flex-wrap items-end justify-between gap-5">
        <div class="flex flex-col gap-2">
          <span class="eyebrow">Choisi pour toi, Hassan</span>
          <h1 class="page-title m-0"><SplitText text="Magasin" :delay="0.15" /></h1>
        </div>
        <div class="flex w-[360px] max-w-full flex-col gap-1.5">
          <label for="sq" class="text-xs font-semibold text-mute">Rechercher dans le magasin</label>
          <input id="sq" v-model="q" type="search" placeholder="Un jeu, un genre, un studio…" class="h-[50px] rounded-full border border-white/[0.14] bg-panel/80 px-5 text-[15px] text-white placeholder:text-mute focus:border-accent focus:outline-none" />
        </div>
      </div>

      <!-- Bento -->
      <div class="grid auto-rows-[210px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:auto-rows-[250px]">
        <SpotlightCard tag="RouterLink" :to="'/jeu/' + featured.id" data-tile class="group flex flex-col justify-end rounded-3xl text-white no-underline sm:col-span-2 lg:row-span-2">
          <img :src="featured.wide" alt="" class="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
          <div class="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 via-60% to-transparent" />
          <div class="relative flex flex-col gap-3 p-7">
            <span class="self-start rounded-full bg-accent px-3 py-[7px] text-[13px] font-bold text-ink">96 % POUR TOI</span>
            <span class="font-display text-[clamp(32px,4vw,44px)] font-black uppercase leading-[0.95]">{{ featured.title }}</span>
            <span class="text-[15px] text-[#D7D8E0]">Parce que tu as passé 142 h sur Elden Ring : même sens de l’aventure, même exigence.</span>
            <div class="mt-1.5 flex items-center gap-3.5">
              <span class="font-display text-[22px] font-extrabold">{{ featured.price }}</span>
              <span class="flex h-12 items-center rounded-full bg-white px-6 text-[15px] font-extrabold text-ink transition-transform group-hover:scale-105">Acheter</span>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard tag="RouterLink" :to="'/jeu/' + wish.id" data-tile class="group flex flex-col justify-end rounded-3xl text-white no-underline sm:col-span-2">
          <img :src="wish.wide" alt="" class="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
          <div class="absolute inset-0 bg-gradient-to-r from-ink/90 to-ink/20 to-70%" />
          <div class="relative flex max-w-[60%] flex-col gap-2 p-6">
            <span class="text-xs font-bold tracking-[0.14em] text-hot">TA LISTE DE SOUHAITS</span>
            <span class="font-display text-[26px] font-extrabold">{{ wish.title }}</span>
            <span class="flex items-baseline gap-2.5 text-[15px]"><strong class="text-xl">{{ wish.price }}</strong><span v-if="wish.discount" class="rounded-md bg-hot px-2 py-[3px] text-xs font-extrabold text-ink">-{{ wish.discount }} %</span></span>
          </div>
        </SpotlightCard>

        <SpotlightCard tag="div" data-tile class="card group">
          <RouterLink :to="'/jeu/' + duo.id" class="relative flex h-full flex-col gap-3 p-[22px] text-white no-underline">
            <span class="text-xs font-bold tracking-[0.14em] text-cyan">TES AMIS Y JOUENT</span>
            <div class="flex">
              <span class="flex size-10 items-center justify-center rounded-full border-[3px] border-panel bg-[#FF8FB3] text-[13px] font-extrabold text-ink">LS</span>
              <span class="-ml-3 flex size-10 items-center justify-center rounded-full border-[3px] border-panel bg-amber text-[13px] font-extrabold text-ink">KD</span>
              <span class="-ml-3 flex size-10 items-center justify-center rounded-full border-[3px] border-panel bg-[#8AB4FF] text-[13px] font-extrabold text-ink">+3</span>
            </div>
            <span class="mt-auto font-display text-xl font-extrabold">{{ duo.title }}</span>
            <span class="text-[13px] text-mute">5 amis · {{ duo.price }}</span>
          </RouterLink>
        </SpotlightCard>

        <SpotlightCard tag="RouterLink" :to="'/jeu/' + free.id" data-tile class="group flex flex-col justify-end rounded-3xl text-white no-underline">
          <img :src="free.wide" alt="" class="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
          <div class="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 via-60% to-transparent" />
          <div class="relative flex flex-col gap-1.5 p-[22px]">
            <span class="self-start rounded-full bg-white px-2.5 py-[5px] text-xs font-extrabold text-ink">GRATUIT À JOUER</span>
            <span class="font-display text-xl font-extrabold">{{ free.title }}</span>
          </div>
        </SpotlightCard>
      </div>

      <!-- Radar -->
      <section v-reveal class="flex flex-col gap-[18px]" aria-labelledby="radar-h">
        <div class="flex items-baseline justify-between gap-4"><h2 id="radar-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">Ton radar</h2><span class="text-sm text-mute">Calculé sur tes heures de jeu</span></div>
        <p v-if="!list.length" class="m-0 rounded-3xl border border-dashed border-white/20 p-8 text-mute">Aucun jeu ne correspond à « {{ q }} » dans ton radar.</p>
        <div v-else class="no-scrollbar flex gap-[18px] overflow-x-auto px-1 py-3">
          <RouterLink v-for="(r, i) in list" :key="r.game.id" :to="'/jeu/' + r.game.id" class="flex w-[210px] shrink-0 flex-col gap-3 text-white no-underline">
            <TiltedCard class="h-[280px] overflow-hidden rounded-[22px]">
              <img :src="r.game.cover" alt="" class="block size-full rounded-[22px] object-cover" />
              <div class="absolute right-3 top-3">
                <Ring :value="r.match" :size="52" :thickness="4" inner="rgb(6 6 10 / 0.85)" :delay="0.2 + i * 0.1"><span class="text-[13px] font-extrabold">{{ r.match }}%</span></Ring>
              </div>
              <span v-if="r.game.discount" class="absolute bottom-3 left-3 rounded-md bg-hot px-2 py-1 text-xs font-extrabold text-ink">-{{ r.game.discount }} %</span>
            </TiltedCard>
            <span class="text-[15px] font-bold">{{ r.game.title }}</span>
            <span class="text-[13px] text-mute">{{ r.why }} · <strong class="text-white">{{ r.game.price || 'Voir' }}</strong></span>
          </RouterLink>
        </div>
      </section>

      <!-- Genres -->
      <section class="flex flex-col gap-[18px]" aria-labelledby="genres-h">
        <h2 id="genres-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">Ton humeur, ton genre</h2>
        <div v-reveal="{ children: true, stagger: 0.07 }" class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
          <button v-for="x in genres" :key="x.label" type="button" :aria-pressed="genre === x.label" class="group relative flex h-24 items-center justify-between overflow-hidden rounded-[20px] border-0 bg-panel px-5 text-left text-white transition-shadow duration-300" :class="genre === x.label ? 'shadow-[0_0_0_3px_var(--accent)]' : ''" @click="pickGenre(x.label)">
            <img :src="x.game.wide" alt="" class="absolute inset-0 size-full object-cover saturate-[1.2] transition-transform duration-700 group-hover:scale-110" />
            <span class="absolute inset-0 transition-colors duration-300" :class="genre === x.label ? 'bg-ink/30' : 'bg-ink/55 group-hover:bg-ink/35'" />
            <span class="relative font-display text-[17px] font-extrabold transition-transform duration-300 group-hover:translate-x-1.5">{{ x.label }}</span>
            <span class="relative rounded-full bg-ink/60 px-2.5 py-1 text-xs font-bold backdrop-blur-md">{{ counts[x.label] }}</span>
          </button>
        </div>
        <div v-if="genre" ref="genreSection" class="flex flex-col gap-5 pt-4">
          <div class="flex items-center justify-between gap-4">
            <h3 class="m-0 font-display text-xl font-extrabold">{{ genre }} <span class="text-base text-mute">· {{ genreList.length }} jeux</span></h3>
            <button type="button" class="h-10 rounded-full border border-white/[0.14] bg-panel/80 px-4 text-sm font-semibold text-white transition-colors hover:border-white/40" @click="genre = null">Effacer le filtre</button>
          </div>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-x-5 gap-y-7">
            <TransitionGroup :css="false" appear @enter="gEnter" @leave="gLeave">
              <RouterLink v-for="(g, i) in genreList" :key="g.id" :data-i="i" :to="'/jeu/' + g.id" class="group flex flex-col gap-2.5 text-white no-underline">
                <div class="relative aspect-[2/3] overflow-hidden rounded-[20px] shadow-[0_18px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-translate-y-1.5">
                  <img :src="g.cover" alt="" loading="lazy" class="block size-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <span class="absolute left-2.5 top-2.5 rounded-full px-[9px] py-[5px] text-[11px] font-extrabold tracking-[0.06em] text-ink" :class="g.owned ? 'bg-accent' : 'bg-soft'">{{ g.owned ? 'BIBLIOTHÈQUE' : g.price || 'MAGASIN' }}</span>
                </div>
                <span class="text-[15px] font-bold">{{ g.title }}</span>
              </RouterLink>
            </TransitionGroup>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
