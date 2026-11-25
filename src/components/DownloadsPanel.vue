<script setup>
import { nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import { cmd, desktop, fmtSpeed } from '../composables/useDesktop'
import { prefersReduced } from '../composables/motion'
const base = (id) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/`
const art = (id) => base(id) + 'library_600x900.jpg'
// Jaquette absente (jeu récent) : on essaie l'en-tête du jeu, sinon la lettre du jeu reste affichée.
function onErr(e, id) {
  const img = e.target
  if (!img.dataset.tried) { img.dataset.tried = '1'; img.src = base(id) + 'header.jpg' }
  else img.remove()
}

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
    <p v-if="!desktop.steamFound && !desktop.canCmd" class="m-0 p-5 text-sm text-soft">Steam n’a pas été trouvé sur cet ordinateur. Installe le client Steam et connecte-toi dedans.</p>
    <p v-else-if="!list.length" class="m-0 p-5 text-sm text-soft">Aucun téléchargement en cours.</p>
    <ul v-else class="m-0 flex list-none flex-col p-2">
      <li v-for="a in list" :key="a.appid" class="flex items-center gap-3 rounded-2xl p-3 hover:bg-white/5">
        <RouterLink :to="'/jeu/' + a.appid" class="shrink-0" :aria-label="a.name" @click="emit('close')">
          <span class="relative flex h-[72px] w-[48px] items-center justify-center overflow-hidden rounded-lg bg-panel-2 font-display text-lg font-black text-accent">
            {{ (a.name || '?').charAt(0).toUpperCase() }}
            <img :src="art(a.appid)" alt="" loading="lazy" class="absolute inset-0 size-full object-cover" @error="onErr($event, a.appid)" />
          </span>
        </RouterLink>
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <RouterLink :to="'/jeu/' + a.appid" class="truncate text-[15px] font-bold leading-tight text-white no-underline" @click="emit('close')">{{ a.name }}</RouterLink>
          <span class="text-xs text-mute">{{ a.failed ? 'Erreur' : a.queued ? 'En attente' : a.paused ? (a.job ? 'En pause' : 'En pause dans Steam') : a.phase === 'verifying' ? 'Vérification…' : a.speed > 0 ? fmtSpeed(a.speed) : 'Démarrage…' }} · <span class="font-bold tabular-nums" :class="a.paused ? 'text-amber' : 'text-accent'">{{ Math.round(a.progress * 100) }} %</span></span>
          <span class="h-1.5 overflow-hidden rounded-full bg-white/[0.14]" role="progressbar" :aria-valuenow="Math.round(a.progress * 100)" aria-valuemin="0" aria-valuemax="100"><span class="block h-full rounded-full transition-[width] duration-700" :class="a.paused ? 'bg-amber' : 'bg-accent'" :style="{ width: Math.round(a.progress * 100) + '%' }" /></span>
        </div>
        <button v-if="a.job" type="button" class="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-transparent text-white transition-colors hover:bg-white/10" :aria-label="(a.paused || a.failed ? 'Reprendre ' : 'Mettre en pause ') + a.name" @click="a.paused || a.failed ? cmd.resume(a.appid) : cmd.pause(a.appid)">
          <svg v-if="a.paused || a.failed" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
        </button>
      </li>
    </ul>
    <RouterLink to="/telechargements" class="block border-t border-white/[0.07] px-5 py-3.5 text-center text-sm font-bold text-accent no-underline hover:bg-white/5" @click="emit('close')">Voir tous les téléchargements</RouterLink>
  </div>
</template>
