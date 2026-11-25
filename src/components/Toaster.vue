<script setup>
import gsap from 'gsap'
import { toasts } from '../composables/useToast'
import { prefersReduced } from '../composables/motion'

function enter(el, done) {
  if (prefersReduced()) return done()
  gsap.fromTo(el, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)', onComplete: done })
}
function leave(el, done) {
  gsap.to(el, { opacity: 0, y: 10, duration: 0.25, onComplete: done })
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite" role="status">
    <TransitionGroup :css="false" @enter="enter" @leave="leave">
      <div v-for="t in toasts" :key="t.id" class="glass flex items-center gap-3 rounded-full py-3 pl-4 pr-6 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <span class="flex size-6 items-center justify-center rounded-full bg-accent text-ink"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" aria-hidden="true"><polyline points="20,6 9,17 4,12" /></svg></span>
        {{ t.text }}
      </div>
    </TransitionGroup>
  </div>
</template>
