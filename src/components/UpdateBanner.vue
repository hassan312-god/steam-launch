<script setup>
// Mise à jour automatique de l'application de bureau : téléchargement en arrière-plan, puis « Redémarrer ».
import { nextTick, ref, watch } from 'vue'
import gsap from 'gsap'
import { desktop, installUpdate } from '../composables/useDesktop'
import { prefersReduced } from '../composables/motion'

const box = ref(null)
const dismissed = ref(false)
watch(() => desktop.update.status, async (s) => {
  if (s === 'ready') dismissed.value = false
  await nextTick()
  if (box.value && !prefersReduced()) gsap.fromTo(box.value, { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.5)' })
})
</script>

<template>
  <div v-if="desktop.available && ['downloading', 'ready'].includes(desktop.update.status) && !dismissed" ref="box" class="glass fixed bottom-6 right-6 z-[65] flex w-[min(360px,calc(100vw-48px))] flex-col gap-3 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)]" role="status">
    <template v-if="desktop.update.status === 'downloading'">
      <div class="flex items-center justify-between text-sm font-bold"><span>Mise à jour {{ desktop.update.version }} en cours…</span><span class="tabular-nums text-accent">{{ desktop.update.percent }} %</span></div>
      <div class="h-1.5 overflow-hidden rounded-full bg-white/[0.14]"><div class="h-full rounded-full bg-accent transition-[width] duration-500" :style="{ width: desktop.update.percent + '%' }" /></div>
    </template>
    <template v-else>
      <div class="flex flex-col gap-0.5"><strong class="text-sm">Mise à jour prête</strong><span class="text-xs text-soft">La version {{ desktop.update.version }} s’installe en redémarrant le launcher.</span></div>
      <div class="flex gap-2">
        <button type="button" class="h-10 flex-1 rounded-full bg-accent text-sm font-extrabold text-ink" @click="installUpdate">Redémarrer maintenant</button>
        <button type="button" class="h-10 rounded-full border border-white/20 bg-transparent px-4 text-sm font-semibold text-white hover:bg-white/10" @click="dismissed = true">Plus tard</button>
      </div>
    </template>
  </div>
</template>
