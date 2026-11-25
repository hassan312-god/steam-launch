<script setup>
import { computed, onMounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import gsap from 'gsap'
import AppHeader from './components/AppHeader.vue'
import Toaster from './components/Toaster.vue'
import { prefersReduced } from './composables/motion'
import { loadSteam, steam } from './composables/useSteam'
import { desktop, notify, startDesktop } from './composables/useDesktop'
import { lookup } from './data/games'
import { toast } from './composables/useToast'

const route = useRoute()
const router = useRouter()

// Comme la liste de souhaits Steam : une notification Windows quand un de tes jeux favoris passe en promotion.
// Chaque promotion (jeu + pourcentage) n'est annoncée qu'une fois.
async function promoAlerts() {
  try {
    const d = await (await fetch('/api/steam/store')).json()
    const specials = d.sections?.find((x) => x.id === 'specials')?.items ?? []
    const seen = JSON.parse(localStorage.getItem('ga-promo-seen') || '{}')
    for (const i of specials) {
      const g = lookup(i.id)
      if (!g || !(g.fav || g.owned) || !i.discount || seen[i.id] === i.discount) continue
      seen[i.id] = i.discount
      notify('Promotion sur Steam', `${i.title} est à -${i.discount} % (${i.price})`, '/jeu/' + i.id)
    }
    localStorage.setItem('ga-promo-seen', JSON.stringify(seen))
  } catch { /* hors ligne ou stockage indisponible */ }
}
onMounted(async () => {
  startDesktop()
  if (desktop.available) {
    window.launcher.onNavigate((route) => router.push(route)) // clic sur une notification Windows
    promoAlerts()
  }
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
