<script setup>
import { computed, onMounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import gsap from 'gsap'
import AppHeader from './components/AppHeader.vue'
import Toaster from './components/Toaster.vue'
import { prefersReduced } from './composables/motion'
import { loadSteam, steam } from './composables/useSteam'
import { toast } from './composables/useToast'

const route = useRoute()
const router = useRouter()
onMounted(async () => {
  await loadSteam()
  const q = new URLSearchParams(location.search).get('steam')
  if (q === 'ok' && steam.status === 'in') toast(`Connecté à Steam : ${steam.count} jeu${steam.count > 1 ? 'x' : ''} synchronisé${steam.count > 1 ? 's' : ''}`)
  else if (q === 'refuse' || q === 'invalide') toast('Connexion Steam refusée ou invalide', 'warn')
  if (q) router.replace({ path: route.path })
})
const bare = computed(() => route.meta.bare)

// Transition de page pilotée par GSAP.
function enter(el, done) {
  if (prefersReduced()) return done()
  gsap.fromTo(el, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', onComplete: () => { gsap.set(el, { clearProps: 'all' }); done() } })
}
function leave(el, done) {
  if (prefersReduced()) return done()
  gsap.to(el, { opacity: 0, y: -16, duration: 0.25, ease: 'power2.in', onComplete: done })
}
</script>

<template>
  <div class="relative min-h-screen overflow-x-clip bg-ink text-white">
    <AppHeader v-if="!bare" />
    <RouterView v-slot="{ Component, route: r }">
      <Transition :css="false" mode="out-in" @enter="enter" @leave="leave">
        <component :is="Component" :key="r.path" />
      </Transition>
    </RouterView>
    <Toaster />
  </div>
</template>
