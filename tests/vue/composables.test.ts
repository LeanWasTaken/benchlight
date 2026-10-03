import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { riseDelay } from '../../vue/composables/riseDelay'
import { useAppearance } from '../../vue/composables/useAppearance'
import { useMarquee } from '../../vue/composables/useMarquee'
import { useReducedMotion } from '../../vue/composables/useReducedMotion'
import { useScrollLifted } from '../../vue/composables/useScrollLifted'
import { DARK_QUERY, mockMatchMedia, REDUCED_QUERY, withSetup } from '../helpers/vue'

const root = document.documentElement
const attribute = () => root.getAttribute('data-kd-appearance')

beforeEach(() => {
  localStorage.clear()
  root.removeAttribute('data-kd-appearance')
  mockMatchMedia()
})
afterEach(() => vi.restoreAllMocks())

describe('useAppearance', () => {
  it('starts on auto and resolves from the OS', () => {
    mockMatchMedia({ [DARK_QUERY]: true })
    const { result } = withSetup(useAppearance)
    expect(result.mode.value).toBe('auto')
    expect(result.resolved.value).toBe('dark')
  })

  it('adopts the attribute stamped by prepaint', () => {
    root.setAttribute('data-kd-appearance', 'light')
    mockMatchMedia({ [DARK_QUERY]: true })
    const { result } = withSetup(useAppearance)
    expect(result.mode.value).toBe('light')
    expect(result.resolved.value).toBe('light')
  })

  it('falls back to storage and applies it when prepaint did not run', () => {
    localStorage.setItem('kd-appearance', 'dark')
    const { result } = withSetup(useAppearance)
    expect(result.mode.value).toBe('dark')
    expect(attribute()).toBe('dark')
  })

  it('treats junk in storage as auto', () => {
    localStorage.setItem('kd-appearance', 'blue')
    const { result } = withSetup(useAppearance)
    expect(result.mode.value).toBe('auto')
    expect(attribute()).toBeNull()
  })

  it('writes attribute and storage on change, and removes the attribute for auto', async () => {
    const { result } = withSetup(useAppearance)
    result.mode.value = 'dark'
    await nextTick()
    expect(attribute()).toBe('dark')
    expect(localStorage.getItem('kd-appearance')).toBe('dark')
    expect(result.resolved.value).toBe('dark')
    result.mode.value = 'auto'
    await nextTick()
    expect(attribute()).toBeNull()
    expect(localStorage.getItem('kd-appearance')).toBe('auto')
  })

  it('tracks OS changes while on auto', () => {
    const media = mockMatchMedia({ [DARK_QUERY]: false })
    const { result } = withSetup(useAppearance)
    media.set(DARK_QUERY, true)
    expect(result.resolved.value).toBe('dark')
  })

  it('keeps working when storage throws', async () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = withSetup(useAppearance)
    expect(result.mode.value).toBe('auto')
    result.mode.value = 'light'
    await nextTick()
    expect(attribute()).toBe('light')
    expect(result.resolved.value).toBe('light')
    expect(error).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  it('stops tracking the OS after unmount', () => {
    const media = mockMatchMedia({ [DARK_QUERY]: false })
    const { result, wrapper } = withSetup(useAppearance)
    wrapper.unmount()
    media.set(DARK_QUERY, true)
    expect(result.resolved.value).toBe('light')
  })

  it('touches neither storage nor the document during SSR', async () => {
    const getItem = vi.spyOn(localStorage, 'getItem')
    const setAttribute = vi.spyOn(root, 'setAttribute')
    const app = createSSRApp(
      defineComponent({
        setup() {
          const { mode } = useAppearance()
          return () => h('span', mode.value)
        }
      })
    )
    expect(await renderToString(app)).toBe('<span>auto</span>')
    expect(getItem).not.toHaveBeenCalled()
    expect(setAttribute).not.toHaveBeenCalled()
  })
})

describe('useScrollLifted', () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).scrollY
  })

  const scrollTo = (y: number) => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
    window.dispatchEvent(new Event('scroll'))
  }

  it('lifts past the threshold', () => {
    scrollTo(0)
    const { result, wrapper } = withSetup(() => useScrollLifted(24))
    expect(result.value).toBe(false)
    scrollTo(30)
    expect(result.value).toBe(true)
    wrapper.unmount()
    scrollTo(0)
    expect(result.value).toBe(true)
  })
})

describe('useReducedMotion', () => {
  it('follows the media query live', () => {
    const media = mockMatchMedia({ [REDUCED_QUERY]: false })
    const { result } = withSetup(useReducedMotion)
    expect(result.value).toBe(false)
    media.set(REDUCED_QUERY, true)
    expect(result.value).toBe(true)
  })

  it('stops following the media query after unmount', () => {
    const media = mockMatchMedia({ [REDUCED_QUERY]: false })
    const { result, wrapper } = withSetup(useReducedMotion)
    wrapper.unmount()
    media.set(REDUCED_QUERY, true)
    expect(result.value).toBe(false)
  })
})

describe('useMarquee', () => {
  function elements(contentWidth: number, boxWidth: number) {
    const box = document.createElement('div')
    const text = document.createElement('div')
    Object.defineProperty(box, 'clientWidth', { value: boxWidth })
    Object.defineProperty(text, 'scrollWidth', { value: contentWidth })
    const cancel = vi.fn()
    const animate = vi.fn(() => ({ cancel }) as unknown as Animation)
    box.animate = animate
    text.animate = animate
    return { box, text, animate, cancel }
  }

  it('reports no overflow when the text fits', () => {
    const { box, text, animate } = elements(80, 100)
    const { result } = withSetup(() => useMarquee(ref(box), ref(text)))
    expect(result.overflowing.value).toBe(false)
    expect(animate).not.toHaveBeenCalled()
  })

  it('animates text and mask when the text overflows', () => {
    const { box, text, animate } = elements(300, 100)
    const { result } = withSetup(() => useMarquee(ref(box), ref(text)))
    expect(result.overflowing.value).toBe(true)
    expect(animate).toHaveBeenCalledTimes(2)
  })

  it('marks overflow but never animates under reduced motion', () => {
    mockMatchMedia({ [REDUCED_QUERY]: true })
    const { box, text, animate } = elements(300, 100)
    const { result } = withSetup(() => useMarquee(ref(box), ref(text)))
    expect(result.overflowing.value).toBe(true)
    expect(animate).not.toHaveBeenCalled()
  })
})

describe('useMarquee cleanup', () => {
  function setup() {
    const box = document.createElement('div')
    const text = document.createElement('div')
    Object.defineProperty(box, 'clientWidth', { value: 100 })
    Object.defineProperty(text, 'scrollWidth', { value: 300 })
    const cancel = vi.fn()
    const animate = vi.fn(() => ({ cancel }) as unknown as Animation)
    box.animate = animate
    text.animate = animate
    return { box, text, animate, cancel }
  }

  afterEach(() => vi.useRealTimers())

  it('cancels both animations and ignores resizes after unmount', () => {
    vi.useFakeTimers()
    const { box, text, animate, cancel } = setup()
    const { wrapper } = withSetup(() => useMarquee(ref(box), ref(text)))
    expect(animate).toHaveBeenCalledTimes(2)
    wrapper.unmount()
    expect(cancel).toHaveBeenCalledTimes(2)
    window.dispatchEvent(new Event('resize'))
    vi.advanceTimersByTime(200)
    expect(animate).toHaveBeenCalledTimes(2)
  })

  it('cancels running animations when reduced motion turns on', async () => {
    const media = mockMatchMedia({ [REDUCED_QUERY]: false })
    const { box, text, animate, cancel } = setup()
    withSetup(() => useMarquee(ref(box), ref(text)))
    expect(animate).toHaveBeenCalledTimes(2)
    media.set(REDUCED_QUERY, true)
    await nextTick()
    expect(cancel).toHaveBeenCalledTimes(2)
    expect(animate).toHaveBeenCalledTimes(2)
  })
})

describe('riseDelay', () => {
  it('steps by 60ms from zero by default', () => {
    expect(riseDelay(0)).toEqual({ '--kd-rise-delay': '0ms' })
    expect(riseDelay(2)).toEqual({ '--kd-rise-delay': '120ms' })
  })

  it('supports a base, a custom step and a cap', () => {
    expect(riseDelay(3, { base: 240, step: 70 })).toEqual({ '--kd-rise-delay': '450ms' })
    expect(riseDelay(10, { base: 240, step: 70, cap: 6 })).toEqual({ '--kd-rise-delay': '660ms' })
  })

  it('never goes below the base', () => {
    expect(riseDelay(-3, { base: 100 })).toEqual({ '--kd-rise-delay': '100ms' })
  })
})
