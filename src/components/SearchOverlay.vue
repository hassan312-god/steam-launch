<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { games, myGames, topSellers, lookup } from '../data/games'
import { useSteamSearch } from '../composables/useSteamSearch'
import { prefersReduced } from '../composables/motion'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const router = useRouter()
const q = ref('')
const input = ref(null)
const panel = ref(null)
const active = ref(0)

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const { results: remote, loading, error } = useSteamSearch(q)

// Résultats immédiats (catalogue du launcher) puis tout le catalogue Steam, sans doublon.
const toItem = (g) => ({ id: g.id, title: g.title, header: g.cover, cover: g.cover, price: g.price, owned: g.owned, sub: g.genres.slice(0, 3).join(' · ') })
const results = computed(() => {
  const t = norm(q.value.trim())
  if (!t) return (myGames.value.length ? myGames.value : topSellers).slice(0, 8).map(toItem)
  const local = games.filter((g) => norm(g.title + ' ' + g.genres.join(' ') + ' ' + g.studio).includes(t)).slice(0, 5).map(toItem)
  const seen = new Set(local.map((x) => x.id))
  const more = remote.value.filter((r) => !seen.has(r.id)).map((r) => ({ id: r.id, title: r.title, cover: r.cover, header: r.header, price: r.price, owned: !!lookup(r.id)?.owned, sub: r.year }))
  return [...local, ...more].slice(0, 12)
})
watch(q, () => (active.value = 0))

function go(g) {
  emit('close')
  router.push('/jeu/' + g.id)
}
function onKey(e) {
  if (!props.open) return
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowDown') (e.preventDefault(), (active.value = Math.min(active.value + 1, results.value.length - 1)))
  else if (e.key === 'ArrowUp') (e.preventDefault(), (active.value = Math.max(active.value - 1, 0)))
  else if (e.key === 'Enter' && results.value[active.value]) go(results.value[active.value])
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

watch(() => props.open, async (o) => {
  if (!o) return
  q.value = ''
  await nextTick()
  input.value?.focus()
  if (prefersReduced()) return
  gsap.fromTo(panel.value, { opacity: 0, y: -24, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' })
  gsap.from('[data-res]', { opacity: 0, x: -16, stagger: 0.04, duration: 0.4, ease: 'power3.out', delay: 0.1 })
})
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center bg-ink/70 px-4 pt-[12vh] backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Recherche" @mousedown.self="emit('close')">
    <div ref="panel" class="w-full max-w-[720px] overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-[0_40px_100px_rgba(0,0,0,0.7)]">
      <div class="flex items-center gap-3 border-b border-white/[0.07] px-5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-mute" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
        <label for="gs" class="sr-only">Rechercher un jeu</label>
        <input id="gs" ref="input" v-model="q" type="search" autocomplete="off" placeholder="Rechercher un jeu, un genre, un studio…" class="h-16 flex-1 bg-transparent text-base text-white placeholder:text-mute focus:outline-none" />
        <kbd class="rounded-md border border-white/10 px-2 py-1 text-xs text-mute">Échap</kbd>
      </div>
      <ul class="m-0 flex max-h-[56vh] list-none flex-col gap-1 overflow-y-auto p-2 no-scrollbar">
        <li v-if="!results.length && loading" class="px-4 py-8 text-center text-mute">Recherche dans tout le catalogue Steam…</li>
        <li v-else-if="!results.length && error" class="px-4 py-8 text-center text-mute">La recherche Steam est indisponible pour le moment.</li>
        <li v-else-if="!results.length" class="px-4 py-8 text-center text-mute">Aucun jeu ne correspond à « {{ q }} ».</li>
        <li v-else-if="!q" class="px-4 pb-1 pt-2 text-xs font-bold tracking-[0.14em] text-mute">{{ myGames.length ? 'DANS TA BIBLIOTHÈQUE' : 'MEILLEURES VENTES' }}</li>
        <li v-if="q && loading && results.length" class="px-4 pb-1 pt-2 text-xs font-bold tracking-[0.14em] text-mute">RECHERCHE SUR STEAM…</li>
        <li v-for="(g, i) in results" :key="g.id" data-res>
          <button type="button" class="flex w-full items-center gap-4 rounded-2xl border-0 p-2.5 text-left text-white transition-colors" :class="i === active ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'" @mouseenter="active = i" @click="go(g)">
            <img :src="g.cover" alt="" class="h-[72px] w-12 shrink-0 rounded-lg bg-panel-2 object-cover" @error="$event.target.src = g.header" />
            <span class="flex min-w-0 flex-1 flex-col gap-0.5"><strong class="truncate text-[15px]">{{ g.title }}</strong><span class="truncate text-xs text-mute">{{ g.sub }}</span></span>
            <span class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-[0.06em] text-ink" :class="g.owned ? 'bg-accent' : 'bg-soft'">{{ g.owned ? 'BIBLIOTHÈQUE' : g.price || 'GRATUIT' }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
