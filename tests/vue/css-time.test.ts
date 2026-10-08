import { describe, expect, it } from 'vitest'
import { cssTime } from '../../vue/internal/cssTime'

describe('cssTime', () => {
  it('reads milliseconds and seconds, including the minifier forms', () => {
    expect(cssTime('150ms', 1)).toBe(150)
    expect(cssTime('0.15s', 1)).toBeCloseTo(150)
    expect(cssTime('.15s', 1)).toBeCloseTo(150)
    expect(cssTime(' 2s ', 1)).toBe(2000)
  })
  it('falls back when the value is empty, unitless or unreadable', () => {
    expect(cssTime('', 150)).toBe(150)
    expect(cssTime(undefined, 150)).toBe(150)
    expect(cssTime('150', 150)).toBe(150)
    expect(cssTime('auto', 150)).toBe(150)
  })
})
