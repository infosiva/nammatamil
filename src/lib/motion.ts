// lib/motion.ts — global animation constants consumed by every animated component
// Import from here, never define animation values inline in components.
'use client'
import { useReducedMotion } from 'framer-motion'

export const SPRING_CINEMATIC = { type: 'spring' as const, stiffness: 80, damping: 20 }
export const SPRING_SNAPPY    = { type: 'spring' as const, stiffness: 400, damping: 17 }
export const SPRING_BUTTON    = { type: 'spring' as const, stiffness: 400, damping: 17 }

export const FADE_UP = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show:   { opacity: 1, y: 0,  filter: 'blur(0px)' },
}

export const FADE_IN = {
  hidden: { opacity: 0 },
  show:   { opacity: 1 },
}

export const STAGGER_CONTAINER = (stagger = 0.06) => ({
  hidden: {},
  show:   { transition: { staggerChildren: stagger } },
})

export const CARD_HOVER = {
  whileHover: { y: -4 } as const,
  whileTap:   { scale: 0.98 } as const,
}

export const BUTTON_PRESS = {
  whileHover: { scale: 1.03 } as const,
  whileTap:   { scale: 0.97 } as const,
}

/** Returns full variants when motion is OK, opacity-only when reduced. */
export function useMotionVariants(full: object, reduced: object = FADE_IN) {
  const reduce = useReducedMotion()
  return reduce ? reduced : full
}
