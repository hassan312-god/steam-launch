<script setup>
// Inspiré de React Bits « Magnet » : l'élément est attiré par le curseur.
import { ref } from 'vue'
import gsap from 'gsap'
import { prefersReduced } from '../../composables/motion'

const props = defineProps({ strength: { type: Number, default: 0.35 }, padding: { type: Number, default: 60 } })
const wrap = ref(null)
const inner = ref(null)

function move(e) {
  if (prefersReduced()) return
  const r = wrap.value.getBoundingClientRect()
  const x = e.clientX - (r.left + r.width / 2)
  const y = e.clientY - (r.top + r.height / 2)
  gsap.to(inner.value, { x: x * props.strength, y: y * props.strength, duration: 0.4, ease: 'power3.out' })
}
function leave() {
  gsap.to(inner.value, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' })
}
</script>

<template>
  <div ref="wrap" class="inline-flex" :style="{ padding: padding + 'px', margin: -padding + 'px' }" @pointermove="move" @pointerleave="leave">
    <div ref="inner" class="inline-flex"><slot /></div>
  </div>
</template>
