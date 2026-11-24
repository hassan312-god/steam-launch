<script setup>
// Inspiré de React Bits « SplitText » : révélation lettre par lettre avec GSAP.
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import gsap from 'gsap'
import { prefersReduced } from '../../composables/motion'

const props = defineProps({
  text: { type: String, required: true },
  tag: { type: String, default: 'span' },
  delay: { type: Number, default: 0 },
  stagger: { type: Number, default: 0.03 },
  duration: { type: Number, default: 0.9 },
  from: { type: Object, default: () => ({ y: '110%', rotate: 6 }) },
})

const root = ref(null)
const words = computed(() => props.text.split(' ').map((w) => Array.from(w)))
let tween

async function play() {
  await nextTick()
  const chars = root.value?.querySelectorAll('[data-char]')
  if (!chars?.length || prefersReduced()) return
  tween?.kill()
  tween = gsap.fromTo(
    chars,
    { ...props.from, opacity: 0 },
    { y: 0, rotate: 0, x: 0, opacity: 1, duration: props.duration, delay: props.delay, stagger: props.stagger, ease: 'power4.out' },
  )
}

onMounted(play)
watch(() => props.text, play)
</script>

<template>
  <component :is="tag" ref="root" :aria-label="text">
    <span v-for="(w, wi) in words" :key="wi + w.join('')" aria-hidden="true" class="inline-block whitespace-nowrap overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
      <span v-for="(c, ci) in w" :key="ci" data-char class="inline-block will-change-transform">{{ c }}</span><span v-if="wi < words.length - 1" class="inline-block">&nbsp;</span>
    </span>
  </component>
</template>
