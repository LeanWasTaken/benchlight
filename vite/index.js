import { PREPAINT } from '../js/prepaint-script.mjs'

// lightningcss `Features.DirSelector`. Hardcoded so the plugin never imports lightningcss, which
// Vite 6/7 projects may not have installed; tests/integrations/vite.test.ts pins the value.
const DIR_SELECTOR = 4

/**
 * Benchlight integration for plain Vite apps: keeps `benchlight` out of Vite's
 * dependency pre-bundling (the compiled components need no plugin), stops lightningcss (Vite 8's
 * default CSS minifier) from lowering `:dir()` into `:lang()`, which would drop RTL styling
 * for low CSS targets, and inlines the no-flash appearance script.
 * @param {{ prepaint?: boolean }} [options] `prepaint: false` injects nothing (for a nonce-based CSP)
 * @returns {import('vite').Plugin}
 */
export function benchlight({ prepaint = true } = {}) {
  return {
    name: 'benchlight',
    config: (userConfig) => ({
      optimizeDeps: { exclude: ['benchlight'] },
      css: {
        lightningcss: {
          exclude: (userConfig?.css?.lightningcss?.exclude ?? 0) | DIR_SELECTOR
        }
      }
    }),
    transformIndexHtml: () =>
      prepaint ? [{ tag: 'script', children: PREPAINT, injectTo: 'head-prepend' }] : []
  }
}
