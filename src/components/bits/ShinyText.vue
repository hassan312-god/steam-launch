<script setup>
// Inspiré de React Bits « ShinyText » : reflet qui balaie le texte.
defineProps({ speed: { type: Number, default: 3.5 } })
</script>

<template>
  <span class="shiny" :style="{ animationDuration: speed + 's' }"><slot /></span>
</template>

<style scoped>
.shiny {
  background: linear-gradient(110deg, currentColor 35%, #fff 50%, currentColor 65%);
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine linear infinite;
}
@keyframes shine {
  from { background-position: 150% 0; }
  to { background-position: -50% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .shiny { animation: none; -webkit-text-fill-color: currentColor; }
}
</style>
