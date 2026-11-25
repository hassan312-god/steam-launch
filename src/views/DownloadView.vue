<script setup>
import { computed, onMounted, ref } from 'vue'
import gsap from 'gsap'
import SplitText from '../components/bits/SplitText.vue'
import { desktop } from '../composables/useDesktop'
import { prefersReduced } from '../composables/motion'

// La dernière Release publique du dépôt contient l'installateur (publié par GitHub Actions).
const REPO = 'hassan312-god/steam-launch'
const info = ref(null)
const loaded = ref(false)
const isWindows = /Windows/i.test(navigator.userAgent)
const mb = computed(() => (info.value ? (info.value.size / 1024 ** 2).toFixed(0) : ''))
const date = computed(() => (info.value ? new Date(info.value.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''))


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
    <main class="shell relative flex flex-col gap-12 pb-20 pt-8">
      <section class="flex flex-col items-start gap-6">
        <h1 class="page-title m-0">G.A Launcher pour Windows</h1>
        <p data-in class="m-0 max-w-[640px] text-lg text-soft">Installe, lance et télécharge tes jeux Steam sans ouvrir Steam. Notifications Windows, mises à jour automatiques.</p>

        <div v-if="desktop.available" data-in class="card p-6 text-soft">Tu utilises déjà l’application de bureau.</div>
        <div v-else-if="info" data-in class="flex flex-wrap items-center gap-5">
          <span class="inline-flex">
            <a :href="info.url" class="flex h-[64px] items-center gap-3 rounded-full bg-accent px-9 text-[18px] font-extrabold text-ink no-underline">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
              <span>Télécharger pour Windows (.exe)</span>
            </a>
          </span>
          <span class="text-sm text-mute">Version {{ info.version }} · {{ mb }} Mo · {{ date }}</span>
        </div>
        <div v-else-if="loaded" data-in class="card flex max-w-[560px] flex-col gap-2 p-6">
          <strong>L’installateur arrive bientôt</strong>
          <span class="text-sm text-soft">Il est en cours de construction. Reviens dans quelques minutes.</span>
        </div>
        <p v-if="info && !isWindows && !desktop.available" data-in class="m-0 text-sm text-soft">Cet installateur est pour Windows 10 / 11 (64 bits).</p>
      </section>

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
