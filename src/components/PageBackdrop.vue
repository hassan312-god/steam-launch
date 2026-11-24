<script setup>
// Fond flou en haut de page (pages secondaires).
defineProps({ src: { type: String, required: true }, height: { type: Number, default: 560 } })
</script>

<template>
  <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0" :style="{ height: height + 'px' }">
    <img :src="src" alt="" class="size-full object-cover opacity-30" />
    <div class="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/75 to-ink" />
  </div>
</template>
