import { reactive } from 'vue'

// Fiche complète d'un jeu (éditions, DLC, langues, annonces, évaluations…), chargée à la demande depuis /api/steam/app?full=1.
// extras[id] : objet = chargé ; false = indisponible ; undefined = pas encore demandé.
export const extras = reactive({})
const pending = new Set()

export async function loadExtra(id) {
  if (extras[id] !== undefined || pending.has(id)) return
  pending.add(id)
  try {
    const r = await fetch(`/api/steam/app?id=${encodeURIComponent(id)}&full=1`)
    extras[id] = r.ok ? await r.json() : false
  } catch {
    extras[id] = false
  } finally {
    pending.delete(id)
  }
}
