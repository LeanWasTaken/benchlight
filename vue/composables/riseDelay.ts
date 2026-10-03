export interface RiseDelayOptions {
  base?: number
  step?: number
  cap?: number
}

// Inline style for the nth element of a staggered kd-rise entrance.
export function riseDelay(
  index: number,
  { base = 0, step = 60, cap }: RiseDelayOptions = {}
): { '--kd-rise-delay': string } {
  const n = Math.max(0, cap === undefined ? index : Math.min(index, cap))
  return { '--kd-rise-delay': `${base + n * step}ms` }
}
