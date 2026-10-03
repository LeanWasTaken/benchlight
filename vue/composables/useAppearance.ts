import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export type AppearanceMode = 'auto' | 'light' | 'dark'
export type ResolvedAppearance = 'light' | 'dark'

export const APPEARANCE_ATTRIBUTE = 'data-kd-appearance'
export const APPEARANCE_STORAGE_KEY = 'kd-appearance'

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

// SSR-safe: nothing touches the DOM or storage until mounted.
export function useAppearance(): { mode: Ref<AppearanceMode>; resolved: Ref<ResolvedAppearance> } {
  const mode = ref<AppearanceMode>('auto')
  const resolved = ref<ResolvedAppearance>('light')
  let media: MediaQueryList | null = null

  const resolve = () => {
    resolved.value = mode.value === 'auto' ? (media?.matches ? 'dark' : 'light') : mode.value
  }

  onMounted(() => {
    media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', resolve)
    mode.value = readSaved()
    applyAttribute(mode.value)
    resolve()
    watch(mode, (value) => {
      applyAttribute(value)
      try {
        localStorage.setItem(APPEARANCE_STORAGE_KEY, value)
      } catch {
        // storage unavailable: the choice lasts for this page only
      }
      resolve()
    })
  })

  onBeforeUnmount(() => media?.removeEventListener('change', resolve))

  return { mode, resolved }
}
