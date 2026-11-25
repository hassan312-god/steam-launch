<script setup>
// Configuration requise réelle (minimale / recommandée) telle que publiée sur Steam.
import { computed, ref } from 'vue'

const props = defineProps({ req: { type: Object, default: null } })
const tabs = computed(() => [
  ['min', 'Minimale', props.req?.min],
  ['rec', 'Recommandée', props.req?.rec],
].filter((t) => t[2]))
const tab = ref(null)
const current = computed(() => tabs.value.find((t) => t[0] === (tab.value ?? tabs.value[0]?.[0]))?.[2])
</script>

<template>
  <section class="flex flex-col gap-4" aria-labelledby="req-h">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 id="req-h" class="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em]">Configuration requise</h2>
      <div v-if="tabs.length > 1" class="flex rounded-full border border-white/[0.08] bg-ink p-1" role="group" aria-label="Niveau de configuration">
        <button v-for="t in tabs" :key="t[0]" type="button" :aria-pressed="(tab ?? tabs[0][0]) === t[0]" class="h-9 rounded-full border-0 px-4 text-sm font-bold transition-colors duration-300" :class="(tab ?? tabs[0][0]) === t[0] ? 'bg-accent text-ink' : 'bg-transparent text-white hover:bg-white/10'" @click="tab = t[0]">{{ t[1] }}</button>
      </div>
    </div>

    <div v-if="current" class="card overflow-hidden">
      <p v-if="current.note" class="m-0 border-b border-white/[0.07] px-5 py-3 text-sm text-soft">{{ current.note }}</p>
      <dl class="m-0 grid grid-cols-1 sm:grid-cols-[220px_1fr]">
        <template v-for="[label, value] in current.rows" :key="label">
          <dt class="border-b border-white/[0.07] px-5 pb-0 pt-3 text-[13px] font-semibold text-mute sm:py-3.5">{{ label }}</dt>
          <dd class="m-0 border-b border-white/[0.07] px-5 pb-3 pt-0.5 text-sm sm:py-3.5">{{ value }}</dd>
        </template>
      </dl>
    </div>
    <p v-else class="m-0 rounded-2xl border border-dashed border-white/20 p-6 text-mute">Steam ne publie pas de configuration requise pour ce jeu.</p>
  </section>
</template>
