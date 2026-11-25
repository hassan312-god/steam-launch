<script setup>
// Logo G.A Launcher (repris du design Claude) : manette inclinée + « G.A » dans un cadre ; `full` ajoute la mention LAUNCHER.
defineProps({ size: { type: [Number, String], default: 34 }, full: Boolean, fit: Boolean })
</script>

<template>
  <svg viewBox="0 0 640 260" role="img" aria-label="G.A Launcher" class="block" :class="fit ? 'h-auto w-full' : 'w-auto'" :style="fit ? { aspectRatio: '640 / 260' } : { height: `calc(${typeof size === 'number' ? size + 'px' : size} * 1.5)` }">
    <rect x="18" y="22" width="604" height="214" rx="28" fill="none" stroke="var(--accent)" stroke-width="12" />
    <g transform="rotate(-14 130 130)"><path d="M80 70 H180 C208 70 222 94 226 122 L230 156 C233 180 208 192 190 172 L170 150 H90 L70 172 C52 192 27 180 30 156 L34 122 C38 94 52 70 80 70 Z" fill="#06060A" stroke="#06060A" stroke-width="26" stroke-linejoin="round"/><path d="M80 70 H180 C208 70 222 94 226 122 L230 156 C233 180 208 192 190 172 L170 150 H90 L70 172 C52 192 27 180 30 156 L34 122 C38 94 52 70 80 70 Z" fill="var(--accent)"/><rect x="62" y="104" width="38" height="12" rx="3" fill="#06060A"/><rect x="75" y="91" width="12" height="38" rx="3" fill="#06060A"/><circle cx="178" cy="96" r="7.5" fill="#06060A"/><circle cx="194" cy="112" r="7.5" fill="#06060A"/><circle cx="178" cy="128" r="7.5" fill="#06060A"/><circle cx="162" cy="112" r="7.5" fill="#06060A"/></g>
    <text x="258" y="198" textLength="330" lengthAdjust="spacingAndGlyphs" font-size="210" fill="var(--accent)" stroke="#06060A" stroke-width="22" stroke-linejoin="round" paint-order="stroke" style="font-family: 'Bricolage Grotesque', Anton, Impact, sans-serif; font-weight: 800; font-stretch: 75%; font-variation-settings: 'opsz' 96, 'wdth' 75">G.A</text>
    <text v-if="full" x="606" y="244" text-anchor="end" font-size="22" letter-spacing="4" fill="var(--accent)" stroke="#06060A" stroke-width="16" paint-order="stroke" style="font-family: Inter, Arial, sans-serif; font-weight: 800">LAUNCHER</text>
  </svg>
</template>
