import {
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref
} from 'vue'
import { cssTime } from '../internal/cssTime'
import { useReducedMotion } from './useReducedMotion'

export interface MarqueeOptions {
  /** scroll speed in px per second */
  speed?: number
  /** share of each cycle spent paused at either end */
  pause?: number
  /** extra px scrolled past the end */
  overshoot?: number
  /** holds the scroll still while true; hover and focus inside the container pause it as well */
  paused?: MaybeRefOrGetter<boolean>
}

// Pauses at both ends, never animates under reduced motion (the CSS wraps the text instead); mask
// edges follow the text. Holds still while hovered, while focus is inside, or while `paused` is
// true (WCAG 2.2.2). Re-measures on container, content and font changes.
export function useMarquee(
  container: Ref<HTMLElement | null>,
  content: Ref<HTMLElement | null>,
  { speed = 22, pause = 0.18, overshoot = 14, paused = false }: MarqueeOptions = {}
): { overflowing: Ref<boolean>; refresh: () => void } {
  const overflowing = ref(false)
  const reduced = useReducedMotion()
  let animations: Animation[] = []
  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  let measured = ''
  let disposed = false
  let resizeObserver: ResizeObserver | null = null
  let mutationObserver: MutationObserver | null = null
  let hovered = false
  let focused = false

  function syncPlayState(): void {
    const hold = hovered || focused || toValue(paused)
    for (const animation of animations) {
      if (hold) animation.pause()
      else animation.play()
    }
  }

  const onPointerEnter = (): void => {
    hovered = true
    syncPlayState()
  }
  const onPointerLeave = (): void => {
    hovered = false
    syncPlayState()
  }
  const onFocusIn = (): void => {
    focused = true
    syncPlayState()
  }
  const onFocusOut = (event: FocusEvent): void => {
    focused =
      event.relatedTarget instanceof Node && !!container.value?.contains(event.relatedTarget)
    syncPlayState()
  }

  function stop(): void {
    for (const animation of animations) animation.cancel()
    animations = []
  }

  function refresh(): void {
    const box = container.value
    const text = content.value
    // Where the text was when the loop stops, so it can glide home instead of snapping.
    const resting =
      text && animations.length > 0 && !reduced.value ? getComputedStyle(text).transform : ''
    stop()
    if (!box || !text) {
      overflowing.value = false
      return
    }
    measured = `${text.scrollWidth}:${box.clientWidth}`
    const overflow = text.scrollWidth - box.clientWidth
    overflowing.value = overflow > 1
    if (!overflowing.value && resting && resting !== 'none')
      text.animate?.([{ transform: resting }, { transform: 'none' }], {
        duration: cssTime(getComputedStyle(text).getPropertyValue('--bl-duration-fast'), 150),
        easing: 'ease'
      })
    if (!overflowing.value || reduced.value) return
    const distance = -(overflow + overshoot)
    const timing: KeyframeAnimationOptions = {
      duration: Math.max(5, (overflow + overshoot) / speed) * 1000,
      iterations: Infinity,
      direction: 'alternate',
      easing: 'ease-in-out'
    }
    animations = [
      text.animate(
        [
          { transform: 'translateX(0)', offset: 0 },
          { transform: 'translateX(0)', offset: pause },
          { transform: `translateX(${distance}px)`, offset: 1 - pause },
          { transform: `translateX(${distance}px)`, offset: 1 }
        ],
        timing
      ),
      box.animate(
        [
          { '--bl-mask-l': '0%', '--bl-mask-r': '88%', offset: 0 },
          { '--bl-mask-l': '0%', '--bl-mask-r': '88%', offset: pause },
          { '--bl-mask-l': '12%', '--bl-mask-r': '100%', offset: 1 - pause },
          { '--bl-mask-l': '12%', '--bl-mask-r': '100%', offset: 1 }
        ] as unknown as Keyframe[],
        timing
      )
    ]
    if (hovered || focused || toValue(paused)) syncPlayState()
  }

  // Observers fire on mount and for changes that leave the widths alone (animated transforms
  // never do), so only a changed measurement restarts the animation.
  function refreshIfChanged(): void {
    const box = container.value
    const text = content.value
    if (box && text && measured === `${text.scrollWidth}:${box.clientWidth}`) return
    refresh()
  }

  function schedule(update: () => void): void {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(update, 150)
  }

  const onResize = (): void => schedule(refresh)
  const onObserved = (): void => schedule(refreshIfChanged)

  watch(reduced, refresh)
  watch(() => toValue(paused), syncPlayState)
  onMounted(() => {
    refresh()
    const box = container.value
    box?.addEventListener('pointerenter', onPointerEnter)
    box?.addEventListener('pointerleave', onPointerLeave)
    box?.addEventListener('focusin', onFocusIn)
    box?.addEventListener('focusout', onFocusOut)
    window.addEventListener('resize', onResize, { passive: true })
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(onObserved)
      if (container.value) resizeObserver.observe(container.value)
      if (content.value) resizeObserver.observe(content.value)
    }
    if (typeof MutationObserver !== 'undefined' && content.value) {
      mutationObserver = new MutationObserver(onObserved)
      mutationObserver.observe(content.value, {
        childList: true,
        characterData: true,
        subtree: true
      })
    }
    // Web fonts change glyph widths after the first measurement.
    if (typeof document !== 'undefined' && document.fonts?.ready)
      void document.fonts.ready.then(() => {
        if (!disposed) onObserved()
      })
  })
  onBeforeUnmount(() => {
    disposed = true
    stop()
    const box = container.value
    box?.removeEventListener('pointerenter', onPointerEnter)
    box?.removeEventListener('pointerleave', onPointerLeave)
    box?.removeEventListener('focusin', onFocusIn)
    box?.removeEventListener('focusout', onFocusOut)
    if (resizeTimer) clearTimeout(resizeTimer)
    window.removeEventListener('resize', onResize)
    resizeObserver?.disconnect()
    mutationObserver?.disconnect()
  })

  return { overflowing, refresh }
}
