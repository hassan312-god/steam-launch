<script setup>
// Colonne principale de la fiche : éditions, DLC, annonces, description complète — données réelles du magasin Steam.
import { computed, ref } from 'vue'
import { install } from '../composables/useLaunch'
import { fmt } from '../data/games'

const props = defineProps({ game: { type: Object, required: true }, extra: { type: Object, default: null }, failed: Boolean })
const more = ref(false)
const about = computed(() => props.extra?.about ?? [])
const shown = computed(() => (more.value ? about.value : about.value.slice(0, 7)))
const storeUrl = computed(() => `https://store.steampowered.com/app/${props.game.id}`)
const date = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
</script>

<template>
  <div class="flex flex-col gap-10">
    <div v-if="!extra && !failed" class="flex flex-col gap-3" aria-busy="true" aria-label="Chargement des informations Steam">
      <div v-for="n in 3" :key="n" class="h-24 animate-pulse rounded-2xl bg-panel" />
    </div>
    <p v-else-if="failed" class="m-0 rounded-2xl border border-dashed border-white/20 p-5 text-sm text-mute">Les informations détaillées de Steam sont indisponibles pour le moment.</p>

    <template v-if="extra">
      <!-- Éditions et prix -->
      <section v-if="extra.packages.length" class="flex flex-col gap-3" aria-labelledby="buy-h">
        <h2 id="buy-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">Acheter {{ game.title }}</h2>
        <ul class="m-0 flex list-none flex-col gap-3 p-0">
          <li v-for="p in extra.packages" :key="p.id" class="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div class="flex min-w-0 flex-col gap-1"><strong class="text-base">{{ p.title }}</strong><span v-if="p.discount" class="text-xs font-bold text-hot">-{{ p.discount }} % en ce moment</span></div>
            <div class="flex items-center gap-4">
              <span class="font-display text-xl font-extrabold">{{ p.price }}</span>
              <button v-if="p.free" type="button" class="h-11 rounded-full bg-accent px-5 text-sm font-extrabold text-ink" @click="install(game)">Installer gratuitement</button>
              <a v-else :href="storeUrl" target="_blank" rel="noopener noreferrer" class="flex h-11 items-center rounded-full bg-white px-5 text-sm font-extrabold text-ink no-underline">Acheter</a>
            </div>
          </li>
        </ul>
      </section>

      <!-- DLC -->
      <section v-if="extra.dlc.length" class="flex flex-col gap-3" aria-labelledby="dlc-h">
        <div class="flex items-baseline justify-between gap-3"><h2 id="dlc-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">Contenu additionnel</h2><span class="text-sm text-mute">{{ extra.dlcTotal }} contenu{{ extra.dlcTotal > 1 ? 's' : '' }}</span></div>
        <ul class="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
          <li v-for="d in extra.dlc" :key="d.id">
            <a :href="'https://store.steampowered.com/app/' + d.id" target="_blank" rel="noopener noreferrer" class="card flex items-center gap-4 overflow-hidden p-0 text-white no-underline transition-colors hover:border-white/20">
              <img :src="d.header" alt="" loading="lazy" class="h-[72px] w-32 shrink-0 object-cover" />
              <span class="flex min-w-0 flex-1 flex-col gap-0.5 py-2 pr-4"><strong class="truncate text-sm">{{ d.title }}</strong><span class="text-xs text-mute">{{ d.price || '—' }}<span v-if="d.discount" class="ml-2 font-bold text-hot">-{{ d.discount }} %</span></span></span>
            </a>
          </li>
        </ul>
      </section>

      <!-- Annonces -->
      <section v-if="extra.news.length" class="flex flex-col gap-3" aria-labelledby="news-h">
        <h2 id="news-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">Annonces et événements récents</h2>
        <ul class="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
          <li v-for="n in extra.news" :key="n.id" class="card flex flex-col gap-2 p-5">
            <span class="text-xs font-bold tracking-[0.08em] text-accent">{{ n.label.toUpperCase() }} · {{ date(n.date) }}</span>
            <strong class="text-base leading-snug">{{ n.title }}</strong>
            <p v-if="n.text" class="m-0 line-clamp-3 text-sm text-soft">{{ n.text }}</p>
            <a v-if="n.url" :href="n.url" target="_blank" rel="noopener noreferrer" class="mt-auto text-xs font-bold text-mute no-underline hover:text-white">Lire sur Steam ↗</a>
          </li>
        </ul>
      </section>

      <!-- Description complète -->
      <section v-if="about.length" class="flex flex-col gap-3" aria-labelledby="about2-h">
        <h2 id="about2-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">À propos de ce jeu</h2>
        <div class="flex max-w-[820px] flex-col gap-2.5">
          <template v-for="(b, i) in shown" :key="i">
            <h3 v-if="b.t === 'h'" class="m-0 mt-2 font-display text-lg font-extrabold">{{ b.text }}</h3>
            <p v-else-if="b.t === 'li'" class="m-0 flex gap-3 text-[15px] leading-relaxed text-soft"><span class="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />{{ b.text }}</p>
            <p v-else class="m-0 text-[15px] leading-relaxed text-soft">{{ b.text }}</p>
          </template>
          <button v-if="about.length > 7" type="button" class="self-start border-0 bg-transparent p-0 text-sm font-bold text-accent" @click="more = !more">{{ more ? 'Réduire' : 'Lire la suite' }}</button>
        </div>
      </section>
    </template>
  </div>
</template>
