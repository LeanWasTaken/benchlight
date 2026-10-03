import { PREPAINT } from '../js/prepaint-script.mjs'

/**
 * Benchlight integration for plain Vite apps: keeps the shipped .vue source out of
 * esbuild dependency pre-bundling and inlines the no-flash appearance script.
 * @returns {import('vite').Plugin}
 */
export function benchlight() {
  return {
    name: 'benchlight',
    config: () => ({ optimizeDeps: { exclude: ['benchlight'] } }),
    transformIndexHtml: () => [{ tag: 'script', children: PREPAINT, injectTo: 'head-prepend' }]
  }
}
