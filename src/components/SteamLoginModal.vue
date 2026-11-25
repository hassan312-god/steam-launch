<script setup>
// Connexion du compte Steam pour télécharger dans le launcher (SteamCMD). Le mot de passe va directement à SteamCMD, sur ton
// ordinateur : il n'est ni enregistré ni envoyé ailleurs. Seul le nom de compte est conservé.
import { computed, ref, watch } from 'vue'
import Modal from './Modal.vue'
import { cmd, desktop } from '../composables/useDesktop'
import { installWithSteamClient } from '../composables/useLaunch'
import { toast } from '../composables/useToast'

const user = ref('')
const pass = ref('')
const code = ref('')
const auth = computed(() => desktop.cmd.auth)
const setup = computed(() => desktop.cmd.setup)
const open = computed(() => !!desktop.loginAsk)
const detected = ref('')
const busy = computed(() => auth.value.state === 'working' || setup.value.state === 'working')

function close() {
  if (['working', 'code', 'confirm'].includes(auth.value.state)) cmd.cancelLogin()
  desktop.loginAsk = null
  pass.value = ''
  code.value = ''
}
async function submit() {
  if (!user.value || !pass.value) return
  await cmd.login(user.value.trim(), pass.value)
  pass.value = '' // le mot de passe ne reste pas en mémoire dans la page
}
const sendCode = () => code.value && (cmd.code(code.value.trim()), (code.value = ''))
// Connexion réussie : on lance le téléchargement qui l'a demandée.
// Le nom de compte est retrouvé dans le client Steam de l'ordinateur : il ne reste que le mot de passe à saisir.
watch(open, async (o) => {
  if (!o || user.value) return
  const a = await window.launcher.cmd.suggest?.().catch(() => null)
  if (a) (user.value = a), (detected.value = a)
})
watch(() => auth.value.state, (st) => {
  if (st !== 'ok' || !desktop.loginAsk) return
  const g = desktop.loginAsk.game
  desktop.loginAsk = null
  if (g) {
    cmd.install(g.id, g.title)
    toast(`Connecté · téléchargement de ${g.title} lancé`)
  } else toast('Compte Steam connecté')
})
function useClient() {
  const g = desktop.loginAsk?.game
  close()
  if (g) installWithSteamClient(g)
}
</script>

<template>
  <Modal :open="open" title="Connecte ton compte Steam" @close="close">
    <p class="m-0 mb-4 text-sm leading-relaxed text-soft">Ta connexion Steam sur le site ne donne pas le droit de télécharger : pour le faire <strong class="text-white">directement dans le launcher</strong> (avec pause et reprise), SteamCMD, l’outil officiel de Valve, a besoin de ton mot de passe, une seule fois. Il va uniquement à SteamCMD, sur cet ordinateur.</p>

    <p v-if="setup.state !== 'idle'" class="m-0 mb-3 rounded-xl bg-white/5 p-3 text-sm" :class="setup.state === 'error' ? 'text-hot' : 'text-soft'" role="status">{{ setup.message }}</p>

    <form v-if="auth.state !== 'code' && auth.state !== 'confirm'" class="flex flex-col gap-3" @submit.prevent="submit">
      <label class="flex flex-col gap-1.5 text-[13px] text-mute">Nom de compte Steam
        <input v-model="user" type="text" autocomplete="username" spellcheck="false" :disabled="busy" @focus="detected = ''" class="h-[46px] rounded-xl border border-white/[0.14] bg-ink/60 px-4 text-[15px] text-white focus:border-accent focus:outline-none" />
      </label>
      <p v-if="detected" class="m-0 -mt-1 text-xs text-mute">Compte trouvé dans ton client Steam.</p>
      <label class="flex flex-col gap-1.5 text-[13px] text-mute">Mot de passe
        <input v-model="pass" type="password" autocomplete="current-password" :disabled="busy" class="h-[46px] rounded-xl border border-white/[0.14] bg-ink/60 px-4 text-[15px] text-white focus:border-accent focus:outline-none" />
      </label>
      <p v-if="auth.state === 'error'" class="m-0 text-sm text-hot" role="alert">{{ auth.message }}</p>
      <p v-else-if="auth.state === 'working'" class="m-0 text-sm text-soft" role="status">{{ auth.message }}</p>
      <button type="submit" :disabled="busy || !user || !pass" class="h-12 rounded-full bg-accent text-[15px] font-extrabold text-ink disabled:opacity-50">{{ busy ? 'Connexion…' : 'Se connecter' }}</button>
    </form>

    <form v-else-if="auth.state === 'code'" class="flex flex-col gap-3" @submit.prevent="sendCode">
      <p class="m-0 text-sm text-soft" role="status">{{ auth.message }}</p>
      <input v-model="code" type="text" inputmode="text" maxlength="8" autocomplete="one-time-code" aria-label="Code Steam Guard" class="h-[52px] rounded-xl border border-white/[0.14] bg-ink/60 px-4 text-center font-display text-2xl font-black uppercase tracking-[0.3em] text-white focus:border-accent focus:outline-none" />
      <button type="submit" :disabled="!code" class="h-12 rounded-full bg-accent text-[15px] font-extrabold text-ink disabled:opacity-50">Valider le code</button>
    </form>

    <div v-else class="flex flex-col gap-3" role="status">
      <p class="m-0 text-sm text-soft">{{ auth.message }}</p>
      <div class="h-1.5 overflow-hidden rounded-full bg-white/[0.14]"><div class="h-full w-1/3 animate-pulse rounded-full bg-accent" /></div>
    </div>

    <div class="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
      <button v-if="desktop.loginAsk?.game" type="button" class="border-0 bg-transparent p-0 font-semibold text-mute underline hover:text-white" @click="useClient">Plutôt utiliser le client Steam</button>
      <span v-else />
      <button type="button" class="h-10 rounded-full border border-white/20 bg-transparent px-5 font-semibold text-white hover:bg-white/10" @click="close">Annuler</button>
    </div>
  </Modal>
</template>
