import type { LinkProps, LinkTo, PrevNextItem, SegmentedNavItem } from '../../vue/types'

// Router location types (vue-router's RouteLocationRaw members) are interfaces, which have no
// implicit index signature. `bun run typecheck` fails here if LinkTo stops accepting them.
interface RouteLike {
  name: string
  params?: Record<string, string>
}

const route: RouteLike = { name: 'project', params: { slug: 'x' } }

export const to: LinkTo = route
export const props: LinkProps = { to: route }
export const item: PrevNextItem = { title: 'Next', to: route }
export const navItem: SegmentedNavItem = { label: 'A', to: route }
