<script setup>
// Page Téléchargements : l'état réel de ton client Steam (octets, vitesse, temps restant), sans quitter le launcher.
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import PageBackdrop from '../components/PageBackdrop.vue'
import SplitText from '../components/bits/SplitText.vue'
import { desktop, downloads, fmtBytes, fmtEta, fmtSpeed } from '../composables/useDesktop'
import { play } from '../composables/useLaunch'

const active = computed(() => downloads())
const done = computed(() => Object.values(desktop.apps).filter((a) => a.installed && !a.downloading).sort((x, y) => y.sizeOnDisk - x.sizeOnDisk))
const speedTotal = computed(() => active.value.reduce((n, a) => n + (a.speed || 0), 0))
const art = (id) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/library_600x900.jpg`
function onErr(e, id) {
  const img = e.target
  if (!img.dataset.tried) (img.dataset.tried = '1'), (img.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`)
  else img.remove()
}
const pct = (a) => Math.round(a.progress * 100)
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <PageBackdrop src="" :height="420" />
    <main class="shell relative flex flex-col gap-9 pb-20 pt-2">
      <div class="flex flex-wrap items-end justify-between gap-5">
        <div class="flex flex-col gap-2">
          <span class="eyebrow">Ton client Steam</span>
          <h1 class="page-title m-0"><SplitText text="Téléchargements" :delay="0.1" /></h1>
        </div>
        <div v-if="desktop.available && active.length" class="flex gap-8" aria-live="polite">
          <div class="flex flex-col"><span class="font-display text-3xl font-black leading-none">{{ active.length }}</span><span class="mt-1.5 text-[13px] text-mute">en cours</span></div>
          <div class="flex flex-col"><span class="font-display text-3xl font-black leading-none text-accent">{{ fmtSpeed(speedTotal) }}</span><span class="mt-1.5 text-[13px] text-mute">vitesse totale</span></div>
        </div>
      </div>

      <section v-if="!desktop.available" class="flex max-w-[620px] flex-col items-start gap-4 rounded-3xl border border-white/10 bg-panel p-7">
        <h2 class="m-0 font-display text-xl font-extrabold">Disponible dans l’application de bureau</h2>
        <p class="m-0 text-soft">Le suivi réel des téléchargements lit ton client Steam sur ton ordinateur : il n’existe que dans l’application G.A Launcher.</p>
        <RouterLink to="/telecharger" class="flex h-12 items-center rounded-full bg-accent px-7 text-[15px] font-extrabold text-ink no-underline">Télécharger l’application</RouterLink>
      </section>

      <template v-else>
        <p v-if="!desktop.steamFound" class="m-0 rounded-3xl border border-dashed border-white/20 p-8 text-soft">Steam est introuvable sur cet ordinateur : installe le client Steam et connecte-toi dedans.</p>

        <section v-else class="flex flex-col gap-4" aria-labelledby="dl-h">
          <h2 id="dl-h" class="m-0 font-display text-xl font-extrabold">En cours</h2>
          <p v-if="!active.length" class="m-0 rounded-3xl border border-dashed border-white/20 p-8 text-soft">Aucun téléchargement en cours. Lance une installation depuis la fiche d’un jeu : elle apparaîtra ici avec sa progression réelle.</p>
          <ul v-else class="m-0 flex list-none flex-col gap-4 p-0">
            <li v-for="a in active" :key="a.appid" class="flex items-center gap-5 rounded-3xl border border-white/[0.07] bg-panel p-4 sm:p-5">
              <RouterLink :to="'/jeu/' + a.appid" class="shrink-0" :aria-label="a.name">
                <span class="relative flex h-[108px] w-[72px] items-center justify-center overflow-hidden rounded-2xl bg-panel-2 font-display text-2xl font-black text-accent shadow-[0_14px_30px_rgba(0,0,0,0.45)]">{{ (a.name || '?').charAt(0).toUpperCase() }}<img :src="art(a.appid)" alt="" loading="lazy" class="absolute inset-0 size-full object-cover" @error="onErr($event, a.appid)" /></span>
              </RouterLink>
              <div class="flex min-w-0 flex-1 flex-col gap-3">
                <div class="flex items-baseline justify-between gap-4">
                  <RouterLink :to="'/jeu/' + a.appid" class="truncate font-display text-lg font-extrabold text-white no-underline">{{ a.name }}</RouterLink>
                  <span class="shrink-0 font-display text-2xl font-black tabular-nums" :class="a.paused ? 'text-amber' : 'text-accent'">{{ pct(a) }} %</span>
                </div>
                <span class="h-2 overflow-hidden rounded-full bg-white/[0.12]" role="progressbar" :aria-valuenow="pct(a)" aria-valuemin="0" aria-valuemax="100" :aria-label="'Progression de ' + a.name"><span class="block h-full rounded-full transition-[width] duration-700" :class="a.paused ? 'bg-amber' : 'bg-accent'" :style="{ width: pct(a) + '%' }" /></span>
                <dl class="m-0 flex flex-wrap gap-x-8 gap-y-1 text-[13px]">
                  <div class="flex gap-1.5"><dt class="text-mute">État</dt><dd class="m-0 font-semibold" :class="a.paused ? 'text-amber' : 'text-white'">{{ a.paused ? 'En pause dans Steam' : a.speed > 0 ? 'Téléchargement' : 'Démarrage…' }}</dd></div>
                  <div class="flex gap-1.5"><dt class="text-mute">Téléchargé</dt><dd class="m-0 font-semibold tabular-nums">{{ fmtBytes(a.bytesDownloaded) }} / {{ fmtBytes(a.bytesToDownload) }}</dd></div>
                  <div v-if="!a.paused" class="flex gap-1.5"><dt class="text-mute">Vitesse</dt><dd class="m-0 font-semibold tabular-nums">{{ fmtSpeed(a.speed) }}</dd></div>
                  <div v-if="!a.paused" class="flex gap-1.5"><dt class="text-mute">Temps restant</dt><dd class="m-0 font-semibold tabular-nums">{{ fmtEta(a.eta) }}</dd></div>
                </dl>
              </div>
            </li>
          </ul>
          <p v-if="active.some((a) => a.paused)" class="m-0 max-w-[640px] text-xs text-mute">Ce téléchargement est en pause dans ton client Steam : le launcher en suit l’état en direct, mais la reprise ne peut se faire que depuis Steam.</p>
        </section>

        <section v-if="desktop.steamFound && done.length" class="flex flex-col gap-4" aria-labelledby="ok-h">
          <h2 id="ok-h" class="m-0 font-display text-xl font-extrabold">Installés <span class="text-base font-semibold text-mute">· {{ done.length }}</span></h2>
          <ul class="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 xl:grid-cols-3">
            <li v-for="a in done" :key="a.appid" class="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-panel p-3">
              <span class="relative flex h-[60px] w-[40px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-panel-2 font-display font-black text-accent">{{ (a.name || '?').charAt(0).toUpperCase() }}<img :src="art(a.appid)" alt="" loading="lazy" class="absolute inset-0 size-full object-cover" @error="onErr($event, a.appid)" /></span>
              <div class="flex min-w-0 flex-1 flex-col"><RouterLink :to="'/jeu/' + a.appid" class="truncate text-[15px] font-bold text-white no-underline">{{ a.name }}</RouterLink><span class="text-xs text-mute">{{ fmtBytes(a.sizeOnDisk) }} sur le disque</span></div>
              <button type="button" class="h-10 shrink-0 rounded-full bg-accent px-5 text-sm font-extrabold text-ink" @click="play({ id: a.appid, title: a.name })">Jouer</button>
            </li>
          </ul>
        </section>
      </template>
    </main>
  </div>
</template>
