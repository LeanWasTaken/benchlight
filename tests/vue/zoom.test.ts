// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  clampPan,
  clampZoom,
  fitScale,
  step,
  zoomAt,
  type ZoomState
} from '../../vue/internal/zoom'

const BOX = { width: 800, height: 600 }

// Where a point of the content (relative to the frame centre at zoom 1) lands on screen.
const screen = (s: ZoomState, p: { x: number; y: number }) => ({
  x: s.x + s.zoom * p.x,
  y: s.y + s.zoom * p.y
})

describe('fitScale', () => {
  it('is the contain scale, never above 1', () => {
    expect(fitScale({ width: 1600, height: 600 }, BOX)).toBe(0.5)
    expect(fitScale({ width: 800, height: 1200 }, BOX)).toBe(0.5)
    expect(fitScale({ width: 400, height: 300 }, BOX)).toBe(1)
  })
  it('treats an empty size as unknown (1)', () => {
    expect(fitScale({ width: 0, height: 0 }, BOX)).toBe(1)
    expect(fitScale({ width: 1600, height: 1200 }, { width: 0, height: 0 })).toBe(1)
  })
})

describe('clampZoom', () => {
  it('keeps the zoom within the limits and survives bad input', () => {
    expect(clampZoom(0.5, 1, 8)).toBe(1)
    expect(clampZoom(9, 1, 8)).toBe(8)
    expect(clampZoom(2.5, 1, 8)).toBe(2.5)
    expect(clampZoom(Number.NaN, 1, 8)).toBe(1)
    expect(clampZoom(Infinity, 1, 8)).toBe(8)
  })
})

describe('zoomAt', () => {
  it('keeps the content point under the given point fixed', () => {
    const states: ZoomState[] = [
      { zoom: 1, x: 0, y: 0 },
      { zoom: 2, x: -120, y: 40 },
      { zoom: 3.5, x: 300, y: -200 }
    ]
    for (const s of states)
      for (const z of [1, 1.25, 4, 8])
        for (const point of [
          { x: 0, y: 0 },
          { x: 250, y: -130 },
          { x: -400, y: 300 }
        ]) {
          const content = { x: (point.x - s.x) / s.zoom, y: (point.y - s.y) / s.zoom }
          const next = zoomAt(s, z, point)
          expect(next.zoom).toBe(z)
          const at = screen(next, content)
          expect(at.x).toBeCloseTo(point.x, 9)
          expect(at.y).toBeCloseTo(point.y, 9)
        }
  })
  it('zooms around the centre without panning', () => {
    expect(zoomAt({ zoom: 1, x: 0, y: 0 }, 3, { x: 0, y: 0 })).toEqual({ zoom: 3, x: 0, y: 0 })
  })
})

describe('clampPan', () => {
  const content = { width: 400, height: 600 } // a portrait image at fit, full height
  it('centres an axis where the zoomed content is not larger than the box', () => {
    expect(clampPan({ zoom: 1, x: 50, y: -30 }, BOX, content)).toEqual({ zoom: 1, x: 0, y: 0 })
    // 1.5x: 600 wide in an 800 box stays centred; 900 tall may pan 150 each way
    expect(clampPan({ zoom: 1.5, x: 90, y: -400 }, BOX, content)).toEqual({
      zoom: 1.5,
      x: 0,
      y: -150
    })
  })
  it('lets the edges reach the box edges and no further', () => {
    // 4x: 1600 x 2400 in 800 x 600 -> 400 and 900 each way
    expect(clampPan({ zoom: 4, x: 1000, y: -1000 }, BOX, content)).toEqual({
      zoom: 4,
      x: 400,
      y: -900
    })
    expect(clampPan({ zoom: 4, x: -399, y: 899 }, BOX, content)).toEqual({
      zoom: 4,
      x: -399,
      y: 899
    })
  })
  it('allows almost nothing just above the size of the box', () => {
    const s = clampPan({ zoom: 1.001, x: 100, y: 100 }, BOX, content)
    expect(s.x).toBe(0)
    expect(s.y).toBeCloseTo(0.3, 9)
  })
  it('never returns -0', () => {
    expect(Object.is(clampPan({ zoom: 1, x: -5, y: -5 }, BOX, content).x, -0)).toBe(false)
  })
})

describe('step', () => {
  it('multiplies by 1.25 per step either way', () => {
    expect(step(1, 1)).toBe(1.25)
    expect(step(1.25, -1)).toBe(1)
    expect(step(2, -1)).toBe(1.6)
  })
})
