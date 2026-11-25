<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import SplitText from '../components/bits/SplitText.vue'
import Ring from '../components/bits/Ring.vue'
import CountUp from '../components/bits/CountUp.vue'
import { accents, byId, walls } from '../data/games'
import { setAccent, theme } from '../composables/useTheme'
import { prefersReduced } from '../composables/motion'

const densities = ['Compact', 'Confort', 'Géant']
const wall = computed(() => byId[theme.wall].wide)
const toggles = [
  ['startup', 'Lancer G.A au démarrage', 'Directement sur l’écran de chargement'],
  ['console', 'Mode console plein écran', 'Navigation à la manette, comme sur une PS5'],
  ['music', 'Musique du jeu sélectionné', 'Ambiance sonore sur l’accueil'],
  ['activity', 'Montrer mon activité', 'Tes amis voient à quoi tu joues'],
]

function wallEnter(el, done) {
  if (prefersReduced()) return done()
  gsap.fromTo(el, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', onComplete: done })
}
function wallLeave(el, done) {
  gsap.to(el, { opacity: 0, duration: 0.8, onComplete: done })
}

const root = ref(null)
let ctx
onMounted(() => {
  if (prefersReduced()) return
  ctx = gsap.context(() => {
    gsap.from('[data-banner]', { opacity: 0, y: 40, scale: 0.97, duration: 0.9, ease: 'power3.out', delay: 0.1 })
    gsap.from('[data-panel]', { opacity: 0, y: 50, stagger: 0.15, duration: 0.9, ease: 'power3.out', delay: 0.35 })
    gsap.from('[data-row]', { opacity: 0, x: 24, stagger: 0.07, duration: 0.6, ease: 'power3.out', delay: 0.7 })
  }, root.value)
})
onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div ref="root" class="relative min-h-screen overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <main class="relative flex flex-col gap-6 shell pb-14 pt-2">
      <section data-banner class="relative flex min-h-[260px] items-end overflow-hidden rounded-[28px]" aria-label="Profil">
        <div class="absolute inset-0 overflow-hidden">
          <Transition :css="false" @enter="wallEnter" @leave="wallLeave">
            <img :key="theme.wall" :src="wall" alt="" class="absolute inset-0 size-full object-cover" />
          </Transition>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-ink/95 to-ink/20 to-75%" />
        <div class="relative flex w-full flex-wrap items-end justify-between gap-5 px-8 py-7">
          <div class="flex items-center gap-5">
            <Ring :value="72" :size="104" :thickness="5" track="rgba(255,255,255,0.18)" inner="var(--color-ink)">
              <span class="m-1 flex size-[calc(100%-8px)] items-center justify-center rounded-full bg-avatar font-display text-4xl font-black">H</span>
            </Ring>
            <div class="flex flex-col gap-1.5">
              <span class="font-display text-[clamp(26px,4vw,38px)] font-black tracking-[-0.02em]"><SplitText text="hassan312" :delay="0.5" /></span>
              <span class="text-sm text-[#D7D8E0]">Niveau <CountUp :to="47" :duration="1.4" :delay="0.6" /> · 412 h de jeu · Dakar</span>
            </div>
          </div>
          <button type="button" class="h-[46px] rounded-full border border-white/20 bg-ink/55 px-[22px] text-sm font-bold text-white transition-colors hover:bg-white/10">Modifier le profil</button>
        </div>
      </section>

      <div class="flex flex-wrap items-start gap-5">
        <section data-panel class="card flex min-w-0 flex-[1_1_440px] flex-col gap-[26px] p-7" aria-labelledby="style-h">
          <div class="flex flex-col gap-1">
            <h1 id="style-h" class="m-0 font-display text-[26px] font-black">Ton style</h1>
            <span class="text-sm text-mute">Tout le launcher change en direct.</span>
          </div>
          <div class="flex flex-col gap-3">
            <span class="text-sm font-bold">Couleur d’accent</span>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="[name, hex] in accents"
                :key="hex"
                type="button"
                :aria-label="name"
                :aria-pressed="theme.accent.toLowerCase() === hex.toLowerCase()"
                class="size-12 rounded-full border-4 border-panel transition-transform duration-300 hover:scale-110 active:scale-90"
                :class="theme.accent.toLowerCase() === hex.toLowerCase() ? 'shadow-[0_0_0_2px_#fff]' : ''"
                :style="{ background: hex }"
                @click="setAccent(hex)"
              />
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <span class="text-sm font-bold">Fond de profil et d’accueil</span>
            <div class="grid grid-cols-4 gap-2.5">
              <button
                v-for="[name, slug] in walls"
                :key="slug"
                type="button"
                :aria-label="name"
                :aria-pressed="theme.wall === slug"
                class="h-[76px] overflow-hidden rounded-[14px] border-0 bg-avatar p-0 transition-all duration-300 hover:scale-105"
                :class="theme.wall === slug ? 'shadow-[0_0_0_3px_var(--accent)]' : ''"
                @click="theme.wall = slug"
              ><img :src="byId[slug].wide" alt="" class="block size-full object-cover" /></button>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <span id="dens-l" class="text-sm font-bold">Taille des jaquettes</span>
            <div class="relative flex rounded-full border border-white/[0.08] bg-ink p-[5px]" role="group" aria-labelledby="dens-l">
              <button
                v-for="d in densities"
                :key="d"
                type="button"
                :aria-pressed="theme.density === d"
                class="h-[42px] flex-1 rounded-full border-0 text-sm font-bold transition-all duration-300"
                :class="theme.density === d ? 'bg-accent text-ink' : 'bg-transparent text-white hover:bg-white/10'"
                @click="theme.density = d"
              >{{ d }}</button>
            </div>
          </div>
        </section>

        <section data-panel class="card flex min-w-0 flex-[1_1_440px] flex-col p-7" aria-labelledby="xp-h">
          <h2 id="xp-h" class="m-0 mb-2 font-display text-[26px] font-black">Ton expérience</h2>
          <div v-for="[key, label, hint] in toggles" :key="key" data-row class="flex items-center justify-between gap-5 border-b border-white/[0.07] py-4">
            <div class="flex flex-col gap-[3px]"><label :for="key" class="text-[15px] font-semibold">{{ label }}</label><span class="text-[13px] text-mute">{{ hint }}</span></div>
            <input :id="key" v-model="theme[key]" type="checkbox" class="nv-sw" />
          </div>
          <div data-row class="flex items-center justify-between gap-5 border-b border-white/[0.07] py-4">
            <div class="flex flex-col gap-[3px]"><label for="lang" class="text-[15px] font-semibold">Langue</label><span class="text-[13px] text-mute">Interface et sous-titres</span></div>
            <select id="lang" v-model="theme.lang" class="h-11 min-w-[170px] rounded-full border border-white/[0.14] bg-ink px-4 text-sm text-white"><option>Français</option><option>Wolof</option><option>English</option></select>
          </div>
          <div data-row class="flex items-center justify-between gap-5 py-4">
            <div class="flex flex-col gap-[3px]"><label for="bw" class="text-[15px] font-semibold">Limite de téléchargement</label><span class="text-[13px] text-mute">{{ theme.bandwidth }} Mo/s · la nuit : illimité</span></div>
            <input id="bw" v-model.number="theme.bandwidth" type="range" min="0" max="100" class="w-[180px] accent-[var(--accent)]" />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
