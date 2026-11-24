<script setup>
defineProps({ size: { type: [Number, String], default: 34 } })
</script>

<template>
  <span class="font-logo font-extrabold leading-none tracking-[-0.01em] text-white" :style="{ fontSize: typeof size === 'number' ? size + 'px' : size, fontStretch: '75%', fontVariationSettings: `'wdth' 75` }" aria-label="G.A">G<span class="text-accent">.</span>A</span>
</template>
