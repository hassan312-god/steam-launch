<script setup>
// Fiche d'un jeu en 4 onglets (Aperçu · Contenu · Annonces · Infos) : une seule chose à lire à la fois.
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import SpotlightCard from './bits/SpotlightCard.vue'
import Requirements from './Requirements.vue'
import Modal from './Modal.vue'
import { install } from '../composables/useLaunch'
import { prefersReduced } from '../composables/motion'
import { fmt } from '../data/games'

const props = defineProps({ game: { type: Object, required: true }, extra: { type: Object, default: null }, failed: Boolean, isGame: Boolean, size: { type: String, default: '' } })

const storeUrl = computed(() => `https://store.steampowered.com/app/${props.game.id}`)
const tabs = computed(() => [
  ['apercu', 'Aperçu'],
  ...(props.extra && (props.extra.packages?.length || props.extra.dlc?.length) ? [['contenu', 'Contenu']] : []),
  ...(props.extra?.news?.length ? [['annonces', 'Annonces']] : []),
  ['infos', 'Infos'],
])
const tab = ref('apercu')
const bar = ref(null)
const nav = ref(null)
const panel = ref(null)
const more = ref(false)
const reading = ref(null)

const about = computed(() => props.extra?.about ?? [])
const shown = computed(() => (more.value ? about.value : about.value.slice(0, 5)))
const date = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

// Barre soulignée qui glisse sous l'onglet actif.
function moveBar(animate = true) {
  const el = nav.value?.querySelector('[aria-selected="true"]')
  if (!el || !bar.value) return
  const to = { x: el.offsetLeft, width: el.offsetWidth }
  if (animate && !prefersReduced()) gsap.to(bar.value, { ...to, duration: 0.45, ease: 'power3.out' })
  else gsap.set(bar.value, to)
}
watch(tab, async () => {
  await nextTick()
  moveBar()
  if (!prefersReduced()) gsap.fromTo(panel.value, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' })
})
watch(tabs, async () => {
  if (!tabs.value.some((t) => t[0] === tab.value)) tab.value = 'apercu'
  await nextTick()
  moveBar(false)
}, { immediate: true, flush: 'post' })
watch(() => props.game.id, () => ((tab.value = 'apercu'), (more.value = false)))
function onKey(e) {
  const i = tabs.value.findIndex((t) => t[0] === tab.value)
  const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null
  if (n === null) return
  tab.value = tabs.value[(n + tabs.value.length) % tabs.value.length][0]
  nav.value.querySelector('[aria-selected="true"]')?.focus()
}

const rows = computed(() =>
  [
    ['Genre', (props.game.genres || []).join(', ')],
    ['Développeur', props.extra?.developers || props.game.studio],
    ['Éditeur', props.extra?.publisher],
    ['Sortie', props.game.year],
    ['Taille', props.size],
    ['Âge requis', props.extra?.age ? props.extra.age + '+' : ''],
  ].filter((r) => r[1]),
)
const plats = computed(() => [['windows', 'Windows'], ['mac', 'macOS'], ['linux', 'Linux']].filter(([k]) => props.extra?.platforms?.[k]))
</script>

<template>
  <section class="flex flex-col gap-8" aria-label="Détails du jeu">
    <!-- Onglets -->
    <div ref="nav" class="relative flex w-fit max-w-full gap-1 overflow-x-auto no-scrollbar border-b border-white/10" role="tablist" aria-label="Sections de la fiche" @keydown="onKey">
      <button v-for="[id, label] in tabs" :key="id" :id="'tab-' + id" type="button" role="tab" :aria-selected="tab === id" :aria-controls="'panel'" :tabindex="tab === id ? 0 : -1" class="relative shrink-0 border-0 bg-transparent px-5 pb-3 pt-2 text-[15px] font-bold transition-colors" :class="tab === id ? 'text-white' : 'text-mute hover:text-soft'" @click="tab = id">{{ label }}</button>
      <span ref="bar" aria-hidden="true" class="absolute -bottom-px left-0 h-[3px] w-0 rounded-full bg-accent" />
    </div>

    <div id="panel" ref="panel" role="tabpanel" :aria-labelledby="'tab-' + tab" class="min-h-[200px]">
      <!-- APERÇU -->
      <div v-if="tab === 'apercu'" class="flex max-w-[860px] flex-col gap-7">
        <div v-if="!extra && !failed" class="flex flex-col gap-3" aria-busy="true"><p class="m-0 text-base leading-relaxed text-soft">{{ game.desc }}</p><div class="h-20 animate-pulse rounded-2xl bg-panel" /></div>
        <template v-else>
          <div class="flex flex-col gap-3">
            <template v-for="(b, i) in (about.length ? shown : [{ t: 'p', text: game.desc }])" :key="i">
              <h3 v-if="b.t === 'h'" class="m-0 mt-2 font-display text-lg font-extrabold">{{ b.text }}</h3>
              <p v-else-if="b.t === 'li'" class="m-0 flex gap-3 text-[15px] leading-relaxed text-soft"><span class="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />{{ b.text }}</p>
              <p v-else class="m-0 text-[15px] leading-relaxed text-soft">{{ b.text }}</p>
            </template>
            <button v-if="about.length > 5" type="button" class="self-start border-0 bg-transparent p-0 text-sm font-bold text-accent" @click="more = !more">{{ more ? 'Réduire' : 'Lire la suite' }}</button>
          </div>
        </template>

        <div v-if="game.tags?.length" class="flex flex-wrap gap-2"><span v-for="t in game.tags" :key="t" class="rounded-full border border-white/[0.14] px-3.5 py-1.5 text-sm font-semibold">{{ t }}</span></div>

        <!-- Succès : une simple rangée d'icônes -->
        <div v-if="game.ach?.length" class="flex flex-col gap-3">
          <h3 class="m-0 text-[13px] font-semibold text-mute">{{ game.total }} succès à débloquer</h3>
          <ul class="m-0 flex list-none flex-wrap items-center gap-3 p-0">
            <li v-for="a in game.ach" :key="a.name"><img :src="a.icon" :alt="a.name" :title="a.name" loading="lazy" class="size-14 rounded-2xl object-cover shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-transform hover:scale-110" /></li>
            <li v-if="game.total > game.ach.length" class="flex size-14 items-center justify-center rounded-2xl border border-white/10 text-sm font-bold text-mute">+{{ game.total - game.ach.length }}</li>
          </ul>
        </div>
      </div>

      <!-- CONTENU : éditions + DLC -->
      <div v-else-if="tab === 'contenu'" class="flex flex-col gap-9">
        <div v-if="extra.packages?.length" class="flex flex-col gap-4">
          <h3 class="m-0 font-display text-xl font-extrabold">Éditions</h3>
          <ul class="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
            <li v-for="p in extra.packages" :key="p.id">
              <SpotlightCard class="flex h-full flex-col justify-between gap-6 rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/[0.12] via-panel to-panel p-6">
                <div class="flex flex-col gap-1.5"><strong class="text-lg leading-snug">{{ p.title }}</strong><span v-if="p.discount" class="w-fit rounded-md bg-hot px-2 py-0.5 text-xs font-extrabold text-ink">-{{ p.discount }} %</span></div>
                <div class="flex items-end justify-between gap-3">
                  <span class="font-display text-3xl font-black">{{ p.price }}</span>
                  <button v-if="p.free" type="button" class="h-11 rounded-full bg-accent px-5 text-sm font-extrabold text-ink" @click="install(game)">Installer</button>
                  <a v-else :href="storeUrl" target="_blank" rel="noopener noreferrer" class="flex h-11 items-center rounded-full bg-white px-5 text-sm font-extrabold text-ink no-underline">Acheter ↗</a>
                </div>
              </SpotlightCard>
            </li>
          </ul>
        </div>

        <div v-if="extra.dlc?.length" class="flex flex-col gap-4">
          <div class="flex items-baseline justify-between"><h3 class="m-0 font-display text-xl font-extrabold">Contenu additionnel</h3><span class="text-sm text-mute">{{ extra.dlcTotal }} au total</span></div>
          <ul class="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
            <li v-for="d in extra.dlc" :key="d.id">
              <RouterLink :to="'/jeu/' + d.id" class="group relative block aspect-[16/9] overflow-hidden rounded-3xl bg-panel text-white no-underline shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
                <img :src="d.header" alt="" loading="lazy" class="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <span class="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/30 to-transparent" />
                <span v-if="d.discount" class="absolute left-3 top-3 rounded-full bg-hot px-2.5 py-1 text-[11px] font-extrabold text-ink">-{{ d.discount }} %</span>
                <span class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4"><strong class="line-clamp-2 text-[15px] leading-snug">{{ d.title }}</strong><span class="shrink-0 rounded-full bg-ink/70 px-3 py-1 text-xs font-extrabold backdrop-blur-md">{{ d.price || '—' }}</span></span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- ANNONCES -->
      <ul v-else-if="tab === 'annonces'" class="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
        <li v-for="n in extra.news" :key="n.id">
          <button type="button" class="group flex h-full w-full flex-col gap-3 rounded-3xl border border-white/[0.07] bg-panel p-6 text-left text-white transition-all duration-300 hover:-translate-y-1 hover:border-accent/40" @click="reading = n">
            <span class="flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-accent"><span class="h-1 w-6 rounded-full bg-accent transition-all duration-300 group-hover:w-10" />{{ date(n.date) }}</span>
            <strong class="text-lg leading-snug">{{ n.title }}</strong>
            <span v-if="n.text" class="line-clamp-3 text-sm text-soft">{{ n.text }}</span>
            <span class="mt-auto pt-1 text-xs font-bold text-mute transition-colors group-hover:text-white">Lire l’annonce →</span>
          </button>
        </li>
      </ul>

      <!-- INFOS -->
      <div v-else class="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-2">
        <div class="flex flex-col gap-8">
          <div v-if="extra?.reviews" class="flex flex-col gap-2.5">
            <div class="flex items-baseline gap-3"><span class="font-display text-4xl font-black" :class="extra.reviews.percent >= 70 ? 'text-accent' : extra.reviews.percent >= 40 ? 'text-amber' : 'text-hot'">{{ extra.reviews.percent }} %</span><strong>{{ extra.reviews.label }}</strong></div>
            <div class="flex h-1.5 overflow-hidden rounded-full bg-hot/50"><span class="bg-accent" :style="{ width: extra.reviews.percent + '%' }" /></div>
            <span class="text-xs text-mute">{{ fmt.format(extra.reviews.total) }} évaluations · toutes langues</span>
          </div>
          <dl class="m-0 flex flex-col">
            <div v-for="[k, v] in rows" :key="k" class="flex items-baseline justify-between gap-6 border-b border-white/[0.07] py-3"><dt class="text-sm text-mute">{{ k }}</dt><dd class="m-0 text-right text-sm font-semibold">{{ v }}</dd></div>
          </dl>
          <div v-if="plats.length || extra?.website" class="flex flex-wrap items-center gap-2">
            <span v-for="[k, l] in plats" :key="k" class="rounded-full border border-white/[0.14] px-3 py-1 text-xs font-bold">{{ l }}</span>
            <a v-if="extra?.website" :href="extra.website" target="_blank" rel="noopener noreferrer" class="ml-1 text-sm font-bold text-accent no-underline hover:underline">Site officiel ↗</a>
          </div>
          <p v-if="extra?.contentNotes" class="m-0 rounded-2xl border border-white/10 bg-panel p-4 text-sm text-soft">{{ extra.contentNotes }}</p>
          <div v-if="extra?.features?.length" class="flex flex-wrap gap-2">
            <span v-for="f in extra.features" :key="f" class="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold">{{ f }}</span>
            <span v-if="extra.controller" class="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent">{{ extra.controller }}</span>
          </div>
        </div>
        <div class="flex flex-col gap-8">
          <Requirements v-if="isGame" :req="game.req" :key="game.id" />
          <div v-if="extra?.languages?.length" class="flex flex-col gap-3">
            <h3 class="m-0 text-[13px] font-semibold text-mute">{{ extra.languages.length }} langues</h3>
            <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
              <li v-for="l in extra.languages" :key="l.name" class="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold" :class="l.audio ? 'border-accent/50 text-accent' : 'text-soft'" :title="l.audio ? 'Doublage audio' : undefined">{{ l.name }}<span v-if="l.audio" aria-label=" avec doublage"> ♪</span></li>
            </ul>
            <span class="text-xs text-mute">♪ = doublage audio</span>
          </div>
        </div>
      </div>
    </div>

    <Modal :open="!!reading" :title="reading?.title || ''" wide @close="reading = null">
      <p class="m-0 mb-3 text-xs font-bold tracking-[0.08em] text-accent">{{ reading?.label?.toUpperCase() }} · {{ reading && date(reading.date) }}</p>
      <div class="max-h-[55vh] overflow-y-auto pr-1">
        <p v-for="(para, i) in (reading?.body || reading?.text || '').split('\n\n')" :key="i" class="m-0 mb-3 whitespace-pre-line text-sm leading-relaxed text-soft">{{ para }}</p>
      </div>
      <div class="mt-4 flex justify-end"><button type="button" class="h-11 rounded-full border border-white/20 bg-transparent px-5 text-sm font-semibold text-white hover:bg-white/10" @click="reading = null">Fermer</button></div>
    </Modal>
  </section>
</template>
