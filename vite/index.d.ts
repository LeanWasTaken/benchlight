import type { Plugin } from 'vite'

export declare function benchlight(options?: {
  /** inject the inline no-flash appearance script (default `true`) */
  prepaint?: boolean
}): Plugin
