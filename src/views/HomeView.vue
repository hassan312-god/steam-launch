<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import SplitText from '../components/bits/SplitText.vue'
import BlurText from '../components/bits/BlurText.vue'
import CountUp from '../components/bits/CountUp.vue'
import Magnet from '../components/bits/Magnet.vue'
import ShinyText from '../components/bits/ShinyText.vue'
import { byId, homeGameIds, moods, weekHours } from '../data/games'
import { theme } from '../composables/useTheme'
import { prefersReduced } from '../composables/motion'

const all = homeGameIds.map((id) => byId[id])
const mood = ref('tout')
const sel = ref(0)
const games = computed(() => all.filter((g) => mood.value === 'tout' || g.moods.includes(mood.value)))
const hero = computed(() => games.value[Math.min(sel.value, games.value.length - 1)])
const scale = computed(() => ({ Compact: 0.85, Confort: 1, Géant: 1.2 })[theme.density] ?? 1)
const bestDay = weekHours.indexOf(Math.max(...weekHours))
const hint = ref(null)

function pickMood(k) {
  mood.value = k
  sel.value = 0
}

// Navigation « manette » : flèches gauche / droite pour parcourir les jaquettes.
function onKey(e) {
  if (e.target.closest?.('input, select, textarea')) return
  if (e.key === 'ArrowRight') sel.value = Math.min(sel.value + 1, games.value.length - 1)
  else if (e.key === 'ArrowLeft') sel.value = Math.max(sel.value - 1, 0)
}

// Fond du héros : fondu enchaîné + lent zoom (Ken Burns) piloté par GSAP.
function heroEnter(el, done) {
  if (prefersReduced()) return done()
  gsap.fromTo(el, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1.02, duration: 0.9, ease: 'power2.out', onComplete: done })
  gsap.to(el, { scale: 1.1, duration: 20, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.9 })
}
function heroLeave(el, done) {
  gsap.killTweensOf(el)
  gsap.to(el, { opacity: 0, duration: 0.7, ease: 'power2.inOut', onComplete: done })
}
// Rangée de jaquettes : entrée échelonnée.
function coverEnter(el, done) {
  if (prefersReduced()) return done()
  gsap.fromTo(el, { opacity: 0, x: 60, scale: 0.85 }, { opacity: 1, x: 0, scale: 1, duration: 0.6, delay: el.dataset.i * 0.06, ease: 'back.out(1.4)', onComplete: done })
}
function coverLeave(el, done) {
  gsap.to(el, { opacity: 0, scale: 0.8, duration: 0.2, onComplete: done })
}

let ctx
const root = ref(null)
onMounted(() => {
  window.addEventListener('keydown', onKey)
  if (prefersReduced()) return
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('[data-mood]', { opacity: 0, y: 14, stagger: 0.06, duration: 0.5 }, 0.4)
      .from('[data-stat]', { opacity: 0, y: 30, scale: 0.94, stagger: 0.12, duration: 0.8 }, 0.5)
      .from('[data-bar]', { scaleY: 0, transformOrigin: 'bottom', stagger: 0.07, duration: 0.6, ease: 'back.out(1.7)' }, 0.9)
      .from('[data-chip]', { opacity: 0, y: 16, stagger: 0.1, duration: 0.6 }, 0.9)
      .from('[data-play]', { opacity: 0, scale: 0.8, duration: 0.7, ease: 'back.out(1.8)' }, 1.0)
    gsap.to('[data-play-glow]', { opacity: 0.55, scale: 1.12, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 })
  }, root.value)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  ctx?.revert()
})

// Le titre et les puces se rejouent quand le jeu sélectionné change.
watch(hero, async () => {
  if (prefersReduced()) return
  await nextTick()
  gsap.fromTo('[data-chip], [data-tag]', { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.5, ease: 'power3.out', overwrite: true })
})
</script>

<template>
  <main ref="root" class="relative flex min-h-screen min-w-0 flex-col overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <!-- Fond héros -->
    <div aria-hidden="true" class="absolute inset-0 overflow-hidden">
      <Transition :css="false" appear @enter="heroEnter" @leave="heroLeave">
        <img :key="hero.id" :src="hero.wide" alt="" class="absolute inset-0 size-full object-cover" />
      </Transition>
    </div>
    <div aria-hidden="true" class="absolute inset-0 bg-gradient-to-r from-ink/85 from-0% via-ink/35 via-45% to-ink/10" />
    <div aria-hidden="true" class="absolute inset-0" style="background: linear-gradient(180deg, rgba(6,6,10,0.7) 0%, rgba(6,6,10,0) 20%, rgba(6,6,10,0) 45%, rgba(6,6,10,0.92) 80%, #06060A 100%)" />

    <!-- Bonsoir + humeurs + stats -->
    <section class="relative flex flex-wrap items-start justify-between gap-6 px-5 pt-3 md:px-12">
      <div class="flex flex-col gap-3.5">
        <span class="eyebrow tracking-[0.2em]">Bonsoir, Hassan</span>
        <BlurText tag="span" text="Envie de quoi ce soir ?" :delay="0.3" class="font-display text-[26px] font-extrabold" />
        <div class="flex flex-wrap gap-2" role="group" aria-label="Humeur">
          <button
            v-for="[k, label] in moods"
            :key="k"
            type="button"
            data-mood
            :aria-pressed="mood === k"
            class="h-10 rounded-full border px-4 text-sm font-semibold backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
            :class="mood === k ? 'border-accent bg-accent text-ink' : 'border-white/15 bg-ink/50 text-white hover:border-white/40'"
            @click="pickMood(k)"
          >{{ label }}</button>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <div data-stat class="glass flex w-[200px] flex-col gap-2.5 rounded-[22px] p-[18px] backdrop-blur-xl">
          <span class="text-xs font-semibold text-soft">Ta semaine</span>
          <span class="font-display text-[26px] font-extrabold"><CountUp :to="14" :duration="1.6" :delay="0.6" /> h 20</span>
          <div class="flex h-9 items-end gap-[5px]" role="img" aria-label="Heures jouées par jour cette semaine">
            <span v-for="(h, i) in weekHours" :key="i" data-bar class="flex-1 rounded-[3px]" :class="i === bestDay ? 'bg-accent' : 'bg-white/[0.28]'" :style="{ height: Math.max(10, Math.round((h / 4) * 100)) + '%' }" />
          </div>
        </div>
        <div data-stat class="glass flex w-40 flex-col gap-2 rounded-[22px] p-[18px] backdrop-blur-xl">
          <span class="text-xs font-semibold text-soft">Série en cours</span>
          <svg class="origin-bottom animate-[flame_1.6s_ease-in-out_infinite]" width="28" height="28" viewBox="0 0 24 24" fill="#FF7A2F" aria-hidden="true"><path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" /></svg>
          <span class="font-display text-[22px] font-extrabold"><CountUp :to="6" :duration="1" :delay="0.8" /> jours</span>
        </div>
      </div>
    </section>

    <!-- Héros + rangée de jeux -->
    <section class="relative mt-auto flex flex-col gap-6 pb-8 pt-20">
      <div class="flex flex-wrap items-end justify-between gap-6 px-5 md:px-12">
        <div class="flex max-w-[760px] flex-col gap-4">
          <span data-tag class="self-start rounded-full bg-white/[0.14] px-3 py-1.5 text-xs font-bold tracking-[0.14em] backdrop-blur-md">{{ hero.tag }}</span>
          <h1 class="m-0 font-display text-[clamp(40px,7vw,76px)] font-black uppercase leading-[0.92] tracking-[-0.03em]">
            <SplitText :text="hero.title" :stagger="0.025" />
          </h1>
          <div class="flex flex-wrap gap-2.5 text-sm">
            <span data-chip class="rounded-[14px] border border-white/[0.12] bg-ink/50 px-3.5 py-2.5"><span class="text-soft">Temps · </span><strong>{{ hero.time }}</strong></span>
            <span data-chip class="rounded-[14px] border border-white/[0.12] bg-ink/50 px-3.5 py-2.5"><span class="text-soft">Progression · </span><strong><CountUp :to="hero.progress" :duration="1.1" /> %</strong></span>
            <span data-chip class="flex items-center gap-2 rounded-[14px] border border-white/[0.12] bg-ink/50 px-3.5 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5C451" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><rect x="11" y="14" width="2" height="5" /><rect x="8" y="19" width="8" height="2" /></svg>
              <strong>{{ hero.trophy }}</strong>
            </span>
          </div>
        </div>
        <div class="flex gap-3">
          <Magnet :padding="30" :strength="0.25">
            <span class="relative inline-flex">
              <span data-play-glow aria-hidden="true" class="absolute inset-0 rounded-full bg-accent opacity-25 blur-xl" />
              <button data-play type="button" class="relative flex h-[60px] items-center gap-2.5 rounded-full bg-accent px-10 text-[17px] font-extrabold text-ink">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6,4 20,12 6,20" /></svg>
                <ShinyText :speed="4">Jouer</ShinyText>
              </button>
            </span>
          </Magnet>
          <button type="button" aria-label="Plus d’options" class="size-[60px] rounded-full border border-white/[0.16] bg-ink/50 text-xl font-extrabold text-white transition-colors hover:bg-white/10">···</button>
        </div>
      </div>

      <div class="no-scrollbar flex items-end gap-4 overflow-x-auto px-5 pb-1.5 pt-3.5 md:px-12" role="listbox" aria-label="Jeux" aria-orientation="horizontal">
        <TransitionGroup :css="false" appear @enter="coverEnter" @leave="coverLeave">
          <button
            v-for="(g, i) in games"
            :key="g.id"
            :data-i="i"
            type="button"
            role="option"
            :aria-selected="i === sel"
            :aria-label="g.title"
            class="shrink-0 overflow-hidden rounded-[20px] border-0 bg-panel-2 p-0 transition-all duration-[220ms] ease-out hover:opacity-100"
            :class="i === sel ? 'opacity-100 shadow-[0_0_0_3px_var(--accent),0_24px_60px_rgba(0,0,0,0.6)]' : 'opacity-[0.82] shadow-[0_12px_30px_rgba(0,0,0,0.45)]'"
            :style="{ width: (i === sel ? 168 : 132) * scale + 'px', height: (i === sel ? 224 : 176) * scale + 'px' }"
            @click="sel = i"
          >
            <img :src="g.cover" alt="" class="block size-full object-cover" />
          </button>
        </TransitionGroup>
        <RouterLink to="/bibliotheque" class="flex h-[176px] w-[132px] shrink-0 flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-white/30 text-[13px] font-semibold text-fog no-underline transition-colors hover:border-accent hover:text-accent" :style="{ height: 176 * scale + 'px', width: 132 * scale + 'px' }">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          Tout voir
        </RouterLink>
      </div>
      <p ref="hint" class="px-5 text-xs text-mute md:px-12">Astuce : utilise les flèches ← → pour parcourir tes jeux.</p>
    </section>
  </main>
</template>

<style>
@keyframes flame {
  0%, 100% { transform: scale(1) rotate(-2deg); }
  50% { transform: scale(1.12, 1.2) rotate(3deg); }
}
</style>
