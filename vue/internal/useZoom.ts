import { computed, ref, watch, type Ref } from 'vue'
import {
  clampPan,
  clampZoom,
  fitScale,
  step,
  zoomAt,
  type Point,
  type Size,
  type ZoomState
} from './zoom'

export interface ZoomOptions {
  enabled: () => boolean
  /** The zoom model (1 = fit). */
  model: Ref<number>
  /** The transformed wrapper; its first element child is the media. */
  frame: Ref<HTMLElement | undefined>
  /** Takes pointer capture during a drag. */
  surface: Ref<HTMLElement | undefined>
  natural: Ref<Size | null>
  maxZoom: () => number | undefined
  /** Events the zoom leaves alone (interactive media, already handled). */
  ignore: (event: Event) => boolean
}

// Safari's trackpad pinch (WebKit GestureEvent, not in the DOM typings).
type GestureEvent = UIEvent & { scale: number; clientX: number; clientY: number }

const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_PX = 24
const DRAG_PX = 10

// Zoom and pan for BlLightbox's frame: wheel, pinch, drag, double-tap, keys (through zoomBy,
// panBy, reset) and the v-model. Pure maths lives in ./zoom.
export function useZoom(o: ZoomOptions) {
  const state = ref<ZoomState>({ zoom: 1, x: 0, y: 0 })
  // Discrete changes (buttons, keys, double-tap) may ease; gestures never do.
  const easing = ref(false)
  const box = ref<Size>({ width: 0, height: 0 })

  const max = computed(() => {
    const set = o.maxZoom()
    if (set !== undefined) return Math.max(1, set)
    const natural = o.natural.value
    return natural ? Math.max(8, 4 / fitScale(natural, box.value)) : 8
  })

  // Sizes come from layout, which ignores transforms: a painted rect would still carry an eased
  // zoom that is under way. The used border-box size keeps its fractions (offsetWidth rounds,
  // and the zoom multiplies that error); offset or client sizes stand in where it is not a length.
  function layoutSize(el: Element): Size {
    const cs = getComputedStyle(el)
    const edges = (a: string, b: string) =>
      cs.boxSizing === 'border-box'
        ? 0
        : ['padding', 'border'].reduce(
            (sum, kind) =>
              sum +
              (parseFloat(
                cs.getPropertyValue(`${kind}-${a}${kind === 'border' ? '-width' : ''}`)
              ) || 0) +
              (parseFloat(
                cs.getPropertyValue(`${kind}-${b}${kind === 'border' ? '-width' : ''}`)
              ) || 0),
            0
          )
    const width = parseFloat(cs.width)
    const height = parseFloat(cs.height)
    if (Number.isFinite(width) && Number.isFinite(height))
      return { width: width + edges('left', 'right'), height: height + edges('top', 'bottom') }
    if (el instanceof HTMLElement) return { width: el.offsetWidth, height: el.offsetHeight }
    return { width: el.clientWidth, height: el.clientHeight }
  }
  function measure(): Size {
    const frame = o.frame.value
    if (frame) box.value = layoutSize(frame)
    return box.value
  }
  // The media's size at zoom 1; for an image, the picture object-fit: contain draws in its box.
  function content(): Size {
    const media = o.frame.value?.firstElementChild
    if (!media) return box.value
    const shown = layoutSize(media)
    if (!(media instanceof HTMLImageElement) || !media.naturalWidth || !media.naturalHeight)
      return shown
    const k = Math.min(shown.width / media.naturalWidth, shown.height / media.naturalHeight)
    return { width: media.naturalWidth * k, height: media.naturalHeight * k }
  }
  // A screen point relative to the frame's untransformed centre, placed from its offsetParent
  // (the dialog, which is never transformed).
  function relative(x: number, y: number): Point {
    const frame = o.frame.value
    if (!frame) return { x: 0, y: 0 }
    const origin = frame.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 }
    const size = layoutSize(frame)
    return {
      x: x - (origin.left + frame.offsetLeft + size.width / 2),
      y: y - (origin.top + frame.offsetTop + size.height / 2)
    }
  }

  function commit(next: ZoomState, animate: boolean): void {
    if (!o.enabled()) return
    measure()
    const zoom = clampZoom(next.zoom, 1, max.value)
    const clamped = clampPan(
      zoom === next.zoom ? next : zoomAt(next, zoom, { x: 0, y: 0 }),
      box.value,
      content()
    )
    const s = state.value
    if (clamped.zoom !== s.zoom || clamped.x !== s.x || clamped.y !== s.y) {
      easing.value = animate
      state.value = clamped
    }
    report(clamped.zoom)
  }
  // Tells a bound v-model the zoom in effect, once per change.
  let reported = Number.NaN
  function report(zoom: number): void {
    if (o.model.value === zoom || reported === zoom) return
    reported = zoom
    o.model.value = zoom
  }
  function zoomTo(zoom: number, at: Point = { x: 0, y: 0 }, animate = true): void {
    if (!o.enabled() || !Number.isFinite(zoom)) return
    measure()
    commit(zoomAt(state.value, clampZoom(zoom, 1, max.value), at), animate)
  }
  const zoomBy = (dir: 1 | -1) => zoomTo(step(state.value.zoom, dir))
  const reset = (animate = false) => commit({ zoom: 1, x: 0, y: 0 }, animate)
  /** Pans by fractions of the box (1 = its whole width or height). */
  function panBy(fx: number, fy: number): void {
    const b = measure()
    const s = state.value
    commit({ ...s, x: s.x + fx * b.width, y: s.y + fy * b.height }, true)
  }
  // Fit ↔ 1:1, or ↔ 2.5x when 1:1 is barely larger than fit.
  function toggle(at: Point): void {
    if (state.value.zoom > 1) return zoomTo(1, at)
    const natural = o.natural.value
    const actual = natural ? 1 / fitScale(natural, measure()) : 1
    zoomTo(actual >= 1.5 ? actual : 2.5, at)
  }
  // The box or the media changed size: keep the zoom, re-clamp the pan.
  const refit = () => commit({ ...state.value }, false)

  // A bound zoom set from outside is applied and the zoom in effect reported back, also when it
  // clamps to the current one (0.5 at fit) or zoom is off. A lower limit once the natural size
  // is known.
  watch([o.model, () => o.enabled()], ([zoom, on]) => {
    reported = Number.NaN
    if (!on) {
      state.value = { zoom: 1, x: 0, y: 0 }
      gestureBase = null
      report(1)
      return
    }
    if (zoom !== state.value.zoom) zoomTo(zoom)
    report(state.value.zoom)
  })
  watch(max, (limit) => {
    if (state.value.zoom > limit) zoomTo(limit, { x: 0, y: 0 }, false)
  })
  watch(o.frame, (frame, _, onCleanup) => {
    if (!frame || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(refit)
    observer.observe(frame)
    onCleanup(() => observer.disconnect())
  })

  function onWheel(event: WheelEvent): void {
    if (!o.enabled() || o.ignore(event)) return
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? measure().height : 1
    const dx = event.deltaX * unit
    const dy = event.deltaY * unit
    const s = state.value
    const sideways = Math.abs(dx) > Math.abs(dy)
    // WebKit may send ctrl+wheel for a pinch it also reports as gesture events: one is enough.
    if (gestureBase && event.ctrlKey) {
      event.preventDefault()
      return
    }
    if (!event.ctrlKey && sideways) {
      // Two-finger sideways scroll pans a zoomed image; at fit it is not ours (never navigates).
      if (s.zoom <= 1) return
      event.preventDefault()
      commit({ ...s, x: s.x - dx, y: s.y - dy }, false)
      return
    }
    if (dy === 0) return
    event.preventDefault()
    // ctrlKey marks a trackpad pinch: many small deltas, so a larger factor per px.
    const factor = Math.exp(-dy * (event.ctrlKey ? 0.01 : 0.002))
    zoomTo(s.zoom * clampZoom(factor, 0.5, 2), relative(event.clientX, event.clientY), false)
  }

  let gestureBase: ZoomState | null = null
  function onGestureStart(event: Event): void {
    // On iOS the pointers drive the pinch; these only stand in for a Mac trackpad.
    if (!o.enabled() || points.size || o.ignore(event)) return
    event.preventDefault()
    gestureBase = { ...state.value }
  }
  function onGestureChange(event: Event): void {
    if (!gestureBase || points.size) return
    event.preventDefault()
    const e = event as GestureEvent
    zoomTo(gestureBase.zoom * e.scale, relative(e.clientX, e.clientY), false)
  }
  function onGestureEnd(): void {
    gestureBase = null
  }
  watch(o.surface, (surface, _, onCleanup) => {
    if (!surface) return
    surface.addEventListener('gesturestart', onGestureStart)
    surface.addEventListener('gesturechange', onGestureChange)
    surface.addEventListener('gestureend', onGestureEnd)
    onCleanup(() => {
      surface.removeEventListener('gesturestart', onGestureStart)
      surface.removeEventListener('gesturechange', onGestureChange)
      surface.removeEventListener('gestureend', onGestureEnd)
    })
  })

  // Pointers: one pans (while zoomed), two pinch around their midpoint; a pinch that loses a
  // finger carries on as a pan from where it is. Up to two pointers count.
  type Gesture =
    | { kind: 'pan'; id: number; from: Point; base: ZoomState }
    | { kind: 'pinch'; mid: Point; at: Point; distance: number; base: ZoomState }
  const points = new Map<number, Point>()
  let gesture: Gesture | null = null
  let moved = false
  let suppress = false
  let lastTap: { time: number; x: number; y: number } | null = null

  const midpoint = () => {
    const [a, b] = [...points.values()] as [Point, Point]
    return {
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      distance: Math.hypot(a.x - b.x, a.y - b.y)
    }
  }
  function startPan(id: number): void {
    gesture = { kind: 'pan', id, from: { ...points.get(id)! }, base: { ...state.value } }
  }
  function startPinch(): void {
    const { mid, distance } = midpoint()
    const at = relative(mid.x, mid.y)
    gesture = { kind: 'pinch', mid, at, distance: distance || 1, base: { ...state.value } }
  }
  function capture(id: number): void {
    try {
      o.surface.value?.setPointerCapture(id)
    } catch {
      // The pointer is already gone; its up or cancel still arrives.
    }
  }

  function onPointerDown(event: PointerEvent): void {
    if (!o.enabled()) return
    // A primary pointer starts a new gesture; forget any whose up landed elsewhere.
    if (event.isPrimary) {
      points.clear()
      gesture = null
      suppress = false
    }
    if (o.ignore(event) || (event.pointerType === 'mouse' && event.button !== 0)) return
    if (points.size >= 2) return
    points.set(event.pointerId, { x: event.clientX, y: event.clientY })
    easing.value = false
    if (points.size === 1) {
      moved = false
      startPan(event.pointerId)
    } else {
      moved = true
      startPinch()
    }
  }
  function onPointerMove(event: PointerEvent): void {
    if (!gesture || !points.has(event.pointerId)) return
    points.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (gesture.kind === 'pinch') {
      const { mid, distance } = midpoint()
      const g = gesture
      const next = zoomAt(
        g.base,
        clampZoom((g.base.zoom * distance) / g.distance, 1, max.value),
        g.at
      )
      commit({ ...next, x: next.x + mid.x - g.mid.x, y: next.y + mid.y - g.mid.y }, false)
      return
    }
    if (event.pointerId !== gesture.id) return
    const dx = event.clientX - gesture.from.x
    const dy = event.clientY - gesture.from.y
    if (!moved && Math.hypot(dx, dy) >= DRAG_PX) {
      moved = true
      capture(event.pointerId)
    }
    const base = gesture.base
    if (base.zoom > 1) commit({ ...base, x: base.x + dx, y: base.y + dy }, false)
  }
  function end(event: PointerEvent, up: boolean): void {
    if (!points.delete(event.pointerId)) return
    if (points.size === 1) {
      if (gesture?.kind === 'pinch') startPan([...points.keys()][0]!)
      return
    }
    const single = gesture?.kind === 'pan'
    gesture = null
    if (moved) {
      // The click that ends a drag neither activates slotted content nor closes.
      if (up) suppressClick(event.pointerType)
      lastTap = null
    } else if (up && single) tap(event)
  }
  // A mouse click follows its pointerup in the same task. A touch or pen tap's click comes as a
  // task of its own (Chromium's GestureTap), so the flag waits for it, up to 350ms; a drag may
  // have no click at all, and the flag must not catch some later, unrelated one.
  let expiry: ReturnType<typeof setTimeout> | undefined
  function suppressClick(pointerType: string): void {
    suppress = true
    clearTimeout(expiry)
    expiry = setTimeout(() => (suppress = false), pointerType === 'mouse' ? 0 : 350)
  }
  function tap({ clientX: x, clientY: y, pointerType }: PointerEvent): void {
    const now = Date.now()
    const last = lastTap
    if (
      last &&
      now - last.time <= DOUBLE_TAP_MS &&
      Math.hypot(x - last.x, y - last.y) <= DOUBLE_TAP_PX
    ) {
      lastTap = null
      suppressClick(pointerType)
      toggle(relative(x, y))
    } else lastTap = { time: now, x, y }
  }
  const onPointerUp = (event: PointerEvent) => end(event, true)
  const onPointerCancel = (event: PointerEvent) => end(event, false)
  // Only the capture this surface took; an image losing its implicit touch capture to it is not
  // the end of anything.
  function onLostCapture(event: PointerEvent): void {
    if (event.target === o.surface.value) end(event, false)
  }
  function onClickCapture(event: MouseEvent): void {
    // detail 0: a keyboard or assistive-technology activation, never the end of a drag.
    if (!suppress || event.detail === 0) return
    suppress = false
    clearTimeout(expiry)
    event.preventDefault()
    event.stopPropagation()
  }
  /** Drops every pointer and gesture (window blur, close, deactivation). */
  function release(): void {
    clearTimeout(expiry)
    points.clear()
    gesture = gestureBase = lastTap = null
    moved = suppress = false
  }

  return {
    state,
    easing,
    max,
    zoomTo,
    zoomBy,
    reset,
    panBy,
    refit,
    /** True while two pointers pinch or the media is zoomed in: no swipe then. */
    busy: () => points.size > 1 || state.value.zoom > 1,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostCapture,
    onClickCapture,
    release
  }
}
