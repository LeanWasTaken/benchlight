import { PREPAINT } from '../js/prepaint-script.mjs'

/**
 * Benchlight integration for plain Vite apps: keeps `benchlight` out of Vite's
 * dependency pre-bundling (the compiled components need no plugin) and inlines the no-flash appearance script.
 * @returns {import('vite').Plugin}
 */
export function benchlight() {
  return {
    name: 'benchlight',
    config: () => ({ optimizeDeps: { exclude: ['benchlight'] } }),
    transformIndexHtml: () => [{ tag: 'script', children: PREPAINT, injectTo: 'head-prepend' }]
  }
}
