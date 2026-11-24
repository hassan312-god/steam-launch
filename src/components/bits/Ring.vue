<script setup>
// Anneau de progression (conic-gradient) animé par GSAP.
import { computed, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { prefersReduced } from '../../composables/motion'

const props = defineProps({
  value: { type: Number, required: true },
  size: { type: Number, default: 48 },
  thickness: { type: Number, default: 3 },
  track: { type: String, default: 'rgba(255,255,255,0.15)' },
  inner: { type: String, default: 'transparent' },
  delay: { type: Number, default: 0 },
})
const cur = ref(0)
let tween
function run() {
  tween?.kill()
  if (prefersReduced()) return (cur.value = props.value)
  const o = { v: cur.value }
  tween = gsap.to(o, { v: props.value, duration: 1.4, delay: props.delay, ease: 'power3.out', onUpdate: () => (cur.value = o.v) })
}
onMounted(run)
watch(() => props.value, run)
const bg = computed(() => `conic-gradient(var(--accent) 0 ${cur.value}%, ${props.track} ${cur.value}% 100%)`)
</script>

<template>
  <span class="inline-flex shrink-0 rounded-full box-border" :style="{ width: size + 'px', height: size + 'px', padding: thickness + 'px', background: bg }">
    <span class="flex h-full w-full items-center justify-center rounded-full" :style="{ background: inner }"><slot /></span>
  </span>
</template>
