import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

export const DARK_QUERY = '(prefers-color-scheme: dark)'
export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

export function withSetup<T>(composable: () => T): { result: T; wrapper: VueWrapper } {
  let result!: T
  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable()
        return () => h('div')
      }
    })
  )
  return { result, wrapper }
}

// Replaces window.matchMedia with controllable queries; set() fires change listeners.
export function mockMatchMedia(initial: Record<string, boolean> = {}) {
  const state = new Map(Object.entries(initial))
  const listeners = new Map<string, Set<() => void>>()
  window.matchMedia = ((query: string) => ({
    media: query,
    get matches() {
      return state.get(query) ?? false
    },
    addEventListener: (_type: string, listener: () => void) => {
      if (!listeners.has(query)) listeners.set(query, new Set())
      listeners.get(query)!.add(listener)
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.get(query)?.delete(listener)
    }
  })) as unknown as typeof window.matchMedia
  return {
    set(query: string, matches: boolean) {
      state.set(query, matches)
      listeners.get(query)?.forEach((listener) => listener())
    }
  }
}
