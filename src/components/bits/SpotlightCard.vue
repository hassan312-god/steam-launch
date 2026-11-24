<script setup>
// Inspiré de React Bits « SpotlightCard » : halo qui suit le curseur.
import { ref } from 'vue'

defineProps({ tag: { type: String, default: 'div' }, color: { type: String, default: 'var(--accent)' } })
const el = ref(null)
const pos = ref({ x: 0, y: 0 })
const on = ref(false)

function move(e) {
  const r = el.value.getBoundingClientRect()
  pos.value = { x: e.clientX - r.left, y: e.clientY - r.top }
}
</script>

<template>
  <component :is="tag" ref="el" class="relative overflow-hidden" @pointermove="move" @pointerenter="on = true" @pointerleave="on = false">
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-500"
      :style="{
        opacity: on ? 0.22 : 0,
        background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 70%)`,
        mixBlendMode: 'soft-light',
      }"
    />
    <slot />
  </component>
</template>
