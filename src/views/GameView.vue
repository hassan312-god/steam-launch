<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
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
import TrailerVideo from '../components/TrailerVideo.vue'
import GameTabs from '../components/GameTabs.vue'
import { extras, loadExtra } from '../composables/useGameExtra'
import { fmt, games, getGame } from '../data/games'
import { theme } from '../composables/useTheme'
import { install, play, showFolder, toggleFav, toggleLibrary, uninstall } from '../composables/useLaunch'
import { desktop } from '../composables/useDesktop'
import DownloadBar from '../components/DownloadBar.vue'
import { prefersReduced } from '../composables/motion'

const route = useRoute()
const reduced = prefersReduced()
// Le jeu vient du catalogue, sinon il est chargé à la volée depuis Steam (/api/steam/app).
const current = shallowRef(null)
const failed = ref(false)
const EMPTY = { id: '', kind: 'game', parent: null, title: '', cover: '', wide: '', header: '', desc: '', studio: '', year: '', price: '', genres: [], cats: [], shots: [], movies: [], ach: [], req: null, tags: [], moods: [], recs: 0, total: 0, discount: 0, free: false, metacritic: null, owned: false, fav: false, steam: false, local: false, hours: null }
const game = computed(() => current.value ?? EMPTY)
const isGame = computed(() => (game.value.kind || 'game') === 'game')
const extra = computed(() => extras[game.value.id] || null)
const extraFailed = computed(() => extras[game.value.id] === false)
const similar = computed(() => games.filter((g) => g.id !== game.value.id && g.genres.some((x) => game.value.genres.includes(x))).slice(0, 8))
const st = computed(() => (desktop.available ? desktop.apps[game.value.id] ?? null : null))
const sizeLabel = computed(() => (st.value?.sizeOnDisk ? (st.value.sizeOnDisk / 1024 ** 3).toFixed(1) + ' Go (sur ton disque)' : game.value.sizeGo ? game.value.sizeGo + ' Go' : ''))
const buyLabel = computed(() => (game.value.free ? 'Jouer gratuitement' : 'Acheter · ' + (game.value.price || 'sur Steam')))
const steamUrl = computed(() => `https://store.steampowered.com/app/${game.value.id}`)

// Médias du héros : bandes-annonces d'abord, puis captures. Sans doublon (même URL ou même vidéo).
const media = computed(() => {
  const seen = new Set()
  const out = []
  const add = (m, key) => {
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push(m)
  }
  game.value.movies.forEach((m) => add({ type: 'video', thumb: m.thumb, hls: m.hls, name: m.name }, m.hls.split('?')[0]))
  game.value.shots.forEach((s, i) => add({ type: 'shot', thumb: s.replace('.1920x1080', '.600x338'), full: s, name: `Capture ${i + 1}` }, s.split('?')[0]))
  return out
})
const cur = ref(0)
const item = computed(() => media.value[cur.value] ?? null)
const sound = ref(theme.trailerSound)
const videoOn = ref(false)
let vt
const onPlaying = () => { clearTimeout(vt); vt = setTimeout(() => (videoOn.value = true), 600) }
watch([() => game.value.id, cur], () => { clearTimeout(vt); videoOn.value = false })
// Fond du héros : fondu GSAP à chaque changement de média.
function bgEnter(el, done) {
  if (prefersReduced()) return done()
  gsap.fromTo(el, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', onComplete: done })
}
function bgLeave(el, done) {
  gsap.to(el, { opacity: 0, duration: 0.6, ease: 'power2.inOut', onComplete: done })
}

const root = ref(null)
let ctx
function intro() {
  ctx?.revert()
  cur.value = 0
  sound.value = theme.trailerSound
  if (prefersReduced()) return
  ctx = gsap.context(() => {
    gsap.from('[data-in]', { opacity: 0, y: 26, stagger: 0.1, duration: 0.8, ease: 'power3.out', delay: 0.5 })
    gsap.from('[data-stat]', { opacity: 0, y: 40, scale: 0.95, stagger: 0.1, duration: 0.8, ease: 'power3.out', delay: 0.9 })
    gsap.from('[data-ach]', { opacity: 0, x: -24, stagger: 0.08, duration: 0.6, ease: 'power3.out', delay: 1.2 })
  }, root.value)
}
watch(() => route.params.id, async (id) => {
  current.value = null
  failed.value = false
  try {
    current.value = await getGame(id)
  } catch {
    failed.value = true
  }
}, { immediate: true })
watch(current, async (g) => {
  if (!g) return
  loadExtra(g.id)
  await nextTick()
  window.scrollTo({ top: 0 })
  intro()
})
onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div ref="root" class="relative min-h-screen overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <div v-if="current" class="pointer-events-none absolute inset-x-0 top-0 h-[min(900px,100vh)] overflow-hidden" aria-hidden="true">
      <img :src="game.wide" alt="" class="absolute inset-0 size-full object-cover" />
      <Transition :css="false" appear @enter="bgEnter" @leave="bgLeave">
        <div v-if="item" :key="item.hls || item.full" class="absolute inset-0">
          <img v-if="item.type === 'shot'" :src="item.full" alt="" class="absolute inset-0 size-full object-cover" />
          <template v-else>
            <img :src="game.shots[0] || item.thumb" alt="" class="absolute inset-0 size-full object-cover" />
            <TrailerVideo v-if="!reduced && theme.bgVideo" ambient :sound="sound" :start-at="7" :src="item.hls" class="absolute inset-0 size-full object-cover transition-opacity duration-[1200ms]" :class="videoOn ? 'opacity-100' : 'opacity-0'" @playing="onPlaying" />
          </template>
        </div>
      </Transition>
      <div class="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/30 to-ink/5" />
      <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(6,6,10,0.7) 0%, rgba(6,6,10,0) 25%, rgba(6,6,10,0.35) 60%, #06060A 100%)" />
    </div>

    <main v-if="!current" class="shell relative flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center" :aria-busy="!failed">
      <template v-if="failed">
        <h1 class="m-0 font-display text-3xl font-black">Jeu introuvable</h1>
        <p class="m-0 text-soft">Steam ne connaît pas ce jeu ou la vitrine est indisponible.</p>
        <RouterLink to="/magasin" class="flex h-12 items-center rounded-full bg-accent px-6 font-extrabold text-ink no-underline">Retour au magasin</RouterLink>
      </template>
      <template v-else>
        <span class="size-10 animate-spin rounded-full border-4 border-white/15 border-t-accent" aria-hidden="true" />
        <p class="m-0 text-soft">Chargement du jeu depuis Steam…</p>
      </template>
    </main>
    <main v-else class="shell relative flex flex-col gap-12 pb-16 pt-6">
      <RouterLink data-in to="/bibliotheque" class="flex w-fit items-center gap-2 text-sm font-semibold text-soft no-underline transition-colors hover:text-white">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="15,5 8,12 15,19" /></svg>Bibliothèque
      </RouterLink>

      <!-- En-tête de fiche -->
      <section class="flex flex-wrap items-end gap-8 pt-6 lg:pt-20">
        <TiltedCard data-in class="hidden h-[320px] w-[213px] shrink-0 overflow-hidden rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.6)] sm:block 2xl:h-[400px] 2xl:w-[267px]">
          <img :src="game.cover" :alt="'Jaquette de ' + game.title" class="block size-full rounded-3xl object-cover" />
        </TiltedCard>
        <div class="flex min-w-0 flex-1 basis-[420px] flex-col gap-5">
          <div data-in class="flex flex-wrap items-center gap-2">
            <RouterLink v-if="game.parent" :to="'/jeu/' + game.parent.id" class="eyebrow no-underline hover:underline">Contenu additionnel · {{ game.parent.name }}</RouterLink>
            <span v-else class="eyebrow">{{ game.genres.slice(0, 3).join(' · ') }}</span>
            <span class="rounded-full bg-white/[0.14] px-3 py-1.5 text-xs font-bold tracking-[0.14em] backdrop-blur-md">{{ game.owned ? 'DANS MA BIBLIOTHÈQUE' : game.price || 'GRATUIT' }}</span>
          </div>
          <h1 class="m-0 font-display text-[clamp(32px,5.6vw,92px)] font-black uppercase leading-[0.95] tracking-[-0.03em]"><SplitText :key="game.id" :text="game.title" :stagger="0.02" /></h1>
          <p data-in class="m-0 text-[15px] text-soft">{{ game.studio }} · {{ game.year }}<span v-if="game.metacritic"> · Metacritic {{ game.metacritic }}</span></p>
          <div data-in class="flex flex-wrap items-center gap-3">
            <template v-if="isGame">
            <Magnet :padding="30" :strength="0.25">
              <button v-if="game.owned && (!desktop.available || st?.installed)" type="button" class="flex h-[60px] items-center gap-2.5 rounded-full bg-accent px-10 text-[17px] font-extrabold text-ink" @click="play(game)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6,4 20,12 6,20" /></svg>
                <ShinyText :speed="4">Jouer</ShinyText>
              </button>
              <button v-else-if="game.owned && st?.downloading" type="button" disabled class="flex h-[60px] items-center gap-2.5 rounded-full bg-accent/40 px-10 text-[17px] font-extrabold text-ink">Téléchargement…</button>
              <button v-else-if="game.owned" type="button" class="flex h-[60px] items-center gap-2.5 rounded-full bg-accent px-10 text-[17px] font-extrabold text-ink" @click="install(game)"><ShinyText :speed="4">Installer</ShinyText></button>
              <button v-else-if="game.free" type="button" class="flex h-[60px] items-center gap-2.5 rounded-full bg-accent px-10 text-[17px] font-extrabold text-ink" @click="install(game)"><ShinyText :speed="4">Installer gratuitement</ShinyText></button>
              <a v-else :href="steamUrl" target="_blank" rel="noopener noreferrer" class="flex h-[60px] items-center gap-2.5 rounded-full bg-accent px-10 text-[17px] font-extrabold text-ink no-underline"><ShinyText :speed="4">{{ buyLabel }}</ShinyText></a>
            </Magnet>
            <button v-if="game.owned && !desktop.available" type="button" class="flex h-[60px] items-center gap-2 rounded-full border border-white/[0.16] bg-ink/50 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10" @click="install(game)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>Installer
            </button>
            <span v-if="game.steam && !game.local" class="flex h-[60px] items-center gap-2 rounded-full border border-accent bg-accent/15 px-6 text-[15px] font-semibold text-white">✓ Dans ta bibliothèque Steam</span>
            <button v-else type="button" :aria-pressed="game.owned" class="flex h-[60px] items-center gap-2 rounded-full border px-6 text-[15px] font-semibold text-white transition-colors" :class="game.owned ? 'border-accent bg-accent/15' : 'border-white/[0.16] bg-ink/50 hover:bg-white/10'" @click="toggleLibrary(game)">
              {{ game.owned ? '✓ Dans ma bibliothèque' : '+ Ajouter à ma bibliothèque' }}
            </button>
            </template>
            <!-- Contenu additionnel : le paiement se fait chez Steam (seule étape hors du launcher) -->
            <a v-else :href="steamUrl" target="_blank" rel="noopener noreferrer" class="flex h-[60px] items-center gap-2.5 rounded-full bg-accent px-10 text-[17px] font-extrabold text-ink no-underline">{{ game.price && game.price !== 'Gratuit' ? 'Acheter sur Steam · ' + game.price : 'Obtenir sur Steam' }}<span aria-hidden="true">↗</span></a>
            <button type="button" :aria-pressed="game.fav" :aria-label="game.fav ? 'Retirer des favoris' : 'Ajouter aux favoris'" class="flex size-[60px] items-center justify-center rounded-full border border-white/[0.16] bg-ink/50 transition-colors hover:bg-white/10" @click="toggleFav(game)">
              <svg width="20" height="20" viewBox="0 0 24 24" :fill="game.fav ? '#FF3D9A' : 'none'" stroke="#FF3D9A" stroke-width="2" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" /></svg>
            </button>
          </div>
          <DownloadBar v-if="st?.downloading" data-in :app="st" />
          <div v-if="st?.installed" data-in class="flex flex-wrap items-center gap-3 text-sm text-soft">
            <span class="flex items-center gap-2 font-semibold text-accent"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" aria-hidden="true"><polyline points="20,6 9,17 4,12" /></svg>Installé sur cet ordinateur</span>
            <button type="button" class="border-0 bg-transparent p-0 text-sm font-semibold text-soft underline hover:text-white" @click="showFolder(game)">Ouvrir le dossier</button>
            <button type="button" class="border-0 bg-transparent p-0 text-sm font-semibold text-soft underline hover:text-white" @click="uninstall(game)">Désinstaller</button>
          </div>
        </div>
      </section>


      <!-- Choix du média affiché en fond du héros -->
      <div v-if="media.length > 1" data-in class="flex items-center gap-3">
        <div class="no-scrollbar flex min-w-0 flex-1 gap-3 overflow-x-auto py-1.5" role="listbox" aria-label="Choisir la vidéo ou la capture affichée en fond">
          <button
            v-for="(m, i) in media"
            :key="m.hls || m.full"
            type="button"
            role="option"
            :aria-selected="i === cur"
            :aria-label="m.name"
            class="relative aspect-video w-[132px] shrink-0 overflow-hidden rounded-xl border-0 p-0 transition-all duration-300 hover:opacity-100 xl:w-[156px] 2xl:w-[200px]"
            :class="i === cur ? 'opacity-100 shadow-[0_0_0_3px_var(--accent)]' : 'opacity-60'"
            @click="cur = i"
          >
            <img :src="m.thumb" alt="" class="size-full object-cover" />
            <span v-if="m.type === 'video'" class="absolute inset-0 flex items-center justify-center bg-ink/40"><svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><polygon points="7,4 20,12 7,20" /></svg></span>
          </button>
        </div>
        <button v-if="item && item.type === 'video'" type="button" :aria-pressed="sound" :aria-label="sound ? 'Couper le son' : 'Activer le son'" class="glass-btn flex size-12 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-110" @click="sound = !sound">
          <svg v-if="sound" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
        </button>
      </div>

      <GameTabs :game="game" :extra="extra" :failed="extraFailed" :is-game="isGame" :size="sizeLabel" />

      <section v-if="similar.length" class="flex flex-col gap-4" aria-labelledby="sim-h">
        <h2 id="sim-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">Tu aimeras aussi</h2>
        <div v-reveal="{ children: true, stagger: 0.08 }" class="no-scrollbar flex gap-[18px] overflow-x-auto px-1 py-3">
          <RouterLink v-for="s in similar" :key="s.id" :to="'/jeu/' + s.id" class="flex w-[180px] shrink-0 flex-col gap-3 text-white no-underline 2xl:w-[220px]">
            <TiltedCard class="aspect-[2/3] overflow-hidden rounded-[22px]"><img :src="s.cover" alt="" loading="lazy" class="block size-full rounded-[22px] object-cover" /></TiltedCard>
            <span class="text-[15px] font-bold">{{ s.title }}</span>
            <span class="-mt-2 text-xs text-mute">{{ s.genres.slice(0, 2).join(' · ') }}</span>
          </RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>
