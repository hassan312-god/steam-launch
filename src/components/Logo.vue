<script setup>
// Logo G.A Launcher : manette + « G.A » dans un cadre vert. `full` ajoute la mention LAUNCHER.
defineProps({ size: { type: [Number, String], default: 34 }, full: Boolean })
</script>

<template>
  <svg :viewBox="full ? '0 0 400 190' : '20 12 360 160'" role="img" aria-label="G.A Launcher" class="block w-auto" :style="{ height: `calc(${typeof size === 'number' ? size + 'px' : size} * ${full ? 1.35 : 1.2})` }">
    <path d="M258 150H62a26 26 0 0 1-26-26V54a26 26 0 0 1 26-26H338a26 26 0 0 1 26 26V124a26 26 0 0 1-10 20" fill="none" stroke="var(--accent)" stroke-width="9" stroke-linecap="round" v-if="full" />
    <rect v-else x="36" y="28" width="328" height="122" rx="26" fill="none" stroke="var(--accent)" stroke-width="9" />
    <g transform="translate(38,60) scale(1.1)">
      <path fill="var(--accent)" d="M22 10C11 10 4 28 2.5 47 1.7 58 6.5 64 14 64c7 0 11-6.5 17-11h38c6 4.5 10 11 17 11 7.5 0 12.3-6 11.5-17C96 28 89 10 78 10Z" />
      <g fill="#06060A"><rect x="19" y="26" width="6.5" height="19" rx="2" /><rect x="12.8" y="32.2" width="19" height="6.5" rx="2" /><circle cx="71" cy="25" r="3.8" /><circle cx="80" cy="32" r="3.8" /><circle cx="71" cy="39" r="3.8" /><circle cx="62" cy="32" r="3.8" /></g>
    </g>
    <text x="168" y="126" font-family="Anton, Impact, 'Arial Narrow', sans-serif" font-weight="900" font-size="100" fill="var(--accent)" textLength="184" lengthAdjust="spacingAndGlyphs">G.A</text>
    <text v-if="full" x="352" y="156" text-anchor="end" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="13" letter-spacing="2.2" fill="var(--accent)">LAUNCHER</text>
  </svg>
</template>
