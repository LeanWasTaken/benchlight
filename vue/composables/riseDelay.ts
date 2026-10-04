export interface RiseDelayOptions {
  base?: number
  step?: number
  cap?: number
}

// Inline style for the nth element of a staggered bl-rise entrance.
export function riseDelay(
  index: number,
  { base = 0, step = 60, cap }: RiseDelayOptions = {}
): { '--bl-rise-delay': string } {
  const n = Math.max(0, cap === undefined ? index : Math.min(index, cap))
  return { '--bl-rise-delay': `${base + n * step}ms` }
}
