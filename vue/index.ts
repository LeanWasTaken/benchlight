export { default as KdLed } from './components/KdLed.vue'

export {
  APPEARANCE_ATTRIBUTE,
  APPEARANCE_STORAGE_KEY,
  useAppearance
} from './composables/useAppearance'
export type { AppearanceMode, ResolvedAppearance } from './composables/useAppearance'
export { useScrollLifted } from './composables/useScrollLifted'
export { useReducedMotion } from './composables/useReducedMotion'
export { useMarquee } from './composables/useMarquee'
export type { MarqueeOptions } from './composables/useMarquee'
export { riseDelay } from './composables/riseDelay'
export type { RiseDelayOptions } from './composables/riseDelay'
export type * from './types'
