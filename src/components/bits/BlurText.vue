<script setup>
// Inspiré de React Bits « BlurText » : les mots apparaissent en sortant du flou.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { prefersReduced } from '../../composables/motion'

const props = defineProps({
  text: { type: String, required: true },
  tag: { type: String, default: 'span' },
  delay: { type: Number, default: 0 },
  stagger: { type: Number, default: 0.09 },
})
const root = ref(null)
const words = computed(() => props.text.split(' '))

async function play() {
  await nextTick()
  const els = root.value?.querySelectorAll('[data-word]')
  if (!els?.length || prefersReduced()) return
  gsap.fromTo(
    els,
    { opacity: 0, filter: 'blur(12px)', y: -14 },
    { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.8, delay: props.delay, stagger: props.stagger, ease: 'power3.out' },
  )
}
onMounted(play)
watch(() => props.text, play)
</script>

<template>
  <component :is="tag" ref="root">
    <span v-for="(w, i) in words" :key="i" data-word class="inline-block will-change-[filter,transform]">{{ w }}<span v-if="i < words.length - 1">&nbsp;</span></span>
  </component>
</template>
