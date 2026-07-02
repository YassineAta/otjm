export const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

// Respects prefers-reduced-motion: motion is removed, opacity still fades
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
}

export const fadeUpReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

export const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
export const staggerReduced = { visible: { transition: { staggerChildren: 0.04 } } }
