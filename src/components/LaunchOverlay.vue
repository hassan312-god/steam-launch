<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { close, finish, launch } from '../composables/useLaunch'
import { prefersReduced } from '../composables/motion'

const bar = ref(0)
const root = ref(null)
let tl

watch(() => launch.game, async (g) => {
  tl?.kill()
  if (!g) return
  bar.value = 0
  await nextTick()
  const dur = prefersReduced() ? 0.3 : launch.mode === 'install' ? 4 : 3
  if (!prefersReduced()) {
    gsap.fromTo(root.value, { opacity: 0 }, { opacity: 1, duration: 0.4 })
    gsap.from('[data-lo-cover]', { scale: 0.7, y: 40, opacity: 0, duration: 0.8, ease: 'back.out(1.5)' })
    gsap.from('[data-lo-text] > *', { y: 20, opacity: 0, stagger: 0.1, duration: 0.6, delay: 0.2, ease: 'power3.out' })
  }
  const o = { v: 0 }
  tl = gsap.to(o, { v: 100, duration: dur, ease: 'power1.inOut', onUpdate: () => (bar.value = Math.round(o.v)), onComplete: () => setTimeout(finish, 350) })
})
const onKey = (e) => e.key === 'Escape' && launch.game && close()
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  tl?.kill()
})
</script>

<template>
  <div v-if="launch.game" ref="root" class="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-ink" role="dialog" aria-modal="true" :aria-label="launch.mode === 'install' ? 'Installation' : 'Lancement'">
    <img :src="launch.game.wide" alt="" class="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-sm" />
    <div class="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/80" />
    <div class="relative flex w-[min(720px,calc(100%-40px))] flex-wrap items-center justify-center gap-8 sm:flex-nowrap">
      <img data-lo-cover :src="launch.game.cover" alt="" class="h-[300px] w-[200px] shrink-0 rounded-3xl object-cover shadow-[0_30px_80px_rgba(0,0,0,0.7)]" />
      <div data-lo-text class="flex min-w-0 flex-1 basis-[280px] flex-col gap-4">
        <span class="eyebrow">{{ launch.mode === 'install' ? 'Installation en cours' : 'Lancement' }}</span>
        <h2 class="m-0 font-display text-[clamp(26px,4vw,40px)] font-black uppercase leading-none">{{ launch.game.title }}</h2>
        <p v-if="launch.note" class="m-0 text-sm text-soft">{{ launch.note }}</p>
        <div class="flex flex-col gap-2">
          <div class="h-1.5 overflow-hidden rounded-full bg-white/[0.14]" role="progressbar" :aria-valuenow="bar" aria-valuemin="0" aria-valuemax="100"><div class="h-full rounded-full bg-accent" :style="{ width: bar + '%' }" /></div>
          <div class="flex justify-between text-[13px] font-semibold tracking-[0.08em] text-soft"><span>{{ launch.mode === 'install' ? 'TÉLÉCHARGEMENT' : 'PRÉPARATION' }}</span><span class="text-white tabular-nums">{{ bar }} %</span></div>
        </div>
        <button type="button" class="mt-2 h-11 self-start rounded-full border border-white/20 bg-ink/50 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10" @click="close">Annuler</button>
      </div>
    </div>
  </div>
</template>
