<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import gsap from 'gsap'
import SplitText from '../components/bits/SplitText.vue'
import BlurText from '../components/bits/BlurText.vue'
import CountUp from '../components/bits/CountUp.vue'
import Magnet from '../components/bits/Magnet.vue'
import ShinyText from '../components/bits/ShinyText.vue'
import Ring from '../components/bits/Ring.vue'
import SpotlightCard from '../components/bits/SpotlightCard.vue'
import TiltedCard from '../components/bits/TiltedCard.vue'
import { byId, bySlug, details, friends, games } from '../data/games'
import { prefersReduced } from '../composables/motion'

const route = useRoute()
const game = computed(() => byId[route.params.id] ?? games[0])
const info = computed(() => details[game.value.id])
const owned = computed(() => game.value.installed || game.value.progress > 0)
const hours = computed(() => parseInt(game.value.time, 10))
const playing = computed(() => friends.filter((f) => f.playing === game.value.slug))
const similar = computed(() => games.filter((g) => g.id !== game.value.id && g.moods.some((m) => game.value.moods.includes(m))).slice(0, 5))
const achPct = computed(() => Math.round((info.value.got / info.value.total) * 100))
const cta = computed(() => (game.value.installed ? 'Jouer' : owned.value ? 'Installer' : 'Acheter · ' + info.value.price))

const root = ref(null)
let ctx
function intro() {
  ctx?.revert()
  if (prefersReduced()) return
  ctx = gsap.context(() => {
    gsap.fromTo('[data-bg]', { scale: 1.15, opacity: 0 }, { scale: 1.02, opacity: 1, duration: 1.4, ease: 'power2.out' })
    gsap.to('[data-bg]', { scale: 1.1, duration: 22, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4 })
    gsap.from('[data-in]', { opacity: 0, y: 26, stagger: 0.1, duration: 0.8, ease: 'power3.out', delay: 0.5 })
    gsap.from('[data-stat]', { opacity: 0, y: 40, scale: 0.95, stagger: 0.1, duration: 0.8, ease: 'power3.out', delay: 0.9 })
    gsap.from('[data-ach]', { opacity: 0, x: -24, stagger: 0.08, duration: 0.6, ease: 'power3.out', delay: 1.2 })
  }, root.value)
}
onMounted(intro)
// Navigation d'une fiche à l'autre (jeux similaires) : on rejoue l'intro.
watch(() => route.params.id, async () => {
  await nextTick()
  window.scrollTo({ top: 0 })
  intro()
})
onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div ref="root" class="relative min-h-screen overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 h-[760px] overflow-hidden">
      <img data-bg :key="game.id" :src="game.wide" alt="" class="size-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/40 to-ink/10" />
      <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(6,6,10,0.7) 0%, rgba(6,6,10,0) 25%, rgba(6,6,10,0.4) 60%, #06060A 100%)" />
    </div>

    <main class="relative flex flex-col gap-12 px-5 pb-16 pt-6 md:px-12">
      <RouterLink data-in to="/bibliotheque" class="flex w-fit items-center gap-2 text-sm font-semibold text-soft no-underline transition-colors hover:text-white">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="15,5 8,12 15,19" /></svg>Bibliothèque
      </RouterLink>

      <!-- En-tête de fiche -->
      <section class="flex flex-wrap items-end gap-8 pt-10 lg:pt-24">
        <TiltedCard data-in class="hidden h-[320px] w-[240px] shrink-0 overflow-hidden rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.6)] sm:block">
          <img :src="game.cover" alt="" class="block size-full rounded-3xl object-cover" />
        </TiltedCard>
        <div class="flex min-w-0 flex-1 basis-[420px] flex-col gap-5">
          <div data-in class="flex flex-wrap items-center gap-2">
            <span class="eyebrow">{{ info.genre }}</span>
            <span class="rounded-full bg-white/[0.14] px-3 py-1.5 text-xs font-bold tracking-[0.14em] backdrop-blur-md">{{ game.state }}</span>
          </div>
          <h1 class="m-0 font-display text-[clamp(40px,7vw,84px)] font-black uppercase leading-[0.92] tracking-[-0.03em]"><SplitText :key="game.id" :text="game.title" :stagger="0.025" /></h1>
          <p data-in class="m-0 text-[15px] text-soft">{{ info.studio }} · {{ info.year }} · {{ info.size }} Go</p>
          <div data-in class="flex flex-wrap items-center gap-3">
            <Magnet :padding="30" :strength="0.25">
              <button type="button" class="flex h-[60px] items-center gap-2.5 rounded-full bg-accent px-10 text-[17px] font-extrabold text-ink">
                <svg v-if="game.installed" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6,4 20,12 6,20" /></svg>
                <ShinyText :speed="4">{{ cta }}</ShinyText>
              </button>
            </Magnet>
            <button type="button" class="flex h-[60px] items-center gap-2 rounded-full border border-white/[0.16] bg-ink/50 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" :fill="game.fav ? '#FF3D9A' : 'none'" stroke="#FF3D9A" stroke-width="2" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" /></svg>
              {{ game.fav ? 'Dans mes favoris' : 'Ajouter aux favoris' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Chiffres -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SpotlightCard data-stat class="card flex flex-col gap-1.5 p-6">
          <span class="text-[13px] text-mute">Temps de jeu</span>
          <span class="font-display text-5xl font-black leading-none"><CountUp :key="game.id" :to="hours" :duration="1.6" :delay="0.8" /><span class="text-[22px]"> h</span></span>
          <span class="text-[13px] text-mute">{{ owned ? 'Dernière session hier soir' : 'Pas encore joué' }}</span>
        </SpotlightCard>
        <div data-stat class="card flex items-center gap-[18px] p-6">
          <Ring :key="game.id" :value="game.progress" :size="92" :thickness="9" track="rgba(255,255,255,0.12)" inner="var(--color-panel)" :delay="0.9"><span class="font-display text-lg font-extrabold"><CountUp :to="game.progress" :duration="1.4" :delay="0.9" />%</span></Ring>
          <div class="flex flex-col gap-1"><span class="text-[13px] text-mute">Progression</span><span class="text-lg font-bold">{{ game.trophy }}</span></div>
        </div>
        <div data-stat class="card flex flex-col gap-2.5 p-6">
          <span class="text-[13px] text-mute">Succès</span>
          <span class="font-display text-[28px] font-extrabold"><CountUp :to="info.got" :duration="1.4" :delay="0.9" /> <span class="text-[15px] text-mute">/ {{ info.total }}</span></span>
          <div class="h-2 rounded bg-white/[0.12]"><div class="h-2 rounded bg-accent transition-[width] duration-1000" :style="{ width: achPct + '%' }" /></div>
        </div>
        <div data-stat class="card flex flex-col gap-3 p-6">
          <span class="text-[13px] text-mute">Amis qui y jouent</span>
          <div v-if="playing.length" class="flex">
            <span v-for="(f, i) in playing" :key="f.name" class="flex size-10 items-center justify-center rounded-full border-[3px] border-panel text-[13px] font-extrabold text-ink" :class="i ? '-ml-3' : ''" :style="{ background: f.col }" :title="f.name">{{ f.ini }}</span>
          </div>
          <span class="text-sm">{{ playing.length ? playing.map((f) => f.name).join(', ') + ' en ligne' : 'Personne en ce moment' }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section v-reveal class="flex flex-col gap-4 lg:col-span-2" aria-labelledby="about-h">
          <h2 id="about-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">À propos</h2>
          <BlurText :key="game.id" tag="p" :text="info.desc" :delay="0.2" :stagger="0.03" class="m-0 max-w-[720px] text-base leading-relaxed text-soft" />
          <div class="flex flex-wrap gap-2">
            <span v-for="t in info.tags" :key="t" class="rounded-full border border-white/[0.14] bg-panel/80 px-4 py-2 text-sm font-semibold">{{ t }}</span>
          </div>
        </section>

        <section class="flex flex-col gap-4" aria-labelledby="ach-h">
          <h2 id="ach-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">Succès</h2>
          <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
            <li v-for="a in info.ach" :key="a[0]" data-ach class="card flex items-center gap-3.5 p-4" :class="a[2] ? '' : 'opacity-60'">
              <span class="flex size-11 shrink-0 items-center justify-center rounded-full" :class="a[2] ? 'bg-accent text-ink' : 'bg-white/10 text-mute'">
                <svg width="18" height="18" viewBox="0 0 24 24" :fill="a[2] ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><rect x="11" y="14" width="2" height="5" /><rect x="8" y="19" width="8" height="2" /></svg>
              </span>
              <div class="flex min-w-0 flex-col gap-0.5"><strong class="text-sm">{{ a[0] }}</strong><span class="text-xs text-mute">{{ a[1] }}{{ a[2] ? '' : ' · verrouillé' }}</span></div>
            </li>
          </ul>
        </section>
      </div>

      <section v-if="similar.length" class="flex flex-col gap-4" aria-labelledby="sim-h">
        <h2 id="sim-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">Tu aimeras aussi</h2>
        <div v-reveal="{ children: true, stagger: 0.08 }" class="no-scrollbar flex gap-[18px] overflow-x-auto px-1 py-3">
          <RouterLink v-for="s in similar" :key="s.id" :to="'/jeu/' + s.id" class="flex w-[180px] shrink-0 flex-col gap-3 text-white no-underline">
            <TiltedCard class="h-60 overflow-hidden rounded-[22px]"><img :src="s.cover" alt="" class="block size-full rounded-[22px] object-cover" /></TiltedCard>
            <span class="text-[15px] font-bold">{{ s.title }}</span>
            <span class="-mt-2 text-xs text-mute">{{ details[s.id].genre }}</span>
          </RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>
