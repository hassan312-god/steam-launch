<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import Logo from '../components/Logo.vue'
import BlurText from '../components/bits/BlurText.vue'
import CountUp from '../components/bits/CountUp.vue'
import Magnet from '../components/bits/Magnet.vue'
import { games } from '../data/games'
import { prefersReduced } from '../composables/motion'

const router = useRouter()
const root = ref(null)
const enter = ref(null)
const done = ref(false)
const SEGMENTS = 10
const FILLED = 7

// Mur de jaquettes : 6 colonnes dont le contenu est doublé pour une boucle sans couture.
const covers = games.slice(0, 24).map((g) => g.cover)
const cols = Array.from({ length: 6 }, (_, c) => {
  const half = Array.from({ length: 6 }, (_, r) => covers[(c * 3 + r * 7) % covers.length])
  return half.concat(half)
})

let ctx
onMounted(() => {
  ctx = gsap.context(() => {
    if (prefersReduced()) {
      done.value = true
      return
    }
    // Défilement continu, une colonne sur deux en sens inverse.
    gsap.utils.toArray('[data-col]').forEach((el, i) => {
      const up = i % 2 === 0
      gsap.fromTo(el, { yPercent: up ? 0 : -50 }, { yPercent: up ? -50 : 0, duration: up ? 40 : 46, ease: 'none', repeat: -1 })
    })
    gsap.from('[data-wall]', { opacity: 0, scale: 1.15, duration: 1.8, ease: 'power3.out' })
    gsap.from('[data-logo] > *', { yPercent: 120, opacity: 0, duration: 1, stagger: 0.12, ease: 'power4.out', delay: 0.2 })
    gsap.from('[data-seg]', { scaleX: 0, transformOrigin: 'left', duration: 0.4, stagger: 0.1, delay: 0.9, ease: 'power2.out', onComplete: () => (done.value = true) })
  }, root.value)
})
onBeforeUnmount(() => ctx?.revert())
const go = () => router.push('/accueil')
// Dès que la synchronisation est finie, le bouton « Entrer » apparaît.
watch(done, async (v) => {
  if (!v || prefersReduced()) return
  await nextTick()
  gsap.fromTo(enter.value, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
})
</script>

<template>
  <main ref="root" class="relative h-screen min-h-[640px] overflow-hidden bg-ink">
    <div data-wall aria-hidden="true" class="absolute inset-0" style="perspective: 1400px">
      <div class="absolute -top-[40%] left-[34%] flex h-[2000px] w-[1300px] gap-[22px]" style="transform: rotateX(28deg) rotateY(-22deg) rotateZ(14deg); transform-style: preserve-3d">
        <div v-for="(col, i) in cols" :key="i" data-col class="flex flex-1 flex-col gap-[22px] will-change-transform">
          <img v-for="(src, j) in col" :key="j" :src="src" alt="" class="block aspect-[2/3] w-full rounded-2xl object-cover shadow-[0_30px_60px_rgba(0,0,0,0.55)]" />
        </div>
      </div>
    </div>
    <div class="absolute inset-0 bg-gradient-to-r from-ink from-0% via-ink/95 via-30% to-ink/10" />
    <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(6,6,10,0.7) 0%, rgba(6,6,10,0) 18%, rgba(6,6,10,0) 80%, rgba(6,6,10,0.85) 100%)" />

    <div class="absolute left-5 top-1/2 flex w-[min(520px,calc(100%-40px))] -translate-y-1/2 flex-col gap-7 md:left-20">
      <h1 data-logo class="m-0 flex overflow-hidden pb-2 leading-[0.85]" aria-label="G.A">
        <span class="inline-block"><Logo size="clamp(96px, 16vw, 168px)" /></span>
      </h1>
      <BlurText tag="p" text="Tous tes jeux. Un seul endroit. On prépare ta bibliothèque." :delay="0.7" class="m-0 text-xl leading-normal text-soft" />

      <div class="mt-3 flex flex-col gap-3">
        <div class="flex gap-1.5" role="img" :aria-label="`Progression ${FILLED * 10} %`">
          <span v-for="i in SEGMENTS" :key="i" data-seg class="h-1.5 flex-1 rounded-[3px]" :class="i <= FILLED ? 'bg-accent' : 'bg-white/[0.14]'" />
        </div>
        <div class="flex justify-between text-[13px] font-semibold tracking-[0.08em] text-soft">
          <span>SYNCHRONISATION · <CountUp :to="150" :duration="2" :delay="0.9" /> / 214 JEUX</span>
          <span class="text-white"><CountUp :to="70" :duration="2" :delay="0.9" /> %</span>
        </div>
      </div>

      <div ref="enter" class="self-start" :class="{ invisible: !done }">
        <Magnet :padding="40" :strength="0.3">
          <button type="button" class="flex h-[52px] items-center gap-2.5 rounded-full bg-accent px-7 text-[15px] font-bold text-ink" @click="go">
            Entrer
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" /></svg>
          </button>
        </Magnet>
      </div>
    </div>
  </main>
</template>
