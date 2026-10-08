import {
  effectScope,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type EffectScope,
  type Ref
} from 'vue'

export type AppearanceMode = 'auto' | 'light' | 'dark'
export type ResolvedAppearance = 'light' | 'dark'

export const APPEARANCE_ATTRIBUTE = 'data-bl-appearance'
export const APPEARANCE_STORAGE_KEY = 'bl-appearance'

const isExplicit = (value: unknown): value is ResolvedAppearance =>
  value === 'light' || value === 'dark'

function readSaved(): AppearanceMode {
  const stamped = document.documentElement.getAttribute(APPEARANCE_ATTRIBUTE)
  if (isExplicit(stamped)) return stamped
  try {
    const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY)
    if (isExplicit(stored)) return stored
  } catch {
    // storage unavailable: stay on auto
  }
  return 'auto'
}

function applyAttribute(mode: AppearanceMode): void {
  const root = document.documentElement
  if (mode === 'auto') root.removeAttribute(APPEARANCE_ATTRIBUTE)
  else root.setAttribute(APPEARANCE_ATTRIBUTE, mode)
}

// A change the user makes crossfades the whole page in one View Transition, instead of every
// element easing its own colours; without the API, or with reduced motion, it applies at once.
// `resolved` follows the attribute, not the click: the browser runs the update after it has
// captured the old page, so resolving earlier would let watchers read the old theme's tokens.
function applyAnimated(mode: AppearanceMode, resolve: () => void): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || typeof document.startViewTransition !== 'function') {
    applyAttribute(mode)
    resolve()
  } else {
    // Skipping ends the transition early; the callback has run by then, so nothing is lost.
    const transition = document.startViewTransition(async () => {
      applyAttribute(mode)
      resolve()
      // Let watchers' DOM updates land before the new page is captured.
      await nextTick()
    })
    transition.ready.catch(() => {})
  }
}

interface SharedAppearance {
  mode: Ref<AppearanceMode>
  resolved: Ref<ResolvedAppearance>
  media: MediaQueryList | null
  users: number
  scope: EffectScope | null
  resolve: () => void
}

// One state per page, so every caller sees the same choice.
let shared: SharedAppearance | null = null

function getShared(): SharedAppearance {
  if (shared) return shared
  const state: SharedAppearance = {
    mode: ref<AppearanceMode>('auto'),
    resolved: ref<ResolvedAppearance>('light'),
    media: null,
    users: 0,
    scope: null,
    resolve: () => {
      state.resolved.value =
        state.mode.value === 'auto' ? (state.media?.matches ? 'dark' : 'light') : state.mode.value
    }
  }
  shared = state
  return state
}

function attach(state: SharedAppearance): void {
  state.users += 1
  if (state.users > 1) return
  state.media ??= window.matchMedia('(prefers-color-scheme: dark)')
  state.media.addEventListener('change', state.resolve)
  if (!state.scope) {
    state.mode.value = readSaved()
    applyAttribute(state.mode.value)
    // Detached so the watcher outlives whichever component mounted first.
    state.scope = effectScope(true)
    state.scope.run(() =>
      watch(state.mode, (value) => {
        applyAnimated(value, state.resolve)
        try {
          localStorage.setItem(APPEARANCE_STORAGE_KEY, value)
        } catch {
          // storage unavailable: the choice lasts for this page only
        }
      })
    )
  }
  state.resolve()
}

function detach(state: SharedAppearance): void {
  state.users -= 1
  if (state.users === 0) state.media?.removeEventListener('change', state.resolve)
}

/** @internal test helper: drops the shared state so each test starts fresh. */
export function resetAppearanceState(): void {
  if (!shared) return
  if (shared.users > 0) shared.media?.removeEventListener('change', shared.resolve)
  shared.scope?.stop()
  shared = null
}

// SSR-safe: nothing touches the DOM or storage until mounted, and the server
// gets fresh refs per call so requests never share state.
export function useAppearance(): { mode: Ref<AppearanceMode>; resolved: Ref<ResolvedAppearance> } {
  if (typeof window === 'undefined') {
    return { mode: ref<AppearanceMode>('auto'), resolved: ref<ResolvedAppearance>('light') }
  }
  const state = getShared()
  onMounted(() => attach(state))
  onBeforeUnmount(() => detach(state))
  return { mode: state.mode, resolved: state.resolved }
}
