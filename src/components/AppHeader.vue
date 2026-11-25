<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import gsap from 'gsap'
import Logo from './Logo.vue'
import Ring from './bits/Ring.vue'
import SearchOverlay from './SearchOverlay.vue'
import NotificationsPanel from './NotificationsPanel.vue'
import { prefersReduced } from '../composables/motion'

const route = useRoute()
const links = [
  { to: '/accueil', label: 'Accueil' },
  { to: '/magasin', label: 'Magasin' },
  { to: '/bibliotheque', label: 'Bibliothèque' },
  { to: '/amis', label: 'Amis' },
  { to: '/parametres', label: 'Paramètres' },
]

const searchOpen = ref(false)
const notifOpen = ref(false)
const unread = ref(true)
const notifBox = ref(null)
// Ctrl/Cmd + K ouvre la recherche ; un clic en dehors ferme les notifications.
function onGlobalKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') (e.preventDefault(), (searchOpen.value = !searchOpen.value))
  else if (e.key === 'Escape') notifOpen.value = false
}
function onDocClick(e) {
  if (notifOpen.value && !notifBox.value?.contains(e.target)) notifOpen.value = false
}
const header = ref(null)
const nav = ref(null)
const pill = ref(null)
const time = ref('')
let clock
let ro

const tick = () => (time.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))

function movePill(animate = true) {
  const i = links.findIndex((l) => route.path === l.to)
  const a = nav.value?.querySelectorAll('a')[i]
  if (!a || !pill.value) return gsap.set(pill.value, { opacity: 0 })
  const props = { x: a.offsetLeft, width: a.offsetWidth, opacity: 1 }
  if (!animate || prefersReduced()) gsap.set(pill.value, props)
  else gsap.to(pill.value, { ...props, duration: 0.55, ease: 'power3.out' })
}

onMounted(async () => {
  window.addEventListener('keydown', onGlobalKey)
  document.addEventListener('mousedown', onDocClick)
  tick()
  clock = setInterval(tick, 15000)
  await nextTick()
  movePill(false)
  // Hauteur de l'en-tête exposée aux pages pour qu'elles se calent dessous.
  ro = new ResizeObserver(() => {
    document.documentElement.style.setProperty('--header-h', header.value.offsetHeight + 'px')
    movePill(false)
  })
  ro.observe(header.value)
  if (!prefersReduced()) gsap.from(header.value.children, { y: -24, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' })
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKey)
  document.removeEventListener('mousedown', onDocClick)
  clearInterval(clock)
  ro?.disconnect()
})
watch(() => route.path, () => {
  movePill(true)
  notifOpen.value = false
})
</script>

<template>
  <header ref="header" class="absolute inset-x-0 top-0 z-30 flex flex-wrap items-center justify-between gap-5 shell py-6">
    <RouterLink to="/accueil" aria-label="Accueil G.A" class="no-underline"><Logo /></RouterLink>

    <nav ref="nav" class="glass relative flex max-w-full gap-1 overflow-x-auto rounded-full p-[5px] text-sm font-semibold no-scrollbar" aria-label="Navigation principale">
      <span ref="pill" aria-hidden="true" class="absolute left-0 top-[5px] bottom-[5px] w-0 rounded-full bg-accent opacity-0" />
      <RouterLink
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="relative z-10 whitespace-nowrap rounded-full px-[18px] py-2.5 no-underline transition-colors duration-300"
        :class="route.path === l.to ? 'text-ink' : 'text-fog hover:text-white'"
        :aria-current="route.path === l.to ? 'page' : undefined"
      >{{ l.label }}</RouterLink>
    </nav>

    <div class="flex items-center gap-2.5">
      <span class="mr-1.5 text-sm font-semibold tabular-nums text-fog">{{ time }}</span>
      <button type="button" aria-label="Rechercher (Ctrl+K)" aria-haspopup="dialog" class="glass-btn flex size-11 items-center justify-center rounded-full text-white transition-transform hover:scale-110" @click="searchOpen = true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
      </button>
      <div ref="notifBox" class="relative">
        <button type="button" aria-label="Notifications" aria-haspopup="dialog" :aria-expanded="notifOpen" class="glass-btn relative flex size-11 items-center justify-center rounded-full text-white transition-transform hover:scale-110" @click="notifOpen = !notifOpen">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
          <span v-if="unread" class="absolute right-2.5 top-[9px] size-2 animate-pulse rounded-full bg-hot" />
        </button>
        <NotificationsPanel :open="notifOpen" :unread="unread" @close="notifOpen = false" @read="unread = false" />
      </div>
      <RouterLink to="/parametres" aria-label="Mon profil" class="no-underline transition-transform hover:scale-105">
        <Ring :value="72" :size="48" :thickness="3" inner="var(--color-avatar)"><span class="font-display text-[15px] font-extrabold text-white">H</span></Ring>
      </RouterLink>
    </div>
  </header>
  <SearchOverlay :open="searchOpen" @close="searchOpen = false" />
</template>
