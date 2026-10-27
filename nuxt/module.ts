import { addComponentsDir, addImports, createResolver, defineNuxtModule } from '@nuxt/kit'
import { PREPAINT } from '../js/prepaint-script.mjs'

export interface ModuleOptions {
  /** add css/fonts.css (self-hosted Geist, Geist Mono, Bricolage Grotesque) */
  fonts: boolean
  /**
   * auto-import the composables and helpers as `useBlToast`, `useBlAppearance`, `blRiseDelay`, ...;
   * components stay auto-imported. `false` turns them off, `{ prefix }` renames them
   * (default `'Bl'`; `''` keeps the bare names)
   */
  autoImports: boolean | { prefix?: string }
}

const AUTO_IMPORTS = [
  'useAppearance',
  'useScrollLifted',
  'useReducedMotion',
  'useMarquee',
  'useFollowScroll',
  'riseDelay',
  'ansiToSegments',
  'useToast'
] as const

/**
 * `use*` names take the prefix after `use` (`useToast` -> `useBlToast`); other names get it
 * prepended with a lower-case first letter (`riseDelay` -> `blRiseDelay`). A camel-cased prefix
 * keeps its inner capitals (`AcmeUi` -> `useAcmeUiToast`, `acmeUiRiseDelay`).
 */
export function prefixedName(name: string, prefix: string): string {
  if (!prefix) return name
  const upper = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
  if (/^use[A-Z]/.test(name)) return `use${upper(prefix)}${name.slice(3)}`
  return prefix.charAt(0).toLowerCase() + prefix.slice(1) + upper(name)
}

export default defineNuxtModule<ModuleOptions>({
  meta: { name: 'benchlight', configKey: 'benchlight', compatibility: { nuxt: '>=4.0.0' } },
  defaults: { fonts: true, autoImports: true },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    const css = [resolve('../css/index.css')]
    if (options.fonts) css.unshift(resolve('../css/fonts.css'))
    nuxt.options.css.unshift(...css)

    nuxt.options.app.head.script = [
      { innerHTML: PREPAINT, tagPosition: 'head' },
      ...(nuxt.options.app.head.script ?? [])
    ]

    addComponentsDir({ path: resolve('../vue/components'), pathPrefix: false })
    if (options.autoImports) {
      const prefix =
        typeof options.autoImports === 'object' ? (options.autoImports.prefix ?? 'Bl') : 'Bl'
      const from = resolve('../vue/index')
      addImports(AUTO_IMPORTS.map((name) => ({ name, as: prefixedName(name, prefix), from })))
    }

    nuxt.options.build.transpile.push('benchlight')
    nuxt.options.vite.optimizeDeps = {
      ...nuxt.options.vite.optimizeDeps,
      exclude: [...(nuxt.options.vite.optimizeDeps?.exclude ?? []), 'benchlight']
    }
  }
})
