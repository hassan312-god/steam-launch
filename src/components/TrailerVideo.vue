<script setup>
// Lecture des bandes-annonces Steam (HLS). Safari lit le HLS nativement ; ailleurs on passe par hls.js (chargé à la demande).
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  poster: { type: String, default: '' },
  ambient: { type: Boolean, default: false }, // fond muet en boucle, sans contrôles
  autoplay: { type: Boolean, default: false },
  sound: { type: Boolean, default: false }, // fond avec le son activé
  startAt: { type: Number, default: 0 }, // saute l'intro (souvent noire) des bandes-annonces
})
const emit = defineEmits(['playing'])
const video = ref(null)
let hls

async function attach() {
  detach()
  const v = video.value
  if (!v) return
  if (v.canPlayType('application/vnd.apple.mpegurl')) {
    v.src = props.src
  } else {
    const { default: Hls } = await import('hls.js')
    if (!Hls.isSupported() || !video.value) return
    hls = new Hls({ capLevelToPlayerSize: true, startLevel: -1, maxBufferLength: 20 })
    hls.loadSource(props.src)
    hls.attachMedia(v)
  }
  if (props.startAt) v.addEventListener('loadedmetadata', () => { if (v.duration > props.startAt * 2) v.currentTime = props.startAt }, { once: true })
  if (props.autoplay || props.ambient) v.play().catch(() => {})
}
function detach() {
  hls?.destroy()
  hls = null
}
onMounted(attach)
watch(() => props.src, attach)
onBeforeUnmount(() => {
  detach()
  video.value?.removeAttribute('src')
})
</script>

<template>
  <video
    ref="video"
    :poster="poster || undefined"
    :muted="(ambient && !sound) || autoplay"
    :loop="ambient"
    :controls="!ambient"
    playsinline
    preload="metadata"
    :aria-hidden="ambient ? 'true' : undefined"
    :tabindex="ambient ? -1 : undefined"
    @playing="emit('playing')"
  />
</template>
