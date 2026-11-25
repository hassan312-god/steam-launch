<script setup>
// Page Téléchargements : l'état réel de ton client Steam (octets, vitesse, temps restant), sans quitter le launcher.
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { connectSteam, steam } from '../composables/useSteam'
import PageBackdrop from '../components/PageBackdrop.vue'
import SplitText from '../components/bits/SplitText.vue'
import { cmd, desktop, downloads, fmtBytes, fmtEta, fmtSpeed } from '../composables/useDesktop'
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
const stateOf = (a) => (a.failed ? 'Erreur' : a.queued ? 'En attente' : a.paused ? (a.job ? 'En pause' : 'En pause dans Steam') : a.phase === 'verifying' ? `Vérification des fichiers ${Math.round((a.verify || 0) * 100)} %` : a.phase === 'finishing' ? 'Finalisation…' : a.speed > 0 ? 'Téléchargement' : 'Démarrage…')
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <PageBackdrop src="" :height="420" />
    <main class="shell relative flex flex-col gap-9 pb-20 pt-2">
      <div class="flex flex-wrap items-end justify-between gap-5">
        <div class="flex flex-col gap-2">
          <h1 class="page-title m-0">Téléchargements</h1>
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
        <!-- Compte : on lit la connexion Steam existante, on ne redemande rien -->
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-panel px-5 py-4">
          <span v-if="steam.status === 'in'" class="flex items-center gap-3 text-sm text-soft">
            <img v-if="steam.profile?.avatar" :src="steam.profile.avatar" alt="" class="size-9 rounded-full" />
            <span>Connecté à Steam en tant que <strong class="text-white">{{ steam.profile?.name }}</strong>. Tes installations passent par ton client Steam et sont suivies ici en direct.</span>
          </span>
          <span v-else-if="steam.status === 'loading'" class="text-sm text-soft">Vérification de ta connexion Steam…</span>
          <span v-else class="text-sm text-soft">Tu n’es pas connecté à Steam dans le launcher : ta bibliothèque et tes heures de jeu n’apparaissent pas.</span>
          <button v-if="steam.status === 'out'" type="button" class="h-10 rounded-full bg-accent px-5 text-sm font-extrabold text-ink" @click="connectSteam">Se connecter avec Steam</button>
          <span v-else-if="desktop.canCmd && desktop.cmd.account" class="flex items-center gap-3 text-sm text-soft">Téléchargement intégré actif · {{ desktop.cmd.account }}<button type="button" class="h-9 rounded-full border border-white/20 bg-transparent px-4 text-sm font-semibold text-white hover:bg-white/10" @click="cmd.logout()">Désactiver</button></span>
        </div>
        <p v-if="steam.status === 'in' && desktop.canCmd && !desktop.cmd.account" class="m-0 text-xs text-mute">Pause et reprise dans le launcher : <button type="button" class="border-0 bg-transparent p-0 text-xs font-semibold text-soft underline hover:text-white" @click="desktop.loginAsk = { game: null }">activer le téléchargement intégré</button> (mot de passe demandé une fois, facultatif).</p>
        <p v-if="!desktop.steamFound && !desktop.canCmd" class="m-0 rounded-3xl border border-dashed border-white/20 p-8 text-soft">Steam est introuvable sur cet ordinateur : installe le client Steam et connecte-toi dedans.</p>

        <section v-if="desktop.steamFound || desktop.canCmd" class="flex flex-col gap-4" aria-labelledby="dl-h">
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
                  <span class="shrink-0 font-display text-2xl font-black tabular-nums" :class="a.paused ? 'text-soft' : 'text-accent'">{{ pct(a) }} %</span>
                </div>
                <span class="h-2 overflow-hidden rounded-full bg-white/[0.12]" role="progressbar" :aria-valuenow="pct(a)" aria-valuemin="0" aria-valuemax="100" :aria-label="'Progression de ' + a.name"><span class="block h-full rounded-full transition-[width] duration-700" :class="a.paused ? 'bg-white/45' : 'bg-accent'" :style="{ width: pct(a) + '%' }" /></span>
                <dl class="m-0 flex flex-wrap gap-x-8 gap-y-1 text-[13px]">
                  <div class="flex gap-1.5"><dt class="text-mute">État</dt><dd class="m-0 font-semibold" :class="a.failed ? 'text-hot' : a.paused || a.queued ? 'text-soft' : 'text-white'">{{ stateOf(a) }}</dd></div>
                  <div class="flex gap-1.5"><dt class="text-mute">Téléchargé</dt><dd class="m-0 font-semibold tabular-nums">{{ fmtBytes(a.bytesDownloaded) }} / {{ fmtBytes(a.bytesToDownload) }}</dd></div>
                  <div v-if="!a.paused && !a.queued && !a.failed" class="flex gap-1.5"><dt class="text-mute">Vitesse</dt><dd class="m-0 font-semibold tabular-nums">{{ fmtSpeed(a.speed) }}</dd></div>
                  <div v-if="!a.paused && !a.queued && !a.failed" class="flex gap-1.5"><dt class="text-mute">Temps restant</dt><dd class="m-0 font-semibold tabular-nums">{{ fmtEta(a.eta) }}</dd></div>
                </dl>
                <p v-if="a.failed && a.message" class="m-0 text-sm text-hot" role="alert">{{ a.message }}</p>
              </div>
              <div v-if="a.job" class="flex shrink-0 flex-col gap-2 sm:flex-row">
                <button v-if="a.paused || a.failed" type="button" class="flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-extrabold text-ink" @click="cmd.resume(a.appid)"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>Reprendre</button>
                <button v-else type="button" class="flex h-11 items-center gap-2 rounded-full border border-white/20 bg-transparent px-5 text-sm font-semibold text-white hover:bg-white/10" @click="cmd.pause(a.appid)"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>Pause</button>
                <button type="button" class="h-11 rounded-full border border-white/10 bg-transparent px-4 text-sm font-semibold text-mute hover:text-hot" :aria-label="'Annuler le téléchargement de ' + a.name" @click="cmd.cancel(a.appid)">Annuler</button>
              </div>
            </li>
          </ul>
          <p v-if="active.some((a) => a.paused && !a.job)" class="m-0 max-w-[640px] text-xs text-mute">Un téléchargement lancé depuis le client Steam se met en pause et reprend dans Steam ; le launcher en suit l’état en direct.</p>
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
