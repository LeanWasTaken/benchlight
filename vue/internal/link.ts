import type { LinkAs, LinkTo } from '../types'

// Props for a link-rendering element: anchors get href, router components get to.
export function linkBindings(as: LinkAs, to?: LinkTo, href?: string): Record<string, unknown> {
  if (typeof as === 'string') {
    if (as === 'a') return { href: href ?? (typeof to === 'string' ? to : undefined) }
    return {}
  }
  return to !== undefined ? { to } : { href }
}
