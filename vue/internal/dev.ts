export const isDev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV)

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
