import {
  onBeforeUnmount,
  onMounted,
  readonly,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref
} from 'vue'

export interface ActiveSectionOptions {
  /**
   * px of fixed chrome (a sticky site bar) at the top of the viewport. The reading line sits a
   * quarter of the viewport below it (default 0)
   */
  offset?: MaybeRefOrGetter<number>
}

const INPUTS = ['wheel', 'touchstart', 'pointerdown'] as const
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])
const SETTLE_MS = 150

/**
 * Tracks which section the reader is in. `active` is the last of `ids` whose top has passed the
 * reading line (`offset` px plus 25% of the viewport height from the top), the first id at the
 * top of the page, the last id at the bottom (so a short last section still becomes active) and
 * the target of a URL hash or an in-page link until the reader scrolls on their own. `ids` must be in
 * document order. Ids whose element is missing are skipped, except that a hash pin waits for its
 * element; a change of `ids` is re-measured. Several short sections at the very bottom cannot all
 * pass the line, so only the last becomes active there. On the server and until mounted it is the
 * first id, or `null` for none.
 */
export function useActiveSection(
  ids: MaybeRefOrGetter<readonly string[]>,
  { offset = 0 }: ActiveSectionOptions = {}
): { active: Readonly<Ref<string | null>> } {
  const active = ref<string | null>(toValue(ids)[0] ?? null)
  let pinned: string | null = null
  let settled = false
  let frame = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  function measure(): void {
    const list = toValue(ids)
    if (pinned && list.includes(pinned)) {
      active.value = pinned
      return
    }
    pinned = null
    const found = list.filter((id) => document.getElementById(id))
    let next = found[0] ?? null
    if (window.scrollY > 0) {
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        next = found[found.length - 1] ?? null
      } else {
        const line = toValue(offset) + window.innerHeight * 0.25
        for (const id of found) {
          if (document.getElementById(id)!.getBoundingClientRect().top <= line) next = id
        }
      }
    }
    active.value = next
  }

  function schedule(): void {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      measure()
    })
  }

  // a pin holds while the browser scrolls to its target and ends with the first scroll after that
  function settle(): void {
    clearTimeout(timer)
    settled = true
    if (pinned) {
      // a jump mid-scroll can leave the pinned section far from the reading line; a section the
      // page is too short to bring up (the bottom) legitimately stays where it is
      const top = document.getElementById(pinned)?.getBoundingClientRect().top
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      if (
        top !== undefined &&
        !atBottom &&
        Math.abs(top - toValue(offset)) > window.innerHeight * 0.25
      )
        pinned = null
    }
    schedule()
  }
  function armSettle(): void {
    clearTimeout(timer)
    timer = setTimeout(settle, SETTLE_MS)
  }

  function pin(hash: string): void {
    let id = hash.slice(1)
    try {
      id = decodeURIComponent(id)
    } catch {
      // a malformed escape: match the raw text
    }
    pinned = id && toValue(ids).includes(id) ? id : null
    settled = false
    if (pinned) armSettle()
    measure()
  }

  function onScroll(): void {
    if (pinned && settled) pinned = null
    else if (pinned) armSettle()
    schedule()
  }

  // the reader taking over releases a pin; the scrolling toward its target does not
  function release(): void {
    pinned = null
  }

  function onHash(): void {
    pin(location.hash)
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!SCROLL_KEYS.has(event.key)) return
    const target = event.target as HTMLElement | null
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))
      return
    release()
  }

  // a link to the current hash fires no hashchange, but the browser still scrolls to it
  function onClick(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0) return
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return
    const url = new URL(link.href, location.href)
    if (
      url.origin === location.origin &&
      url.pathname + url.search === location.pathname + location.search
    )
      pin(url.hash)
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scrollend', settle)
    window.addEventListener('resize', schedule, { passive: true })
    window.addEventListener('hashchange', onHash)
    window.addEventListener('keydown', onKeydown, { passive: true })
    document.addEventListener('click', onClick)
    for (const type of INPUTS) window.addEventListener(type, release, { passive: true })
    pin(location.hash)
  })
  // post-flush watchers never run on the server, so this stays SSR-safe
  watch(() => [...toValue(ids), toValue(offset)], measure, { flush: 'post' })
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    clearTimeout(timer)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('scrollend', settle)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('hashchange', onHash)
    window.removeEventListener('keydown', onKeydown)
    document.removeEventListener('click', onClick)
    for (const type of INPUTS) window.removeEventListener(type, release)
  })

  return { active: readonly(active) }
}
