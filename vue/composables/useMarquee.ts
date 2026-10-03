import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useReducedMotion } from './useReducedMotion'

export interface MarqueeOptions {
  /** scroll speed in px per second */
  speed?: number
  /** share of each cycle spent paused at either end */
  pause?: number
  /** extra px scrolled past the end */
  overshoot?: number
}

// Pauses at both ends, never animates under reduced motion; mask edges follow the text.
export function useMarquee(
  container: Ref<HTMLElement | null>,
  content: Ref<HTMLElement | null>,
  { speed = 22, pause = 0.18, overshoot = 14 }: MarqueeOptions = {}
): { overflowing: Ref<boolean>; refresh: () => void } {
  const overflowing = ref(false)
  const reduced = useReducedMotion()
  let animations: Animation[] = []
  let resizeTimer: ReturnType<typeof setTimeout> | null = null

  function stop(): void {
    for (const animation of animations) animation.cancel()
    animations = []
  }

  function refresh(): void {
    stop()
    const box = container.value
    const text = content.value
    if (!box || !text) {
      overflowing.value = false
      return
    }
    const overflow = text.scrollWidth - box.clientWidth
    overflowing.value = overflow > 1
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
          { '--kd-mask-l': '0%', '--kd-mask-r': '88%', offset: 0 },
          { '--kd-mask-l': '0%', '--kd-mask-r': '88%', offset: pause },
          { '--kd-mask-l': '12%', '--kd-mask-r': '100%', offset: 1 - pause },
          { '--kd-mask-l': '12%', '--kd-mask-r': '100%', offset: 1 }
        ] as unknown as Keyframe[],
        timing
      )
    ]
  }

  function onResize(): void {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(refresh, 150)
  }

  watch(reduced, refresh)
  onMounted(() => {
    refresh()
    window.addEventListener('resize', onResize, { passive: true })
  })
  onBeforeUnmount(() => {
    stop()
    if (resizeTimer) clearTimeout(resizeTimer)
    window.removeEventListener('resize', onResize)
  })

  return { overflowing, refresh }
}
