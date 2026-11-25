import { reactive, watch } from 'vue'
import gsap from 'gsap'
import { prefersReduced } from './motion'

const KEY = 'ga-theme'
const defaults = {
  accent: '#B6FF3D',
  wall: '1245620',
  density: 'Confort',
  startup: true,
  console: true,
  music: false,
  activity: true,
  lang: 'Français',
  bandwidth: 50,
  username: 'hassan312',
}

function load() {
  try {
    const t = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
    if (!/^\d+$/.test(t.wall)) t.wall = defaults.wall // ancien fond fictif
    return t
  } catch {
    return { ...defaults }
  }
}

export const theme = reactive(load())

const root = document.documentElement
root.style.setProperty('--accent', theme.accent)
const color = { c: theme.accent }

// Change l'accent avec une transition de couleur GSAP, sur tout le launcher.
export function setAccent(hex) {
  theme.accent = hex
  if (prefersReduced()) {
    root.style.setProperty('--accent', hex)
    return
  }
  gsap.to(color, { c: hex, duration: 0.6, ease: 'power2.out', overwrite: true, onUpdate: () => root.style.setProperty('--accent', color.c) })
}

watch(theme, () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(theme))
  } catch {
    /* stockage indisponible : on ignore */
  }
})
