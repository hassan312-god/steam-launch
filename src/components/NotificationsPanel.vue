<script setup>
import { nextTick, watch, ref } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import { notifications } from '../data/games'
import { prefersReduced } from '../composables/motion'

const props = defineProps({ open: Boolean, unread: Boolean })
const emit = defineEmits(['close', 'read'])
const panel = ref(null)

watch(() => props.open, async (o) => {
  if (!o || prefersReduced()) return
  await nextTick()
  gsap.fromTo(panel.value, { opacity: 0, y: -12, scale: 0.96, transformOrigin: 'top right' }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' })
  gsap.from('[data-notif]', { opacity: 0, x: 20, stagger: 0.06, duration: 0.4, ease: 'power3.out', delay: 0.08 })
})
</script>

<template>
  <div v-if="open" ref="panel" class="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(380px,calc(100vw-40px))] overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-[0_30px_80px_rgba(0,0,0,0.7)]" role="dialog" aria-label="Notifications">
    <div class="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
      <h2 class="m-0 font-display text-base font-extrabold">Promotions du moment</h2>
      <button v-if="unread" type="button" class="border-0 bg-transparent p-0 text-xs font-bold text-accent" @click="emit('read')">Tout marquer comme lu</button>
    </div>
    <ul class="m-0 flex list-none flex-col p-2">
      <li v-for="n in notifications" :key="n.id" data-notif>
        <RouterLink :to="n.to" class="flex items-start gap-3 rounded-2xl p-3 text-white no-underline transition-colors hover:bg-white/5" @click="emit('close')">
          <img :src="n.cover" alt="" class="h-14 w-10 shrink-0 rounded-lg object-cover" />
          <span class="flex min-w-0 flex-col gap-0.5"><span class="text-sm leading-snug">{{ n.text }}</span><span class="text-xs text-mute">{{ n.when }}</span></span>
          <span v-if="unread" class="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Non lu" />
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
