<script setup>
import { computed, onMounted, ref } from 'vue'
import gsap from 'gsap'
import SplitText from '../components/bits/SplitText.vue'
import Magnet from '../components/bits/Magnet.vue'
import ShinyText from '../components/bits/ShinyText.vue'
import { desktop } from '../composables/useDesktop'
import { prefersReduced } from '../composables/motion'

// La dernière Release publique du dépôt contient l'installateur (publié par GitHub Actions).
const REPO = 'hassan312-god/steam-launch'
const info = ref(null)
const loaded = ref(false)
const isWindows = /Windows/i.test(navigator.userAgent)
const mb = computed(() => (info.value ? (info.value.size / 1024 ** 2).toFixed(0) : ''))
const date = computed(() => (info.value ? new Date(info.value.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''))

const features = [
  ['Installer et lancer', 'Tes jeux Steam s’installent, se lancent et se désinstallent depuis le launcher.'],
  ['Téléchargements en direct', 'La progression réelle de chaque téléchargement, lue dans ton client Steam.'],
  ['Notifications Windows', 'Téléchargement terminé, promotions sur tes favoris : dans le centre de notifications.'],
  ['Toujours à portée', 'Réduit dans la zone de notification, démarrage avec Windows en option.'],
]

onMounted(async () => {
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    if (r.ok) {
      const rel = await r.json()
      const exe = rel.assets?.find((x) => x.name === 'GA-Launcher-Setup.exe')
      if (exe) info.value = { url: exe.browser_download_url, size: exe.size, date: exe.updated_at, version: rel.tag_name.replace(/^v/, ''), sha256: (exe.digest || '').replace('sha256:', '') }
    }
  } catch { /* pas encore publié ou hors ligne */ }
  loaded.value = true
  if (!prefersReduced()) gsap.from('[data-in]', { opacity: 0, y: 28, stagger: 0.1, duration: 0.8, ease: 'power3.out', delay: 0.15 })
})
const steps = [
  'Télécharge puis ouvre le fichier. Le client Steam doit être installé et connecté.',
  'Si Windows affiche « protégé votre ordinateur » (installateur non signé) : <strong class="text-white">Informations complémentaires</strong> puis <strong class="text-white">Exécuter quand même</strong>.',
  'Connecte ton compte Steam dans Paramètres pour retrouver ta bibliothèque.',
]
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(60%_80%_at_50%_0%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent)]" />
    <main class="shell relative flex flex-col gap-12 pb-20 pt-8">
      <section class="flex flex-col items-start gap-6">
        <span data-in class="eyebrow">Application de bureau</span>
        <h1 class="page-title m-0"><SplitText text="G.A Launcher pour Windows" :delay="0.15" /></h1>
        <p data-in class="m-0 max-w-[640px] text-lg text-soft">Le launcher, en vrai logiciel : il pilote ton client Steam, suit tes téléchargements et t’envoie des notifications Windows.</p>

        <div v-if="desktop.available" data-in class="card p-6 text-soft">Tu utilises déjà l’application de bureau.</div>
        <div v-else-if="info" data-in class="flex flex-wrap items-center gap-5">
          <Magnet :padding="30" :strength="0.25">
            <a :href="info.url" class="flex h-[64px] items-center gap-3 rounded-full bg-accent px-9 text-[18px] font-extrabold text-ink no-underline">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
              <ShinyText :speed="4">Télécharger pour Windows (.exe)</ShinyText>
            </a>
          </Magnet>
          <span class="text-sm text-mute">Version {{ info.version }} · {{ mb }} Mo · {{ date }}</span>
        </div>
        <div v-else-if="loaded" data-in class="card flex max-w-[560px] flex-col gap-2 p-6">
          <strong>L’installateur arrive bientôt</strong>
          <span class="text-sm text-soft">Il est en cours de construction. Reviens dans quelques minutes.</span>
        </div>
        <p v-if="info && !isWindows && !desktop.available" data-in class="m-0 text-sm text-amber">Cet installateur est pour Windows 10 / 11 (64 bits).</p>
      </section>

      <ul data-in class="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-[15px] font-semibold text-soft" aria-label="Fonctions">
        <li v-for="[t] in features" :key="t" class="flex items-center gap-2"><span class="size-1.5 rounded-full bg-accent" aria-hidden="true" />{{ t }}</li>
      </ul>

      <section class="flex max-w-[720px] flex-col gap-5" aria-labelledby="inst-h">
        <h2 id="inst-h" class="m-0 font-display text-xl font-extrabold">Installation en 3 étapes</h2>
        <ol class="m-0 flex list-none flex-col gap-4 p-0">
          <li v-for="(t, i) in steps" :key="i" class="flex gap-4"><span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-extrabold text-accent">{{ i + 1 }}</span><span class="pt-1 text-soft" v-html="t" /></li>
        </ol>
        <p v-if="info?.sha256" class="m-0 break-all text-xs text-mute">SHA-256 : <code>{{ info.sha256 }}</code></p>
      </section>
    </main>
  </div>
</template>
