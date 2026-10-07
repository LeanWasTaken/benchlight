export const isDev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV)

// Development-only console warning with the library prefix.
export function warn(message: string): void {
  if (isDev) console.warn(`[benchlight] ${message}`)
}
