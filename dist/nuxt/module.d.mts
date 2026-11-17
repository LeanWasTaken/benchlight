export interface ModuleOptions {
    /** add css/fonts.css (self-hosted Geist, Geist Mono, Bricolage Grotesque) */
    fonts: boolean;
    /**
     * auto-import the composables and helpers as `useBlToast`, `useBlAppearance`, `blRiseDelay`, ...;
     * components stay auto-imported. `false` turns them off, `{ prefix }` renames them
     * (default `'Bl'`; `''` keeps the bare names)
     */
    autoImports: boolean | {
        prefix?: string;
    };
    /**
     * inject the inline no-flash appearance script into `<head>` (default `true`). Turn it off under
     * a nonce-based CSP and inline `PREPAINT` (from `benchlight/js/prepaint-script.mjs`) yourself
     */
    prepaint?: boolean;
}
/**
 * `use*` names take the prefix after `use` (`useToast` -> `useBlToast`); other names get it
 * prepended with a lower-case first letter (`riseDelay` -> `blRiseDelay`). A camel-cased prefix
 * keeps its inner capitals (`AcmeUi` -> `useAcmeUiToast`, `acmeUiRiseDelay`).
 */
export declare function prefixedName(name: string, prefix: string): string;
declare const _default: import("@nuxt/schema").NuxtModule<ModuleOptions, ModuleOptions, false>;
export default _default;
