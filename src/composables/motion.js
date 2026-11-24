import gsap from 'gsap'

export const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Révèle les éléments au scroll (stagger GSAP + IntersectionObserver).
export const vReveal = {
  mounted(el, { value = {} }) {
    if (prefersReduced()) return
    const { y = 36, delay = 0, stagger = 0.08, children = false } = value
    const targets = children ? Array.from(el.children) : el
    gsap.set(targets, { opacity: 0, y })
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        gsap.to(targets, { opacity: 1, y: 0, duration: 0.9, delay, stagger, ease: 'power3.out', clearProps: 'transform' })
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    el._revealIO = io
  },
  unmounted(el) {
    el._revealIO?.disconnect()
  },
}
