import { cssTime } from './cssTime'

// display/overlay only hold an element in the top layer (Chromium); they are not the exit.
const HOLDS = new Set(['display', 'overlay', 'none', ''])

function longest(node: Element): { property: string; ms: number } | null {
  const style = getComputedStyle(node)
  const list = (value: string) => (value || '').split(',').map((part) => part.trim())
  const durations = list(style.transitionDuration).map((t) => cssTime(t, 0))
  const delays = list(style.transitionDelay).map((t) => cssTime(t, 0))
  let best: { property: string; ms: number } | null = null
  list(style.transitionProperty).forEach((property, i) => {
    if (HOLDS.has(property)) return
    // Shorter duration and delay lists repeat to cover every property.
    const ms = durations[i % durations.length]! + delays[i % delays.length]!
    if (!best || ms > best.ms) best = { property, ms }
  })
  return best
}

export interface ExitOptions {
  // The element whose transition times the exit; `el` by default.
  target?: Element | undefined
  // Made inert for the exit, so keys and focus cannot reach a control in what is leaving
  // (pointer-events: none stops only the pointer). Elements already inert are left alone.
  inert?: (Element | null | undefined)[] | undefined
  // Where focus goes if it was in what turns inert; `el` by default, null to leave it. Moved at
  // once: Chromium lets an inert focused element take keys until the next frame.
  focus?: HTMLElement | null | undefined
}

/**
 * Plays an exit before something closes: sets `data-closing` on `el` (CSS mirrors the closed
 * state there) and makes `inert` inert, then calls `done` once the longest transition on
 * `target` ends, or after its
 * duration + 50ms if no `transitionend` arrives, and undoes both after it. With
 * nothing to wait for (no transition, reduced motion, a disconnected element) that all happens
 * synchronously. Every browser can play an exit this way, not only those with `overlay`. The
 * returned cancel stops an exit under way (no `done`) and undoes both; it does nothing
 * once the exit is over. `data-closing` is present exactly while the exit is under way.
 */
export function playExit(el: HTMLElement, done: () => void, o: ExitOptions = {}): () => void {
  const target = o.target ?? el
  const held = (o.inert ?? []).filter(
    (node): node is HTMLElement => node instanceof HTMLElement && !node.inert
  )
  let timer: ReturnType<typeof setTimeout> | undefined
  let property = ''
  const stop = () => {
    clearTimeout(timer)
    timer = undefined
    target.removeEventListener('transitionend', onEnd as EventListener)
  }
  // Someone else setting inert on a held node during the exit makes it theirs to undo.
  const touched = new Set<Node>()
  const watcher =
    typeof MutationObserver === 'undefined'
      ? null
      : new MutationObserver((records) => records.forEach((r) => touched.add(r.target)))
  const clear = () => {
    if (!el.hasAttribute('data-closing')) return
    watcher?.takeRecords().forEach((r) => touched.add(r.target))
    watcher?.disconnect()
    for (const node of held) if (!touched.has(node)) node.inert = false
    // Settle styles while data-closing still turns off Chromium's display/overlay exit, so a
    // closed element leaves the top layer at once instead of lingering invisibly.
    void getComputedStyle(el).display
    el.removeAttribute('data-closing')
  }
  const finish = () => {
    stop()
    try {
      done()
    } finally {
      clear()
    }
  }
  function onEnd(event: TransitionEvent): void {
    if (event.target !== target || event.pseudoElement) return
    if (property === 'all' || event.propertyName === property) finish()
  }
  el.setAttribute('data-closing', '')
  const active = document.activeElement
  const to = o.focus === undefined ? el : o.focus
  if (to && active && held.some((node) => node.contains(active))) to.focus({ preventScroll: true })
  for (const node of held) {
    node.inert = true
    watcher?.observe(node, { attributeFilter: ['inert'] })
  }
  const exit = el.isConnected ? longest(target) : null
  if (!exit || exit.ms < 1) finish()
  else {
    property = exit.property
    target.addEventListener('transitionend', onEnd as EventListener)
    timer = setTimeout(finish, exit.ms + 50)
  }
  return () => {
    stop()
    clear()
  }
}
