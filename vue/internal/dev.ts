// Left as written by the library build so the consumer's bundler decides: Vite and Nuxt replace
// `process.env.NODE_ENV` in dependencies, as they do for Vue itself. `import.meta.env.DEV` would be
// frozen to `false` at build time and silence every warning.
declare const process: { env: { NODE_ENV?: string } } | undefined
// The literal `process.env.NODE_ENV` stays (no optional chaining) so bundler `define` replaces it.
export const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'

// Development-only console warning with the library prefix.
export function warn(message: string): void {
  if (isDev) console.warn(`[benchlight] ${message}`)
}

const warned = new Set<string>()

// Like warn, but each distinct message fires once per page load.
export function warnOnce(message: string): void {
  if (!isDev || warned.has(message)) return
  warned.add(message)
  warn(message)
}
