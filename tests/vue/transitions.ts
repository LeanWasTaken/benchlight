import { vi } from 'vitest'

type Transition = { property: string; duration: string; delay?: string }

// happy-dom computes no transitions: getComputedStyle reports these for the given elements.
// Call it once per test with every element; vi.restoreAllMocks() undoes it.
export function mockTransition(...entries: [Element, Transition][]) {
  const map = new Map(entries)
  const real = window.getComputedStyle.bind(window)
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
    const style = real(el, pseudo)
    const t = pseudo ? undefined : map.get(el)
    if (!t) return style
    const values: Record<string, string> = {
      transitionProperty: t.property,
      transitionDuration: t.duration,
      transitionDelay: t.delay ?? '0s'
    }
    return new Proxy(style, {
      get: (s, p) => (typeof p === 'string' && p in values ? values[p] : Reflect.get(s, p))
    })
  })
}

export function transitionEnd(node: Element, propertyName: string, pseudoElement = '') {
  node.dispatchEvent(
    Object.assign(new Event('transitionend', { bubbles: true }), { propertyName, pseudoElement })
  )
}
