<script setup>
// Inspiré de React Bits « TiltedCard » : inclinaison 3D + reflet suivant le curseur.
import { ref } from 'vue'
import gsap from 'gsap'
import { prefersReduced } from '../../composables/motion'

const props = defineProps({ max: { type: Number, default: 12 }, scale: { type: Number, default: 1.04 } })
const el = ref(null)
const glare = ref(null)

function move(e) {
  if (prefersReduced()) return
  const r = el.value.getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width
  const py = (e.clientY - r.top) / r.height
  gsap.to(el.value, { rotateY: (px - 0.5) * props.max * 2, rotateX: (0.5 - py) * props.max * 2, scale: props.scale, duration: 0.35, ease: 'power2.out', transformPerspective: 900 })
  gsap.to(glare.value, { opacity: 0.35, background: `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.55), transparent 55%)`, duration: 0.2 })
}
function leave() {
  gsap.to(el.value, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)' })
  gsap.to(glare.value, { opacity: 0, duration: 0.4 })
}
</script>

<template>
  <div ref="el" class="relative will-change-transform" style="transform-style: preserve-3d" @pointermove="move" @pointerleave="leave">
    <slot />
    <span ref="glare" aria-hidden="true" class="pointer-events-none absolute inset-0 opacity-0 rounded-[inherit] mix-blend-overlay" />
  </div>
</template>
