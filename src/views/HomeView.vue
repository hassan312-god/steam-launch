<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import SplitText from '../components/bits/SplitText.vue'
import BlurText from '../components/bits/BlurText.vue'
import CountUp from '../components/bits/CountUp.vue'
import Magnet from '../components/bits/Magnet.vue'
import ShinyText from '../components/bits/ShinyText.vue'
import TrailerVideo from '../components/TrailerVideo.vue'
import { fmt, getGame, libraryAll, lookup, moods, newReleases as catNew, specials as catSpecials, topSellers as catTop } from '../data/games'
import { displayName } from '../composables/useSteam'
import { play } from '../composables/useLaunch'
import { theme } from '../composables/useTheme'
import { prefersReduced } from '../composables/motion'

// Vitrine Steam en direct (/api/steam/store) ; repli sur le catalogue embarqué si la fonction est indisponible.
const toItem = (g) => ({ id: g.id, title: g.title, header: g.wide, cover: g.cover, discount: g.discount, price: g.price, free: g.free })
const fallback = () => [
  { id: 'top_sellers', title: 'Meilleures ventes', sub: 'Le classement Steam du moment', items: catTop.map(toItem) },
  { id: 'specials', title: 'Promotions du moment', sub: 'Les offres en cours sur Steam', items: catSpecials.map(toItem) },
  { id: 'new_releases', title: 'Nouveautés', sub: 'Les dernières sorties', items: catNew.map(toItem) },
].filter((x) => x.items.length)
const sections = ref([])
const live = ref(false)
fetch('/api/steam/store')
  .then((r) => (r.ok ? r.json() : Promise.reject()))
  .then((d) => {
    sections.value = d.sections
    live.value = true
  })
  .catch(() => (sections.value = fallback()))
if (!sections.value.length) sections.value = fallback()

const TAGS = { top_sellers: 'MEILLEURE VENTE', specials: 'EN PROMOTION', new_releases: 'NOUVEAUTÉ', coming_soon: 'PROCHAINEMENT' }
const tagFor = (id, discount) => {
  const sec = sections.value.find((x) => x.items.some((i) => i.id === id))
  return sec ? (sec.id === 'specials' && discount ? `EN PROMOTION · -${discount} %` : TAGS[sec.id]) : 'À LA UNE'
}

// Le héros : meilleures ventes et promotions Steam, sans doublon.
const items = computed(() => {
  const seen = new Set()
  return ['top_sellers', 'specials', 'new_releases']
    .flatMap((k) => sections.value.find((x) => x.id === k)?.items ?? [])
    .filter((i) => (seen.has(i.id) ? false : seen.add(i.id)))
    .slice(0, 12)
})

const mood = ref('tout')
const sel = ref(0)
// Les humeurs s'appliquent aux jeux dont on connaît les genres (catalogue) ; « Tout » montre toute la vitrine.
const list = computed(() => items.value.filter((i) => mood.value === 'tout' || lookup(i.id)?.moods.includes(mood.value)))
const current = computed(() => list.value[Math.min(sel.value, list.value.length - 1)] ?? items.value[0])
const detail = reactive({})
const hero = computed(() => {
  const c = current.value
  return detail[c.id] ?? lookup(c.id) ?? { id: c.id, title: c.title, wide: c.header, cover: c.cover, movies: [], year: '', price: c.price, discount: c.discount, metacritic: null, recs: 0, owned: false, free: c.free, moods: [] }
})
// Fiche complète du jeu sélectionné (catalogue, sinon chargée à la volée) : vidéo, note, date de sortie…
watch(current, (c) => c && !detail[c.id] && getGame(c.id).then((g) => (detail[c.id] = g)).catch(() => {}), { immediate: true })
const hello = computed(() => (new Date().getHours() >= 18 || new Date().getHours() < 5 ? 'Bonsoir' : 'Bonjour') + ', ' + displayName.value)
const specialsAll = computed(() => sections.value.find((x) => x.id === 'specials')?.items ?? [])
const maxDiscount = computed(() => Math.max(0, ...specialsAll.value.map((i) => i.discount)))

const vw = ref(typeof window === 'undefined' ? 1440 : window.innerWidth)
const onResize = () => (vw.value = window.innerWidth)
// Les jaquettes grandissent sur les grands écrans (PC 1080p / 1440p) et suivent le réglage de densité.
const scale = computed(() => ({ Compact: 0.85, Confort: 1, Géant: 1.2 })[theme.density] * (vw.value >= 2200 ? 1.5 : vw.value >= 1700 ? 1.25 : vw.value < 640 ? 0.85 : 1))
const clip = computed(() => (prefersReduced() || !theme.bgVideo ? null : hero.value.movies?.[0] ?? null))
const videoOn = ref(false)
let vt
const onPlaying = () => { clearTimeout(vt); vt = setTimeout(() => (videoOn.value = true), 600) }
watch(() => hero.value.id, () => { clearTimeout(vt); videoOn.value = false })

function pickMood(k) {
  mood.value = k
  sel.value = 0
}
// Navigation « manette » : flèches gauche / droite pour parcourir les jaquettes.
function onKey(e) {
  if (e.target.closest?.('input, select, textarea')) return
  if (e.key === 'ArrowRight') sel.value = Math.min(sel.value + 1, list.value.length - 1)
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
  window.addEventListener('resize', onResize)
  if (prefersReduced()) return
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('[data-mood]', { opacity: 0, y: 14, stagger: 0.06, duration: 0.5 }, 0.4)
      .from('[data-stat]', { opacity: 0, y: 30, scale: 0.94, stagger: 0.12, duration: 0.8 }, 0.5)
      .from('[data-chip]', { opacity: 0, y: 16, stagger: 0.1, duration: 0.6 }, 0.9)
      .from('[data-play]', { opacity: 0, scale: 0.8, duration: 0.7, ease: 'back.out(1.8)' }, 1.0)
    gsap.to('[data-play-glow]', { opacity: 0.55, scale: 1.12, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 })
  }, root.value)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
  ctx?.revert()
})
watch(hero, async () => {
  if (prefersReduced()) return
  await nextTick()
  gsap.fromTo('[data-chip], [data-tag]', { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.5, ease: 'power3.out', overwrite: true })
})
</script>

<template>
  <div class="bg-ink">
  <section ref="root" class="relative flex min-h-screen min-w-0 flex-col overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <!-- Fond héros -->
    <div aria-hidden="true" class="absolute inset-0 overflow-hidden">
      <Transition :css="false" appear @enter="heroEnter" @leave="heroLeave">
        <div :key="hero.id" class="absolute inset-0">
          <img :src="hero.wide" alt="" class="absolute inset-0 size-full object-cover" />
          <TrailerVideo v-if="clip" :key="clip.hls" ambient :start-at="7" :sound="theme.trailerSound" :src="clip.hls" class="absolute inset-0 size-full object-cover transition-opacity duration-[1200ms]" :class="videoOn ? 'opacity-100' : 'opacity-0'" @playing="onPlaying" />
        </div>
      </Transition>
    </div>
    <div aria-hidden="true" class="absolute inset-0 bg-gradient-to-r from-ink/85 from-0% via-ink/35 via-45% to-ink/10" />
    <div aria-hidden="true" class="absolute inset-0" style="background: linear-gradient(180deg, rgba(6,6,10,0.7) 0%, rgba(6,6,10,0) 20%, rgba(6,6,10,0) 45%, rgba(6,6,10,0.92) 80%, #06060A 100%)" />

    <section class="relative flex flex-wrap items-start justify-between gap-6 shell pt-3">
      <div class="flex flex-col gap-3.5">
        <span class="eyebrow tracking-[0.2em]">{{ hello }}</span>
        <BlurText tag="span" text="Envie de quoi ce soir ?" :delay="0.3" class="font-display text-[26px] font-extrabold" />
        <div class="flex flex-wrap gap-2" role="group" aria-label="Humeur">
          <button
            v-for="[k, label] in moods"
            :key="k"
            type="button"
            data-mood
            :aria-pressed="mood === k"
            class="h-10 rounded-full border px-4 text-sm font-semibold backdrop-blur-md transition-colors duration-300"
            :class="mood === k ? 'border-accent bg-accent text-ink' : 'border-white/15 bg-ink/50 text-white hover:border-white/40'"
            @click="pickMood(k)"
          >{{ label }}</button>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <RouterLink data-stat to="/bibliotheque" class="glass flex w-[200px] flex-col gap-2.5 rounded-[22px] p-[18px] text-white no-underline backdrop-blur-xl transition-transform hover:-translate-y-1">
          <span class="text-xs font-semibold text-soft">Ma bibliothèque</span>
          <span class="font-display text-[26px] font-extrabold"><CountUp :to="libraryAll.length" :duration="1.2" :delay="0.6" /> <span class="text-base">jeu{{ libraryAll.length > 1 ? 'x' : '' }}</span></span>
          <span class="text-xs text-mute">{{ libraryAll.length ? 'Voir ma collection' : 'Ajoute des jeux depuis leur fiche' }}</span>
        </RouterLink>
        <RouterLink data-stat to="/magasin" class="glass flex w-[200px] flex-col gap-2.5 rounded-[22px] p-[18px] text-white no-underline backdrop-blur-xl transition-transform hover:-translate-y-1">
          <span class="text-xs font-semibold text-soft">Promotions Steam</span>
          <span class="font-display text-[26px] font-extrabold"><CountUp :to="specialsAll.length" :duration="1.2" :delay="0.8" /> <span class="text-base">en solde</span></span>
          <span class="text-xs text-mute">Jusqu’à -{{ maxDiscount }} %</span>
        </RouterLink>
      </div>
    </section>

    <section class="relative mt-auto flex flex-col gap-6 pb-8 pt-20">
      <div class="flex flex-wrap items-end justify-between gap-6 shell">
        <div class="flex max-w-[min(62vw,1100px)] flex-col gap-4">
          <span data-tag class="self-start rounded-full bg-white/[0.14] px-3 py-1.5 text-xs font-bold tracking-[0.14em] backdrop-blur-md">{{ tagFor(hero.id, hero.discount) }}</span>
          <h1 class="m-0 font-display text-[clamp(36px,5.2vw,96px)] font-black uppercase leading-[0.92] tracking-[-0.03em]">
            <SplitText :text="hero.title" :stagger="0.025" />
          </h1>
          <div class="flex flex-wrap gap-2.5 text-sm">
            <span data-chip class="rounded-[14px] border border-white/[0.12] bg-ink/50 px-3.5 py-2.5"><span class="text-soft">Sortie · </span><strong>{{ hero.year || '—' }}</strong></span>
            <span data-chip class="rounded-[14px] border border-white/[0.12] bg-ink/50 px-3.5 py-2.5"><span class="text-soft">Prix · </span><strong>{{ hero.price || '—' }}</strong><span v-if="hero.discount" class="ml-2 rounded-md bg-hot px-1.5 py-0.5 text-xs font-extrabold text-ink">-{{ hero.discount }} %</span></span>
            <span v-if="hero.metacritic" data-chip class="flex items-center gap-2 rounded-[14px] border border-white/[0.12] bg-ink/50 px-3.5 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5C451" aria-hidden="true"><polygon points="12,2 15,9 22,9.5 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9.5 9,9" /></svg>
              <strong>Metacritic {{ hero.metacritic }}</strong>
            </span>
            <span v-else-if="hero.recs" data-chip class="rounded-[14px] border border-white/[0.12] bg-ink/50 px-3.5 py-2.5"><strong>{{ fmt.format(hero.recs) }}</strong><span class="text-soft"> avis Steam</span></span>
          </div>
        </div>
        <div class="flex gap-3">
          <Magnet :padding="30" :strength="0.25">
            <span class="relative inline-flex">
              <span data-play-glow aria-hidden="true" class="absolute inset-0 rounded-full bg-accent opacity-25 blur-xl" />
              <button v-if="hero.owned" data-play type="button" class="relative flex h-[60px] items-center gap-2.5 rounded-full bg-accent px-10 text-[17px] font-extrabold text-ink" @click="play(hero)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6,4 20,12 6,20" /></svg>
                <ShinyText :speed="4">{{ hero.installed ? 'Jouer' : 'Installer' }}</ShinyText>
              </button>
              <RouterLink v-else data-play :to="'/jeu/' + hero.id" class="relative flex h-[60px] items-center gap-2.5 rounded-full bg-accent px-10 text-[17px] font-extrabold text-ink no-underline">
                <ShinyText :speed="4">Voir la fiche</ShinyText>
              </RouterLink>
            </span>
          </Magnet>
          <RouterLink :to="'/jeu/' + hero.id" aria-label="Voir la fiche du jeu" class="flex size-[60px] items-center justify-center rounded-full border border-white/[0.16] bg-ink/50 text-xl font-extrabold text-white no-underline transition-colors hover:bg-white/10">···</RouterLink>
        </div>
      </div>

      <div class="no-scrollbar flex items-end gap-4 overflow-x-auto shell pb-1.5 pt-3.5" role="listbox" aria-label="Jeux" aria-orientation="horizontal">
        <TransitionGroup :css="false" appear @enter="coverEnter" @leave="coverLeave">
          <button
            v-for="(g, i) in list"
            :key="g.id"
            :data-i="i"
            type="button"
            role="option"
            :aria-selected="i === sel"
            :aria-label="g.title"
            class="shrink-0 overflow-hidden rounded-[20px] border-0 bg-panel-2 p-0 transition-all duration-[220ms] ease-out hover:opacity-100"
            :class="i === sel ? 'opacity-100 shadow-[0_0_0_3px_var(--accent),0_24px_60px_rgba(0,0,0,0.6)]' : 'opacity-[0.82] shadow-[0_12px_30px_rgba(0,0,0,0.45)]'"
            :style="{ width: (i === sel ? 168 : 132) * scale + 'px', height: (i === sel ? 252 : 198) * scale + 'px' }"
            @click="sel = i"
          >
            <img :src="g.cover" alt="" class="block size-full object-cover" @error="$event.target.src = g.header" />
          </button>
        </TransitionGroup>
        <RouterLink to="/magasin" class="flex shrink-0 flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-white/30 text-[13px] font-semibold text-fog no-underline transition-colors hover:border-accent hover:text-accent" :style="{ height: 198 * scale + 'px', width: 132 * scale + 'px' }">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          Tout voir
        </RouterLink>
      </div>
      <p class="shell text-xs text-mute">Astuce : utilise les flèches ← → pour parcourir les jeux.</p>
    </section>
  </section>

  <!-- Les vitrines Steam du moment -->
  <div class="shell flex flex-col gap-10 pb-16 pt-6">
    <div class="flex items-center gap-3">
      <h2 class="m-0 font-display text-[clamp(22px,2.6vw,30px)] font-black">Proposé par Steam</h2>
      <span class="rounded-full border border-white/10 px-3 py-1 text-xs font-bold tracking-[0.1em]" :class="live ? 'text-accent' : 'text-mute'">{{ live ? 'EN DIRECT' : 'HORS LIGNE' }}</span>
    </div>
    <section v-for="s in sections" :key="s.id" v-reveal class="flex flex-col gap-4" :aria-labelledby="'h-' + s.id">
      <div class="flex items-baseline justify-between gap-4"><h3 :id="'h-' + s.id" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">{{ s.title }}</h3><span class="text-sm text-mute">{{ s.sub }}</span></div>
      <div class="no-scrollbar flex gap-[18px] overflow-x-auto px-1 py-3">
        <RouterLink v-for="i in s.items" :key="i.id" :to="'/jeu/' + i.id" class="group flex w-[180px] shrink-0 flex-col gap-3 text-white no-underline 2xl:w-[220px]">
          <div class="relative aspect-[2/3] overflow-hidden rounded-[22px] bg-panel shadow-[0_18px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-translate-y-1.5">
            <img :src="i.cover" alt="" loading="lazy" class="block size-full object-cover transition-transform duration-700 group-hover:scale-110" @error="$event.target.src = i.header" />
            <span v-if="i.discount" class="absolute left-2.5 top-2.5 rounded-full bg-hot px-[9px] py-[5px] text-[11px] font-extrabold text-ink">-{{ i.discount }} %</span>
          </div>
          <span class="text-[15px] font-bold">{{ i.title }}</span>
          <span class="-mt-1.5 text-[13px] text-mute">{{ i.free ? 'Gratuit' : i.price || 'Prix à venir' }}</span>
        </RouterLink>
      </div>
    </section>
  </div>
</div>
</template>
