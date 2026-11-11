/**
 * Reads a CSS time value (`150ms`, `0.15s`, `.15s`) as milliseconds. A minifier may rewrite a
 * token from one unit to the other, so a bare parseFloat would read `.15s` as 0.15ms. Anything
 * unreadable gives the fallback.
 */
export declare function cssTime(raw: string | null | undefined, fallback: number): number;
