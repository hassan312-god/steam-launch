<script setup>
import { nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import { desktop } from '../composables/useDesktop'
import { prefersReduced } from '../composables/motion'

const props = defineProps({ open: Boolean, list: { type: Array, required: true } })
const emit = defineEmits(['close'])
const panel = ref(null)
watch(() => props.open, async (o) => {
  if (!o || prefersReduced()) return
  await nextTick()
  gsap.fromTo(panel.value, { opacity: 0, y: -12, scale: 0.96, transformOrigin: 'top right' }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' })
})
</script>

<template>
  <div v-if="open" ref="panel" class="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(380px,calc(100vw-40px))] overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-[0_30px_80px_rgba(0,0,0,0.7)]" role="dialog" aria-label="Téléchargements">
    <div class="border-b border-white/[0.07] px-5 py-4"><h2 class="m-0 font-display text-base font-extrabold">Téléchargements</h2></div>
    <p v-if="!desktop.steamFound" class="m-0 p-5 text-sm text-soft">Steam n’a pas été trouvé sur cet ordinateur. Installe le client Steam et connecte-toi dedans.</p>
    <p v-else-if="!list.length" class="m-0 p-5 text-sm text-soft">Aucun téléchargement en cours.</p>
    <ul v-else class="m-0 flex list-none flex-col p-2">
      <li v-for="a in list" :key="a.appid">
        <RouterLink :to="'/jeu/' + a.appid" class="flex flex-col gap-2 rounded-2xl p-3 text-white no-underline hover:bg-white/5" @click="emit('close')">
          <span class="flex justify-between text-sm font-bold"><span class="truncate">{{ a.name }}</span><span class="tabular-nums text-accent">{{ Math.round(a.progress * 100) }} %</span></span>
          <span class="h-1.5 overflow-hidden rounded-full bg-white/[0.14]"><span class="block h-full rounded-full bg-accent transition-[width] duration-700" :style="{ width: Math.round(a.progress * 100) + '%' }" /></span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
