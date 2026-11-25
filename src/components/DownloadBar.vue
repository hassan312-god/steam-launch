<script setup>
// Progression RÉELLE d'un téléchargement Steam, lue dans les fichiers de Steam par l'application de bureau.
import { computed } from 'vue'

const props = defineProps({ app: { type: Object, required: true } })
const pct = computed(() => Math.round(props.app.progress * 100))
const gb = (n) => (n / 1024 ** 3).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
</script>

<template>
  <div class="glass flex w-full max-w-[520px] flex-col gap-2 rounded-2xl p-4" role="status">
    <div class="flex items-center justify-between text-sm font-bold">
      <span>{{ app.paused ? 'Téléchargement en pause' : 'Téléchargement en cours' }}</span>
      <span class="tabular-nums text-accent">{{ pct }} %</span>
    </div>
    <div class="h-2 overflow-hidden rounded-full bg-white/[0.14]" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100">
      <div class="h-full rounded-full bg-accent transition-[width] duration-700" :style="{ width: pct + '%' }" />
    </div>
    <span class="text-xs text-mute">{{ gb(app.bytesDownloaded) }} Go sur {{ gb(app.bytesToDownload) }} Go</span>
  </div>
</template>
