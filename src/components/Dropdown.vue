<script setup>
// Menu déroulant aux couleurs du launcher (remplace le <select> natif). Clavier : ↑ ↓ Entrée Échap.
import { nextTick, onBeforeUnmount, ref } from 'vue'
const props = defineProps({ modelValue: String, options: { type: Array, required: true }, label: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const root = ref(null)
const list = ref(null)
const active = ref(0)
const uid = 'dd' + Math.random().toString(36).slice(2, 7)

function onDoc(e) { if (!root.value?.contains(e.target)) close() }
async function show() {
  open.value = true
  active.value = Math.max(0, props.options.indexOf(props.modelValue))
  document.addEventListener('pointerdown', onDoc)
  await nextTick()
  list.value?.focus()
}
function close(refocus = false) {
  open.value = false
  document.removeEventListener('pointerdown', onDoc)
  if (refocus) root.value?.querySelector('button')?.focus()
}
function pick(o) { emit('update:modelValue', o); close(true) }
function onKey(e) {
  const n = props.options.length
  if (e.key === 'ArrowDown') (e.preventDefault(), (active.value = (active.value + 1) % n))
  else if (e.key === 'ArrowUp') (e.preventDefault(), (active.value = (active.value - 1 + n) % n))
  else if (e.key === 'Home') (e.preventDefault(), (active.value = 0))
  else if (e.key === 'End') (e.preventDefault(), (active.value = n - 1))
  else if (e.key === 'Enter' || e.key === ' ') (e.preventDefault(), pick(props.options[active.value]))
  else if (e.key === 'Escape') (e.preventDefault(), close(true))
  else if (e.key === 'Tab') close()
}
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDoc))
</script>

<template>
  <div ref="root" class="relative">
    <button type="button" :aria-label="label || undefined" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="uid" class="flex h-[42px] min-w-[170px] items-center justify-between gap-3 rounded-full border bg-panel px-5 text-sm font-semibold text-white transition-colors" :class="open ? 'border-accent' : 'border-white/[0.14] hover:border-white/40'" @click="open ? close() : show()">
      {{ modelValue }}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" class="transition-transform duration-300" :class="open ? 'rotate-180 text-accent' : 'text-mute'"><path d="M6 9l6 6 6-6" /></svg>
    </button>
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="-translate-y-1 opacity-0" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <ul v-if="open" :id="uid" ref="list" role="listbox" tabindex="-1" :aria-activedescendant="uid + active" class="glass absolute right-0 z-30 mt-2 flex w-full min-w-[200px] list-none flex-col gap-0.5 rounded-2xl border border-white/10 p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.6)] outline-none" @keydown="onKey">
        <li v-for="(o, i) in options" :id="uid + i" :key="o" role="option" :aria-selected="o === modelValue" class="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors" :class="[i === active ? 'bg-white/10' : '', o === modelValue ? 'text-accent' : 'text-white']" @mouseenter="active = i" @click="pick(o)">
          {{ o }}
          <svg v-if="o === modelValue" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
        </li>
      </ul>
    </Transition>
  </div>
</template>
