import { readFileSync } from 'node:fs'

const prepaint = readFileSync(new URL('../js/prepaint.js', import.meta.url), 'utf8').trim()

/**
 * Benchlight integration for plain Vite apps: keeps the shipped .vue source out of
 * esbuild dependency pre-bundling and inlines the no-flash appearance script.
 * @returns {import('vite').Plugin}
 */
export function benchlight() {
  return {
    name: 'benchlight',
    config: () => ({ optimizeDeps: { exclude: ['benchlight'] } }),
    transformIndexHtml: () => [{ tag: 'script', children: prepaint, injectTo: 'head-prepend' }]
  }
}
