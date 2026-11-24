<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import PageBackdrop from '../components/PageBackdrop.vue'
import SplitText from '../components/bits/SplitText.vue'
import SpotlightCard from '../components/bits/SpotlightCard.vue'
import Magnet from '../components/bits/Magnet.vue'
import CountUp from '../components/bits/CountUp.vue'
import { bySlug, byId, compat, feed, friends } from '../data/games'
import { prefersReduced } from '../composables/motion'

const online = friends.filter((f) => f.online).length
const ring = (f) => (f.online ? 'conic-gradient(var(--accent), #2BD9FF, #FF3D9A, var(--accent))' : f.away ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)')
const statusCol = (f) => (f.online ? 'text-accent' : f.away ? 'text-amber' : 'text-mute')

const root = ref(null)
let ctx
onMounted(() => {
  if (prefersReduced()) return
  ctx = gsap.context(() => {
    gsap.from('[data-head] > *', { opacity: 0, y: 24, stagger: 0.12, duration: 0.8, ease: 'power3.out', delay: 0.1 })
    gsap.from('[data-friend]', { opacity: 0, scale: 0.5, y: 20, stagger: 0.07, duration: 0.7, ease: 'back.out(1.8)', delay: 0.35 })
    gsap.from('[data-tile]', { opacity: 0, y: 40, stagger: 0.12, duration: 0.8, ease: 'power3.out', delay: 0.6 })
    gsap.from('[data-compat]', { scaleX: 0, transformOrigin: 'left', stagger: 0.15, duration: 1.1, ease: 'power3.out', delay: 1 })
    // Anneaux des amis en ligne : lente rotation.
    gsap.to('[data-live-ring]', { rotate: 360, duration: 8, ease: 'none', repeat: -1 })
    gsap.to('[data-live-dot]', { scale: 1.6, opacity: 0.4, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut' })
  }, root.value)
})
onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div ref="root" class="relative min-h-screen overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <PageBackdrop :src="byId['neon-drift'].wide" :height="540" />

    <main class="relative flex flex-col gap-8 px-5 pb-14 pt-2 md:px-12">
      <div data-head class="flex flex-wrap items-end justify-between gap-5">
        <div class="flex flex-col gap-2">
          <span class="eyebrow"><CountUp :to="online" :duration="0.8" :delay="0.3" /> amis en ligne</span>
          <h1 class="page-title m-0"><SplitText text="Ton crew" :delay="0.15" /></h1>
        </div>
        <Magnet :padding="30" :strength="0.3">
          <button type="button" class="h-[50px] rounded-full bg-accent px-6 text-[15px] font-extrabold text-ink">+ Inviter un ami</button>
        </Magnet>
      </div>

      <div class="no-scrollbar flex gap-[22px] overflow-x-auto px-1 py-2" role="list" aria-label="Amis">
        <button v-for="f in friends" :key="f.name" data-friend type="button" role="listitem" class="group flex shrink-0 flex-col items-center gap-2.5 border-0 bg-transparent p-0 text-white">
          <span class="relative size-[88px] transition-transform duration-300 group-hover:scale-110">
            <span :data-live-ring="f.online ? '' : null" class="absolute inset-0 rounded-full" :style="{ background: ring(f) }" />
            <span class="absolute inset-1 flex items-center justify-center rounded-full border-4 border-ink font-display text-xl font-extrabold text-ink" :style="{ background: f.col }">{{ f.ini }}</span>
            <img v-if="f.playing" :src="bySlug[f.playing].cover" alt="" class="absolute -bottom-1 -right-1 size-8 rounded-[10px] border-[3px] border-ink object-cover" />
          </span>
          <span class="text-[13px] font-bold">{{ f.name }}</span>
          <span class="-mt-1.5 text-xs" :class="statusCol(f)">{{ f.status }}</span>
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SpotlightCard data-tile class="group relative flex min-h-[300px] flex-col justify-end rounded-3xl lg:col-span-2">
          <img :src="byId['tidebound'].wide" alt="" class="absolute inset-0 size-full object-cover transition-transform duration-[1400ms] group-hover:scale-105" />
          <div class="absolute inset-0 bg-gradient-to-r from-ink/90 to-ink/25 to-70%" />
          <div class="relative flex max-w-[520px] flex-col gap-3.5 p-8">
            <span class="flex items-center gap-2 self-start rounded-full border border-white/[0.16] bg-ink/60 px-3 py-1.5 text-xs font-extrabold tracking-[0.12em]"><span data-live-dot class="size-2 rounded-full bg-hot" />EN DIRECT · GROUPE VOCAL</span>
            <span class="font-display text-[clamp(26px,3.4vw,36px)] font-black leading-none">Awa t’attend sur Tidebound</span>
            <span class="text-[15px] text-[#D7D8E0]">2 / 4 places · Raid du chapitre 5 · lancé il y a 8 min</span>
            <div class="mt-1 flex flex-wrap gap-2.5">
              <button type="button" class="h-[50px] rounded-full bg-accent px-[26px] text-[15px] font-extrabold text-ink transition-transform hover:scale-105">Rejoindre la partie</button>
              <button type="button" class="h-[50px] rounded-full border border-white/20 bg-ink/50 px-[22px] text-[15px] font-semibold text-white transition-colors hover:bg-white/10">Écouter</button>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard data-tile class="card flex flex-col gap-4 p-6">
          <span class="font-display text-lg font-extrabold">Compatibilité</span>
          <div v-for="m in compat" :key="m.name" class="flex items-center gap-3">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-ink" :style="{ background: m.col }">{{ m.ini }}</span>
            <div class="flex flex-1 flex-col gap-1.5">
              <div class="flex justify-between text-sm"><strong>{{ m.name }}</strong><span class="font-extrabold text-accent"><CountUp :to="m.pct" :duration="1.4" :delay="0.9" />%</span></div>
              <div class="h-1.5 rounded-sm bg-white/10"><div data-compat class="h-1.5 rounded-sm bg-accent" :style="{ width: m.pct + '%' }" /></div>
              <span class="text-xs text-mute">{{ m.shared }}</span>
            </div>
          </div>
        </SpotlightCard>
      </div>

      <section class="flex flex-col gap-4" aria-labelledby="feed-h">
        <h2 id="feed-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">Ça s’est passé pendant ton absence</h2>
        <div v-reveal="{ children: true, stagger: 0.1 }" class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          <article v-for="e in feed" :key="e.who + e.when" class="card group flex flex-col overflow-hidden">
            <div class="relative h-[140px]">
              <img :src="bySlug[e.slug].wide" alt="" class="block size-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <span class="absolute -bottom-[18px] left-3.5 flex size-10 items-center justify-center rounded-full border-[3px] border-panel text-[13px] font-extrabold text-ink" :style="{ background: e.col }">{{ e.ini }}</span>
            </div>
            <div class="flex flex-col gap-1.5 px-[18px] pb-[18px] pt-[26px]">
              <span class="text-sm leading-[1.45]"><strong>{{ e.who }}</strong> {{ e.what }}</span>
              <span class="text-xs text-mute">{{ e.when }}</span>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>
