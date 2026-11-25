<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import SplitText from '../components/bits/SplitText.vue'
import CountUp from '../components/bits/CountUp.vue'
import { accents, byId, libraryAll, walls } from '../data/games'
import { setAccent, theme } from '../composables/useTheme'
import Modal from '../components/Modal.vue'
import { toast } from '../composables/useToast'
import { checkUpdate, desktop, installUpdate, installedCount, notify, setSetting } from '../composables/useDesktop'
import { connectSteam, disconnectSteam, displayName, loadSteam, steam } from '../composables/useSteam'
import { prefersReduced } from '../composables/motion'

const editOpen = ref(false)
const draft = ref('')
const openEdit = () => ((draft.value = theme.username), (editOpen.value = true))
function saveName() {
  const n = draft.value.trim().slice(0, 20)
  if (!n) return toast('Le pseudo ne peut pas être vide', 'warn')
  theme.username = n
  editOpen.value = false
  toast('Profil mis à jour')
}
const densities = ['Compact', 'Confort', 'Géant']
const wall = computed(() => byId[theme.wall].wide)
const toggles = [
  ['bgVideo', 'Vidéos en arrière-plan', 'Joue la bande-annonce du jeu en fond de l’accueil et des fiches'],
  ['trailerSound', 'Son des bandes-annonces', 'Active le son par défaut quand une vidéo se lance'],
]
const deskToggles = [
  ['notifications', 'Notifications Windows', 'Téléchargement terminé, promotions sur tes jeux favoris'],
  ['closeToTray', 'Réduire dans la zone de notification', 'Fermer la fenêtre garde le launcher actif en arrière-plan, comme Steam'],
  ['openAtLogin', 'Lancer au démarrage de l’ordinateur', 'Le launcher démarre réduit avec la session'],
]
const favCount = computed(() => libraryAll.value.filter((g) => g.fav).length)

function wallEnter(el, done) {
  if (prefersReduced()) return done()
  gsap.fromTo(el, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', onComplete: done })
}
function wallLeave(el, done) {
  gsap.to(el, { opacity: 0, duration: 0.8, onComplete: done })
}

const root = ref(null)
let ctx
onMounted(() => {
  if (prefersReduced()) return
  ctx = gsap.context(() => {
    gsap.from('[data-banner]', { opacity: 0, y: 40, scale: 0.97, duration: 0.9, ease: 'power3.out', delay: 0.1 })
    gsap.from('[data-panel]', { opacity: 0, y: 50, stagger: 0.15, duration: 0.9, ease: 'power3.out', delay: 0.35 })
    gsap.from('[data-row]', { opacity: 0, x: 24, stagger: 0.07, duration: 0.6, ease: 'power3.out', delay: 0.7 })
  }, root.value)
})
onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div ref="root" class="relative min-h-screen overflow-hidden bg-ink pt-[var(--header-h,100px)]">
    <main class="relative flex flex-col gap-6 shell pb-14 pt-2">
      <section data-banner class="relative flex min-h-[260px] items-end overflow-hidden rounded-[28px]" aria-label="Profil">
        <div class="absolute inset-0 overflow-hidden">
          <Transition :css="false" @enter="wallEnter" @leave="wallLeave">
            <img :key="theme.wall" :src="wall" alt="" class="absolute inset-0 size-full object-cover" />
          </Transition>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-ink/95 to-ink/20 to-75%" />
        <div class="relative flex w-full flex-wrap items-end justify-between gap-5 px-8 py-7">
          <div class="flex items-center gap-5">
            <span class="flex size-[104px] items-center justify-center overflow-hidden rounded-full border-[5px] border-accent bg-avatar font-display text-4xl font-black uppercase"><img v-if="steam.profile?.avatar" :src="steam.profile.avatar" alt="" class="size-full object-cover" /><template v-else>{{ (displayName || 'J')[0] }}</template></span>
            <div class="flex flex-col gap-1.5">
              <span class="font-display text-[clamp(26px,4vw,38px)] font-black tracking-[-0.02em]"><SplitText :text="displayName" :key="displayName" :delay="0.5" /></span>
              <span class="text-sm text-[#D7D8E0]"><CountUp :to="libraryAll.length" :duration="1" :delay="0.6" /> jeu{{ libraryAll.length > 1 ? 'x' : '' }} · {{ favCount }} favori{{ favCount > 1 ? 's' : '' }}</span>
            </div>
          </div>
          <button v-if="steam.status !== 'in'" type="button" class="h-[46px] rounded-full border border-white/20 bg-ink/55 px-[22px] text-sm font-bold text-white transition-colors hover:bg-white/10" @click="openEdit">Modifier le profil</button>
        </div>
      </section>

      <section data-panel class="card flex flex-wrap items-center justify-between gap-5 p-7" aria-labelledby="steam-h">
        <div class="flex min-w-0 flex-col gap-1">
          <h2 id="steam-h" class="m-0 font-display text-[22px] font-black">Compte Steam</h2>
          <p v-if="steam.status === 'in'" class="m-0 text-sm text-soft">Connecté en tant que <strong class="text-white">{{ steam.profile.name }}</strong> · {{ steam.count }} jeu{{ steam.count > 1 ? 'x' : '' }} synchronisé{{ steam.count > 1 ? 's' : '' }}<span v-if="!steam.gamesVisible" class="text-amber"> · détails de jeu privés</span></p>
          <p v-else-if="steam.status === 'not_configured'" class="m-0 text-sm text-soft">La connexion Steam n’est pas encore configurée sur ce site.</p>
          <p v-else-if="steam.status === 'unavailable'" class="m-0 text-sm text-soft">Connexion Steam indisponible ici (disponible sur le site en ligne).</p>
          <p v-else class="m-0 text-sm text-soft">Retrouve tes vrais jeux et tes heures de jeu. Ton profil et tes détails de jeu doivent être publics.</p>
        </div>
        <div class="flex flex-wrap gap-2.5">
          <template v-if="steam.status === 'in'">
            <button type="button" class="h-11 rounded-full border border-white/20 bg-transparent px-5 text-sm font-semibold text-white hover:bg-white/10" @click="loadSteam().then(() => toast('Bibliothèque Steam resynchronisée'))">Resynchroniser</button>
            <button type="button" class="h-11 rounded-full border border-white/20 bg-transparent px-5 text-sm font-semibold text-white hover:bg-white/10" @click="disconnectSteam">Se déconnecter</button>
          </template>
          <a v-else-if="steam.status === 'out'" href="/api/steam/login" @click.prevent="connectSteam" class="flex h-11 items-center rounded-full bg-accent px-6 text-sm font-extrabold text-ink no-underline">Se connecter avec Steam</a>
        </div>
      </section>

      <section data-panel class="card flex flex-wrap items-center justify-between gap-5 p-7" aria-labelledby="app-h">
        <div class="flex min-w-0 flex-col gap-1">
          <h2 id="app-h" class="m-0 font-display text-[22px] font-black">Application de bureau</h2>
          <p v-if="desktop.available && desktop.steamFound" class="m-0 text-sm text-soft"><strong class="text-accent">Steam détecté</strong> sur cet ordinateur · {{ desktop.libraries }} bibliothèque{{ desktop.libraries > 1 ? 's' : '' }} · {{ installedCount() }} jeu{{ installedCount() > 1 ? 'x' : '' }} installé{{ installedCount() > 1 ? 's' : '' }}</p>
          <p v-else-if="desktop.available" class="m-0 text-sm text-soft">Steam est introuvable sur cet ordinateur : installe le client Steam et connecte-toi dedans pour installer et lancer tes jeux d’ici.</p>
          <p v-else class="m-0 max-w-[620px] text-sm text-soft">Pour installer, suivre les téléchargements et lancer tes jeux sans quitter le launcher, utilise l’application de bureau (Windows, macOS, Linux). Elle lit l’état réel de ton client Steam.</p>
        </div>
        <RouterLink v-if="!desktop.available" to="/telecharger" class="flex h-11 items-center rounded-full bg-accent px-6 text-sm font-extrabold text-ink no-underline">Télécharger l’application</RouterLink>
        <div v-else class="flex w-full flex-col">
          <div v-for="[key, label, hint] in deskToggles" :key="key" class="flex items-center justify-between gap-5 border-t border-white/[0.07] py-4">
            <div class="flex flex-col gap-[3px]"><label :for="'d-' + key" class="text-[15px] font-semibold">{{ label }}</label><span class="text-[13px] text-mute">{{ hint }}</span></div>
            <input :id="'d-' + key" type="checkbox" class="nv-sw" :checked="desktop.settings[key]" @change="setSetting({ [key]: $event.target.checked })" />
          </div>
          <div class="flex flex-wrap items-center gap-3 border-t border-white/[0.07] py-4">
            <template v-if="!desktop.canUpdate">
              <div class="flex min-w-0 flex-1 flex-col gap-[3px]"><span class="text-[15px] font-semibold">Ancienne version de l’application</span>
                <span class="text-[13px] text-mute">Cette version est trop ancienne pour se mettre à jour toute seule. Installe la dernière une fois : les suivantes se mettront à jour automatiquement.</span></div>
              <RouterLink to="/telecharger" class="flex h-11 items-center rounded-full bg-accent px-5 text-sm font-extrabold text-ink no-underline">Télécharger la dernière version</RouterLink>
            </template>
            <template v-else>
            <div class="flex min-w-0 flex-1 flex-col gap-[3px]"><span class="text-[15px] font-semibold">Version {{ desktop.version || '—' }}</span>
              <span class="text-[13px] text-mute" aria-live="polite">{{ { idle: 'Les mises à jour sont vérifiées automatiquement.', checking: 'Recherche de mise à jour…', latest: 'Tu as la dernière version.', downloading: `Téléchargement de la version ${desktop.update.version} : ${desktop.update.percent} %`, ready: `La version ${desktop.update.version} est prête à être installée.`, error: 'Mise à jour impossible pour le moment.' }[desktop.update.status] }}</span></div>
            <button v-if="desktop.update.status === 'ready'" type="button" class="h-11 rounded-full bg-accent px-5 text-sm font-extrabold text-ink" @click="installUpdate">Redémarrer et installer</button>
            <button v-else type="button" :disabled="['checking', 'downloading'].includes(desktop.update.status)" class="h-11 rounded-full border border-white/20 bg-transparent px-5 text-sm font-semibold text-white enabled:hover:bg-white/10 disabled:opacity-50" @click="checkUpdate">Rechercher une mise à jour</button>
            </template>
          </div>
          <button type="button" class="mt-2 h-11 self-start rounded-full border border-white/20 bg-transparent px-5 text-sm font-semibold text-white hover:bg-white/10" @click="notify('G.A Launcher', 'Les notifications du bureau fonctionnent.', '/parametres')">Tester une notification</button>
        </div>
      </section>

      <div class="flex flex-wrap items-start gap-5">
        <section data-panel class="card flex min-w-0 flex-[1_1_440px] flex-col gap-[26px] p-7" aria-labelledby="style-h">
          <div class="flex flex-col gap-1">
            <h1 id="style-h" class="m-0 font-display text-[26px] font-black">Ton style</h1>
            <span class="text-sm text-mute">Tout le launcher change en direct.</span>
          </div>
          <div class="flex flex-col gap-3">
            <span class="text-sm font-bold">Couleur d’accent</span>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="[name, hex] in accents"
                :key="hex"
                type="button"
                :aria-label="name"
                :aria-pressed="theme.accent.toLowerCase() === hex.toLowerCase()"
                class="size-12 rounded-full border-4 border-panel transition-transform duration-300 hover:scale-110 active:scale-90"
                :class="theme.accent.toLowerCase() === hex.toLowerCase() ? 'shadow-[0_0_0_2px_#fff]' : ''"
                :style="{ background: hex }"
                @click="setAccent(hex)"
              />
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <span class="text-sm font-bold">Fond de profil et d’accueil</span>
            <div class="grid grid-cols-4 gap-2.5">
              <button
                v-for="[name, slug] in walls"
                :key="slug"
                type="button"
                :aria-label="name"
                :aria-pressed="theme.wall === slug"
                class="h-[76px] overflow-hidden rounded-[14px] border-0 bg-avatar p-0 transition-all duration-300 hover:scale-105"
                :class="theme.wall === slug ? 'shadow-[0_0_0_3px_var(--accent)]' : ''"
                @click="theme.wall = slug"
              ><img :src="byId[slug].wide" alt="" class="block size-full object-cover" /></button>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <span id="dens-l" class="text-sm font-bold">Taille des jaquettes</span>
            <div class="relative flex rounded-full border border-white/[0.08] bg-ink p-[5px]" role="group" aria-labelledby="dens-l">
              <button
                v-for="d in densities"
                :key="d"
                type="button"
                :aria-pressed="theme.density === d"
                class="h-[42px] flex-1 rounded-full border-0 text-sm font-bold transition-all duration-300"
                :class="theme.density === d ? 'bg-accent text-ink' : 'bg-transparent text-white hover:bg-white/10'"
                @click="theme.density = d"
              >{{ d }}</button>
            </div>
          </div>
        </section>

        <section data-panel class="card flex min-w-0 flex-[1_1_440px] flex-col p-7" aria-labelledby="xp-h">
          <h2 id="xp-h" class="m-0 mb-2 font-display text-[26px] font-black">Affichage</h2>
          <div v-for="[key, label, hint] in toggles" :key="key" data-row class="flex items-center justify-between gap-5 border-b border-white/[0.07] py-4 last:border-b-0">
            <div class="flex flex-col gap-[3px]"><label :for="key" class="text-[15px] font-semibold">{{ label }}</label><span class="text-[13px] text-mute">{{ hint }}</span></div>
            <input :id="key" v-model="theme[key]" type="checkbox" class="nv-sw" />
          </div>
        </section>
      </div>
    </main>
    <Modal :open="editOpen" title="Modifier le profil" @close="editOpen = false">
      <form @submit.prevent="saveName">
        <label for="pseudo" class="mb-2 block text-sm font-semibold">Pseudo</label>
        <input id="pseudo" v-model="draft" maxlength="20" autocomplete="off" class="h-12 w-full rounded-full border border-white/[0.14] bg-ink px-5 text-white focus:border-accent focus:outline-none" />
        <div class="mt-5 flex justify-end gap-2.5">
          <button type="button" class="h-11 rounded-full border border-white/20 bg-transparent px-5 text-sm font-semibold text-white hover:bg-white/10" @click="editOpen = false">Annuler</button>
          <button type="submit" class="h-11 rounded-full bg-accent px-6 text-sm font-extrabold text-ink">Enregistrer</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
