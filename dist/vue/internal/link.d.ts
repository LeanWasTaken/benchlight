import type { LinkAs, LinkCurrent, LinkTo } from '../types.js';
export declare function resolveTag(as: LinkAs | undefined, to: LinkTo | undefined, href: string | undefined, fallback: string): LinkAs;
export declare function linkBindings(as: LinkAs, to?: LinkTo, href?: string): Record<string, unknown>;
export declare function currentValue(current: LinkCurrent | undefined): string | undefined;
