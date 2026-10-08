import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref, watch } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { riseDelay } from '../../vue/composables/riseDelay'
import { resetAppearanceState, useAppearance } from '../../vue/composables/useAppearance'
import { useFollowScroll } from '../../vue/composables/useFollowScroll'
import { useMarquee } from '../../vue/composables/useMarquee'
import { useReducedMotion } from '../../vue/composables/useReducedMotion'
import { useScrollLifted } from '../../vue/composables/useScrollLifted'
import { DARK_QUERY, mockMatchMedia, REDUCED_QUERY, withSetup } from '../helpers/vue'

const root = document.documentElement
const attribute = () => root.getAttribute('data-bl-appearance')

beforeEach(() => {
  resetAppearanceState()
  localStorage.clear()
  root.removeAttribute('data-bl-appearance')
  mockMatchMedia()
})
afterEach(() => vi.restoreAllMocks())

describe('useAppearance', () => {
  describe('view transition', () => {
    const stub = () => {
      const start = vi.fn((update: () => void) => {
        update()
        return { ready: Promise.resolve() }
      })
      ;(document as unknown as { startViewTransition: unknown }).startViewTransition = start
      return start
    }
    afterEach(() => {
      delete (document as unknown as { startViewTransition?: unknown }).startViewTransition
    })

    it('applies a change inside one view transition when motion is allowed', async () => {
      const start = stub()
      const { result } = withSetup(useAppearance)
      result.mode.value = 'dark'
      await nextTick()
      expect(start).toHaveBeenCalledTimes(1)
      expect(attribute()).toBe('dark')
    })

    it('resolves only once the theme is in the DOM, so watchers read the new tokens', async () => {
      const style = document.createElement('style')
      style.textContent =
        ':root { --probe: light } :root[data-bl-appearance="dark"] { --probe: dark }'
      document.head.append(style)
      let run: () => Promise<void> = async () => {}
      ;(document as unknown as { startViewTransition: unknown }).startViewTransition = (
        update: () => Promise<void>
      ) => {
        run = update // the browser runs it later, after capturing the old page
        return { ready: Promise.resolve() }
      }
      const { result } = withSetup(useAppearance)
      const seen: { attribute: string | null; token: string }[] = []
      watch(result.resolved, () =>
        seen.push({
          attribute: attribute(),
          token: getComputedStyle(root).getPropertyValue('--probe').trim()
        })
      )
      result.mode.value = 'dark'
      await nextTick()
      expect(result.resolved.value).toBe('light')
      expect(seen).toEqual([])
      await run()
      await nextTick()
      expect(seen).toEqual([{ attribute: 'dark', token: 'dark' }])
      style.remove()
    })

    it('applies at once under reduced motion', async () => {
      mockMatchMedia({ [REDUCED_QUERY]: true })
      const start = stub()
      const { result } = withSetup(useAppearance)
      result.mode.value = 'dark'
      await nextTick()
      expect(start).not.toHaveBeenCalled()
      expect(attribute()).toBe('dark')
    })

    it('applies at once without the API', async () => {
      const { result } = withSetup(useAppearance)
      result.mode.value = 'light'
      await nextTick()
      expect(attribute()).toBe('light')
    })
  })

  it('starts on auto and resolves from the OS', () => {
    mockMatchMedia({ [DARK_QUERY]: true })
    const { result } = withSetup(useAppearance)
    expect(result.mode.value).toBe('auto')
    expect(result.resolved.value).toBe('dark')
  })

  it('adopts the attribute stamped by prepaint', () => {
    root.setAttribute('data-bl-appearance', 'light')
    mockMatchMedia({ [DARK_QUERY]: true })
    const { result } = withSetup(useAppearance)
    expect(result.mode.value).toBe('light')
    expect(result.resolved.value).toBe('light')
  })

  it('falls back to storage and applies it when prepaint did not run', () => {
    localStorage.setItem('bl-appearance', 'dark')
    const { result } = withSetup(useAppearance)
    expect(result.mode.value).toBe('dark')
    expect(attribute()).toBe('dark')
  })

  it('treats junk in storage as auto', () => {
    localStorage.setItem('bl-appearance', 'blue')
    const { result } = withSetup(useAppearance)
    expect(result.mode.value).toBe('auto')
    expect(attribute()).toBeNull()
  })

  it('writes attribute and storage on change, and removes the attribute for auto', async () => {
    const { result } = withSetup(useAppearance)
    result.mode.value = 'dark'
    await nextTick()
    expect(attribute()).toBe('dark')
    expect(localStorage.getItem('bl-appearance')).toBe('dark')
    expect(result.resolved.value).toBe('dark')
    result.mode.value = 'auto'
    await nextTick()
    expect(attribute()).toBeNull()
    expect(localStorage.getItem('bl-appearance')).toBe('auto')
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

  it('shares mode and resolved between callers', async () => {
    const first = withSetup(useAppearance)
    const second = withSetup(useAppearance)
    first.result.mode.value = 'dark'
    await nextTick()
    expect(second.result.mode.value).toBe('dark')
    expect(second.result.resolved.value).toBe('dark')
  })

  it('keeps OS tracking while any caller is mounted', () => {
    const media = mockMatchMedia({ [DARK_QUERY]: false })
    const first = withSetup(useAppearance)
    const second = withSetup(useAppearance)
    expect(media.listenerCount(DARK_QUERY)).toBe(1)
    first.wrapper.unmount()
    media.set(DARK_QUERY, true)
    expect(second.result.resolved.value).toBe('dark')
    second.wrapper.unmount()
    expect(media.listenerCount(DARK_QUERY)).toBe(0)
    media.set(DARK_QUERY, false)
    expect(second.result.resolved.value).toBe('dark')
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

  it('recomputes when the threshold changes', async () => {
    scrollTo(100)
    const threshold = ref<number | false>(false)
    const { result, wrapper } = withSetup(() => useScrollLifted(threshold))
    expect(result.value).toBe(false)
    threshold.value = 10
    await nextTick()
    expect(result.value).toBe(true)
    threshold.value = 200
    await nextTick()
    expect(result.value).toBe(false)
    threshold.value = false
    scrollTo(1000)
    expect(result.value).toBe(false)
    wrapper.unmount()
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

  it('glides the text home when the overflow ends, instead of snapping', () => {
    const { box, animate } = elements(300, 100)
    const text = document.createElement('div')
    let width = 300
    Object.defineProperty(text, 'scrollWidth', { get: () => width })
    text.animate = animate
    const { result } = withSetup(() => useMarquee(ref(box), ref(text)))
    expect(animate).toHaveBeenCalledTimes(2)
    const computed = vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
      transform: 'translateX(-40px)',
      getPropertyValue: () => '.12s'
    } as unknown as CSSStyleDeclaration)
    width = 80
    result.refresh()
    expect(result.overflowing.value).toBe(false)
    expect(animate).toHaveBeenCalledTimes(3)
    expect(animate).toHaveBeenLastCalledWith(
      [{ transform: 'translateX(-40px)' }, { transform: 'none' }],
      { duration: expect.closeTo(120), easing: 'ease' }
    )
    computed.mockRestore()
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

describe('useMarquee observers', () => {
  class FakeResizeObserver {
    static instances: FakeResizeObserver[] = []
    observed: Element[] = []
    disconnected = false
    constructor(readonly callback: () => void) {
      FakeResizeObserver.instances.push(this)
    }
    observe(el: Element) {
      this.observed.push(el)
    }
    disconnect() {
      this.disconnected = true
    }
  }

  function setup(width = { content: 300, box: 100 }) {
    const box = document.createElement('div')
    const text = document.createElement('div')
    box.append(text)
    const sizes = { ...width }
    Object.defineProperty(box, 'clientWidth', { get: () => sizes.box })
    Object.defineProperty(text, 'scrollWidth', { get: () => sizes.content })
    const animate = vi.fn(() => ({ cancel: vi.fn() }) as unknown as Animation)
    box.animate = animate
    text.animate = animate
    return { box, text, animate, sizes }
  }

  beforeEach(() => {
    vi.useFakeTimers()
    FakeResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('re-measures when the container or the content resizes', () => {
    const { box, text, animate, sizes } = setup({ content: 80, box: 100 })
    const { result } = withSetup(() => useMarquee(ref(box), ref(text)))
    expect(result.overflowing.value).toBe(false)
    const observer = FakeResizeObserver.instances[0]!
    expect(observer.observed).toEqual([box, text])
    sizes.box = 40
    observer.callback()
    vi.advanceTimersByTime(200)
    expect(result.overflowing.value).toBe(true)
    expect(animate).toHaveBeenCalledTimes(2)
  })

  it('leaves running animations alone when an observer fires without a size change', () => {
    const { box, text, animate } = setup()
    withSetup(() => useMarquee(ref(box), ref(text)))
    expect(animate).toHaveBeenCalledTimes(2)
    FakeResizeObserver.instances[0]!.callback()
    vi.advanceTimersByTime(200)
    expect(animate).toHaveBeenCalledTimes(2)
  })

  it('re-measures when the content changes without a contentKey', async () => {
    const { box, text, sizes } = setup({ content: 80, box: 100 })
    const { result } = withSetup(() => useMarquee(ref(box), ref(text)))
    expect(result.overflowing.value).toBe(false)
    sizes.content = 400
    text.textContent = 'a much longer title than before'
    await Promise.resolve()
    vi.advanceTimersByTime(200)
    expect(result.overflowing.value).toBe(true)
  })

  it('re-measures once web fonts have loaded', async () => {
    let load!: () => void
    const ready = new Promise<void>((resolve) => (load = resolve))
    Object.defineProperty(document, 'fonts', { value: { ready }, configurable: true })
    try {
      const { box, text, sizes } = setup({ content: 80, box: 100 })
      const { result } = withSetup(() => useMarquee(ref(box), ref(text)))
      sizes.content = 400
      load()
      await ready
      await Promise.resolve()
      vi.advanceTimersByTime(200)
      expect(result.overflowing.value).toBe(true)
    } finally {
      Reflect.deleteProperty(document, 'fonts')
    }
  })

  it('disconnects its observers on unmount', () => {
    const { box, text } = setup()
    const { wrapper } = withSetup(() => useMarquee(ref(box), ref(text)))
    wrapper.unmount()
    expect(FakeResizeObserver.instances[0]!.disconnected).toBe(true)
  })

  it('works where ResizeObserver does not exist', () => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(globalThis, 'ResizeObserver')
    const { box, text } = setup()
    const { result } = withSetup(() => useMarquee(ref(box), ref(text)))
    expect(result.overflowing.value).toBe(true)
  })
})

describe('riseDelay', () => {
  it('steps by 60ms from zero by default', () => {
    expect(riseDelay(0)).toEqual({ '--bl-rise-delay': '0ms' })
    expect(riseDelay(2)).toEqual({ '--bl-rise-delay': '120ms' })
  })

  it('supports a base, a custom step and a cap', () => {
    expect(riseDelay(3, { base: 240, step: 70 })).toEqual({ '--bl-rise-delay': '450ms' })
    expect(riseDelay(10, { base: 240, step: 70, cap: 6 })).toEqual({ '--bl-rise-delay': '660ms' })
  })

  it('never goes below the base', () => {
    expect(riseDelay(-3, { base: 100 })).toEqual({ '--bl-rise-delay': '100ms' })
  })
})

describe('useFollowScroll', () => {
  function scroller(scrollHeight = 500, clientHeight = 100) {
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true })
    document.body.appendChild(el)
    return el
  }
  const scrollTo = (el: HTMLElement, top: number) => {
    el.scrollTop = top
    el.dispatchEvent(new Event('scroll'))
  }

  it('starts pinned and follows to the bottom', () => {
    const el = scroller()
    const { result, wrapper } = withSetup(() => useFollowScroll(ref(el)))
    expect(result.pinned.value).toBe(true)
    result.toBottom()
    expect(el.scrollTop).toBe(500)
    wrapper.unmount()
    el.remove()
  })

  it('stops following while the reader is scrolled up, resumes at the bottom', () => {
    const el = scroller()
    const { result, wrapper } = withSetup(() => useFollowScroll(ref(el)))
    scrollTo(el, 100)
    expect(result.pinned.value).toBe(false)
    result.toBottom()
    expect(el.scrollTop).toBe(100)
    scrollTo(el, 398) // within the 4px threshold of 400
    expect(result.pinned.value).toBe(true)
    result.toBottom()
    expect(el.scrollTop).toBe(500)
    wrapper.unmount()
    el.remove()
  })

  it('counts a distance of exactly the threshold as pinned, one more as not', () => {
    const el = scroller() // 500 tall in a 100 viewport: the bottom is scrollTop 400
    const { result, wrapper } = withSetup(() => useFollowScroll(ref(el)))
    scrollTo(el, 396) // distance 4
    expect(result.pinned.value).toBe(true)
    scrollTo(el, 395) // distance 5
    expect(result.pinned.value).toBe(false)
    wrapper.unmount()
    el.remove()
  })

  it('does nothing when disabled', () => {
    const el = scroller()
    const { result, wrapper } = withSetup(() => useFollowScroll(ref(el), { enabled: false }))
    result.toBottom()
    expect(el.scrollTop).toBe(0)
    wrapper.unmount()
    el.remove()
  })

  it('starts an overflowing, enabled element at the bottom and pinned', () => {
    const el = scroller()
    const { result, wrapper } = withSetup(() => useFollowScroll(ref(el)))
    expect(el.scrollTop).toBe(500)
    expect(result.pinned.value).toBe(true)
    wrapper.unmount()
    el.remove()
  })

  it('measures instead of scrolling on mount when disabled', () => {
    const el = scroller()
    const { result, wrapper } = withSetup(() => useFollowScroll(ref(el), { enabled: false }))
    expect(el.scrollTop).toBe(0)
    expect(result.pinned.value).toBe(false)
    wrapper.unmount()
    el.remove()
  })

  it('stops listening after unmount', () => {
    const el = scroller()
    const { result, wrapper } = withSetup(() => useFollowScroll(ref(el)))
    wrapper.unmount()
    scrollTo(el, 0)
    expect(result.pinned.value).toBe(true)
    el.remove()
  })

  it('binds an element that is set after mount', async () => {
    const el = scroller()
    const target = ref<HTMLElement | null>(null)
    const { result, wrapper } = withSetup(() => useFollowScroll(target))
    target.value = el
    await nextTick()
    scrollTo(el, 100)
    expect(result.pinned.value).toBe(false)
    result.toBottom()
    expect(el.scrollTop).toBe(100)
    wrapper.unmount()
    el.remove()
  })

  it('unbinds the old element when the ref is swapped', async () => {
    const first = scroller()
    const second = scroller()
    const target = ref<HTMLElement | null>(first)
    const { result, wrapper } = withSetup(() => useFollowScroll(target))
    const removed = vi.spyOn(first, 'removeEventListener')
    target.value = second
    await nextTick()
    scrollTo(second, 100)
    expect(result.pinned.value).toBe(false)
    scrollTo(second, 400)
    expect(result.pinned.value).toBe(true)
    expect(removed).toHaveBeenCalledWith('scroll', expect.any(Function))
    wrapper.unmount()
    first.remove()
    second.remove()
  })
})
