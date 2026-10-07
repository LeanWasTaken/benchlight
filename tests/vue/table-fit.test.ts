import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { decideStacked, useTableFit } from '../../vue/internal/useTableFit'
import { withSetup } from '../helpers/vue'

describe('decideStacked', () => {
  it('stacks when need exceeds avail and only unstacks 8px below it (hysteresis)', () => {
    expect(decideStacked(false, 500, 499)).toBe(true)
    expect(decideStacked(false, 499, 499)).toBe(false)
    expect(decideStacked(true, 495, 500)).toBe(true) // within 8px: stay stacked
    expect(decideStacked(true, 492, 500)).toBe(false)
  })
})

describe('useTableFit', () => {
  let observed: ((entries: unknown[]) => void) | undefined
  afterEach(() => {
    vi.unstubAllGlobals()
    observed = undefined
  })

  function setup(need: number, avail: number, enabled = true, queue?: Array<() => void>) {
    const size = { avail }
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: (entries: unknown[]) => void) {
          observed = cb
        }
        observe() {}
        disconnect() {}
      }
    )
    if (queue) {
      vi.stubGlobal('requestAnimationFrame', (cb: () => void) => queue.push(cb))
      vi.stubGlobal('cancelAnimationFrame', (id: number) => {
        queue[id - 1] = () => {}
      })
    } else {
      vi.stubGlobal('requestAnimationFrame', (cb: () => void) => (cb(), 1))
    }
    const root = document.createElement('div')
    const table = document.createElement('table')
    const scroller = document.createElement('div')
    root.append(scroller)
    scroller.append(table)
    document.body.append(root)
    const measuring: boolean[] = []
    table.getBoundingClientRect = () => {
      measuring.push(root.hasAttribute('data-measuring'))
      return { width: need } as DOMRect
    }
    Object.defineProperty(root, 'clientWidth', { get: () => size.avail, configurable: true })
    const deps = ref(0)
    const { result, wrapper } = withSetup(() =>
      useTableFit(ref(root), ref(table), ref(scroller), {
        enabled: () => enabled,
        deps: () => deps.value
      })
    )
    return { result, wrapper, root, measuring, deps, table, size }
  }

  it('measures on mount inside data-measuring and marks the root fitted', () => {
    const { result, wrapper, root, measuring } = setup(600, 400)
    expect(result.fitted.value).toBe(true)
    expect(result.stacked.value).toBe(true)
    expect(measuring).toEqual([true])
    expect(root.hasAttribute('data-measuring')).toBe(false)
    wrapper.unmount()
  })

  it('measures unstacked and restores data-stacked in the same task', () => {
    const { result, wrapper, root, table } = setup(600, 400)
    const seen: boolean[] = []
    table.getBoundingClientRect = () => {
      seen.push(root.hasAttribute('data-stacked'))
      return { width: 600 } as DOMRect
    }
    root.setAttribute('data-stacked', '')
    result.measure()
    expect(seen).toEqual([false])
    expect(root.hasAttribute('data-stacked')).toBe(true)
    wrapper.unmount()
  })

  it('restores data-stacked and flushes it before dropping data-measuring', () => {
    const { result, wrapper, root } = setup(600, 400)
    root.setAttribute('data-stacked', '')
    // A layout read while measuring styles still kill transitions; it must see the stacked state.
    const flushed: string[] = []
    Object.defineProperty(root, 'offsetWidth', {
      get: () => {
        flushed.push(`${root.hasAttribute('data-stacked')}/${root.hasAttribute('data-measuring')}`)
        return 400
      },
      configurable: true
    })
    result.measure()
    expect(flushed).toEqual(['true/true'])
    expect(root.hasAttribute('data-measuring')).toBe(false)
    expect(root.hasAttribute('data-stacked')).toBe(true)
    wrapper.unmount()
  })

  it('re-measures only when the inline size changes', () => {
    const { result, wrapper, measuring } = setup(300, 400)
    expect(result.stacked.value).toBe(false)
    observed!([{ contentBoxSize: [{ inlineSize: 400 }] }])
    observed!([{ contentBoxSize: [{ inlineSize: 400 }] }])
    observed!([{ contentBoxSize: [{ inlineSize: 250 }] }])
    observed!([{ contentBoxSize: [{ inlineSize: 250 }] }])
    // mount + the 250 change; the initial 400 entry is seeded and filtered
    expect(measuring.length).toBe(2)
    wrapper.unmount()
  })

  it('re-measures when deps change and never stacks when disabled', async () => {
    const { wrapper, measuring, deps } = setup(300, 400)
    const before = measuring.length // document.fonts.ready may add one async measure
    deps.value++
    await nextTick()
    expect(measuring.length).toBeGreaterThan(before)
    wrapper.unmount()
    const off = setup(900, 100, false)
    expect(off.result.stacked.value).toBe(false)
    off.wrapper.unmount()
  })

  it('decides from the latest decision, not the unflushed state, between frames', () => {
    const queue: Array<() => void> = []
    const { result, wrapper, size } = setup(500, 499, true, queue)
    expect(result.stacked.value).toBe(false) // frame not flushed yet
    size.avail = 504 // inside the 8px band: must stay stacked
    result.measure()
    queue.forEach((cb) => cb())
    expect(result.stacked.value).toBe(true)
    wrapper.unmount()
  })

  it('does not measure after unmount', () => {
    const { result, wrapper, measuring } = setup(300, 400)
    wrapper.unmount()
    const before = measuring.length
    result.measure()
    expect(measuring.length).toBe(before)
  })
})
