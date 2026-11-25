import { reactive } from 'vue'

export const toasts = reactive([])
let n = 0

export function toast(text, tone = 'ok') {
  const t = { id: ++n, text, tone }
  toasts.push(t)
  setTimeout(() => {
    const i = toasts.findIndex((x) => x.id === t.id)
    if (i >= 0) toasts.splice(i, 1)
  }, 3600)
}
