import type { LinkAs, LinkTo } from '../types'

const isDev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV)

function warn(message: string): void {
  if (isDev) console.warn(`[benchlight] ${message}`)
}

// The rendered tag: an explicit `as`, else an anchor when there is a link target, else the fallback.
export function resolveTag(
  as: LinkAs | undefined,
  to: LinkTo | undefined,
  href: string | undefined,
  fallback: string
): LinkAs {
  return as ?? (href || to ? 'a' : fallback)
}

// Props for a link-rendering element: anchors get href, router components get to.
export function linkBindings(as: LinkAs, to?: LinkTo, href?: string): Record<string, unknown> {
  if (typeof as === 'string') {
    if (as === 'a') {
      if (href === undefined && to !== undefined && typeof to !== 'string') {
        warn('an object `to` needs a router component in `as`; this <a> renders without href.')
      }
      return { href: href ?? (typeof to === 'string' ? to : undefined) }
    }
    if (to !== undefined || href !== undefined) {
      warn(`<${as}> is not a link, so its \`to\`/\`href\` are ignored.`)
    }
    return {}
  }
  if (to === undefined && href !== undefined) {
    warn('a router component in `as` expects `to`; it received `href` instead.')
  }
  return to !== undefined ? { to } : { href }
}
