<script setup>
// Colonne latérale de la fiche : évaluations, informations, plateformes, langues, fonctionnalités.
import { computed } from 'vue'
import { fmt } from '../data/games'

const props = defineProps({ game: { type: Object, required: true }, extra: { type: Object, default: null }, size: { type: String, default: '' } })
const rev = computed(() => props.extra?.reviews)
const tone = computed(() => (rev.value?.percent >= 70 ? 'text-accent' : rev.value?.percent >= 40 ? 'text-amber' : 'text-hot'))
const plats = computed(() => [['windows', 'Windows'], ['mac', 'macOS'], ['linux', 'Linux']].filter(([k]) => props.extra?.platforms?.[k]))
const rows = computed(() => [
  ['Genre', props.game.genres.join(', ')],
  ['Développeur', props.extra?.developers || props.game.studio],
  ['Éditeur', props.extra?.publisher],
  ['Sortie', props.game.year],
  ['Taille', props.size],
  ['Âge requis', props.extra?.age ? props.extra.age + '+' : ''],
].filter((r) => r[1]))
</script>

<template>
  <div class="flex flex-col gap-6">
    <section v-if="rev" class="card flex flex-col gap-3 p-6" aria-labelledby="rev-h">
      <h2 id="rev-h" class="m-0 text-[13px] font-semibold text-mute">Évaluations des joueurs</h2>
      <div class="flex items-baseline gap-3"><span class="font-display text-4xl font-black" :class="tone">{{ rev.percent }} %</span><strong class="text-base">{{ rev.label }}</strong></div>
      <div class="flex h-2 overflow-hidden rounded-full bg-hot/60" role="img" :aria-label="`${rev.percent} % d'avis positifs`"><span class="bg-accent" :style="{ width: rev.percent + '%' }" /></div>
      <span class="text-xs text-mute">{{ fmt.format(rev.up) }} positives · {{ fmt.format(rev.down) }} négatives · toutes langues</span>
    </section>

    <section class="card flex flex-col gap-4 p-6" aria-labelledby="info-h">
      <h2 id="info-h" class="m-0 text-[13px] font-semibold text-mute">Informations</h2>
      <dl class="m-0 flex flex-col gap-3">
        <div v-for="[k, v] in rows" :key="k" class="flex flex-col gap-0.5"><dt class="text-xs text-mute">{{ k }}</dt><dd class="m-0 text-sm font-semibold">{{ v }}</dd></div>
      </dl>
      <div v-if="plats.length" class="flex flex-wrap gap-2" aria-label="Plateformes">
        <span v-for="[k, l] in plats" :key="k" class="rounded-full border border-white/[0.14] px-3 py-1 text-xs font-bold">{{ l }}</span>
      </div>
      <a v-if="extra?.website" :href="extra.website" target="_blank" rel="noopener noreferrer" class="text-sm font-bold text-accent no-underline hover:underline">Site officiel ↗</a>
      <p v-if="extra?.contentNotes" class="m-0 rounded-xl border border-white/10 bg-ink/50 p-3 text-xs text-soft">{{ extra.contentNotes }}</p>
    </section>

    <section v-if="extra?.features.length" class="card flex flex-col gap-3 p-6" aria-labelledby="feat-h">
      <h2 id="feat-h" class="m-0 text-[13px] font-semibold text-mute">Fonctionnalités</h2>
      <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
        <li v-for="f in extra.features" :key="f" class="rounded-full border border-white/[0.14] bg-ink/50 px-3 py-1.5 text-xs font-semibold">{{ f }}</li>
        <li v-if="extra.controller" class="rounded-full border border-accent/40 px-3 py-1.5 text-xs font-semibold text-accent">{{ extra.controller }}</li>
      </ul>
    </section>

    <section v-if="extra?.languages.length" class="card flex flex-col gap-3 p-6" aria-labelledby="lang-h">
      <h2 id="lang-h" class="m-0 text-[13px] font-semibold text-mute">Langues ({{ extra.languages.length }})</h2>
      <ul class="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-1.5 p-0 text-sm">
        <li v-for="l in extra.languages" :key="l.name" class="flex items-center justify-between gap-2"><span class="truncate">{{ l.name }}</span><span v-if="l.audio" class="rounded bg-accent/20 px-1.5 text-[10px] font-extrabold text-accent" title="Doublage audio">AUDIO</span></li>
      </ul>
      <span class="text-xs text-mute">Interface et sous-titres ; « AUDIO » = doublage complet.</span>
    </section>
  </div>
</template>
