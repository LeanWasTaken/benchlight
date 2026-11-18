// Pure zoom and pan maths for BlLightbox. A state is a scale relative to the fitted media (1 = fit)
// and a translation in px; content scales around the centre of its box, so a point p of the
// content (relative to that centre, at zoom 1) shows at (x + zoom * p.x, y + zoom * p.y).

export interface Size {
  width: number
  height: number
}
export interface Point {
  x: number
  y: number
}
export interface ZoomState {
  zoom: number
  x: number
  y: number
}

const usable = (s: Size) => s.width > 0 && s.height > 0

/** The scale at which `natural` fits `box` (object-fit: contain, never enlarged); 1 if unknown. */
export function fitScale(natural: Size, box: Size): number {
  if (!usable(natural) || !usable(box)) return 1
  return Math.min(1, box.width / natural.width, box.height / natural.height)
}

export function clampZoom(zoom: number, min: number, max: number): number {
  return Number.isNaN(zoom) ? min : Math.min(Math.max(zoom, min), max)
}

/** Zooms to `zoom` keeping the content under `point` (relative to the box centre) in place. */
export function zoomAt(state: ZoomState, zoom: number, point: Point): ZoomState {
  const k = zoom / state.zoom
  return { zoom, x: point.x - k * (point.x - state.x), y: point.y - k * (point.y - state.y) }
}

/**
 * Limits the pan so the zoomed content (`content` is its size at zoom 1) always covers the box
 * on an axis where it is larger, and stays centred on an axis where it is not.
 */
export function clampPan(state: ZoomState, box: Size, content: Size): ZoomState {
  const axis = (t: number, size: number, room: number) => {
    const limit = Math.max(0, (size * state.zoom - room) / 2)
    return Math.min(Math.max(t, -limit), limit) || 0
  }
  return {
    zoom: state.zoom,
    x: axis(state.x, content.width, box.width),
    y: axis(state.y, content.height, box.height)
  }
}

/** One zoom step in or out (dir 1 or -1): a factor of 1.25. */
export function step(zoom: number, dir: 1 | -1): number {
  return dir > 0 ? zoom * 1.25 : zoom / 1.25
}
