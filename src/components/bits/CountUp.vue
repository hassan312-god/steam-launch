<script setup>
// Inspiré de React Bits « CountUp » : compteur animé par GSAP.
import { onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { prefersReduced } from '../../composables/motion'

const props = defineProps({
  to: { type: Number, required: true },
  from: { type: Number, default: 0 },
  duration: { type: Number, default: 1.6 },
  delay: { type: Number, default: 0 },
  decimals: { type: Number, default: 0 },
})

const shown = ref(props.from)
const fmt = (n) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: props.decimals, maximumFractionDigits: props.decimals }).format(n)
let tween

function run() {
  tween?.kill()
  if (prefersReduced()) {
    shown.value = props.to
    return
  }
  const o = { v: shown.value }
  tween = gsap.to(o, { v: props.to, duration: props.duration, delay: props.delay, ease: 'power2.out', onUpdate: () => (shown.value = o.v) })
}
onMounted(run)
watch(() => props.to, run)
</script>

<template>
  <span class="tabular-nums">{{ fmt(shown) }}</span>
</template>
