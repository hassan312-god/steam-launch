<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { prefersReduced } from '../composables/motion'

const props = defineProps({ open: Boolean, title: { type: String, required: true } })
const emit = defineEmits(['close'])
const box = ref(null)
const onKey = (e) => e.key === 'Escape' && props.open && emit('close')
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
watch(() => props.open, async (o) => {
  if (!o) return
  await nextTick()
  box.value?.querySelector('input, button')?.focus()
  if (!prefersReduced()) gsap.fromTo(box.value, { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' })
})
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-md" role="dialog" aria-modal="true" :aria-label="title" @mousedown.self="emit('close')">
    <div ref="box" class="w-full max-w-[480px] rounded-3xl border border-white/10 bg-panel p-7 shadow-[0_40px_100px_rgba(0,0,0,0.7)]">
      <h2 class="m-0 mb-5 font-display text-[22px] font-black">{{ title }}</h2>
      <slot />
    </div>
  </div>
</template>
