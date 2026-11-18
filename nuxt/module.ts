import { addComponent, addImports, createResolver, defineNuxtModule } from '@nuxt/kit'
import COMPONENTS from '../dist/vue/components.json'
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
  /**
   * inject the inline no-flash appearance script into `<head>` (default `true`). Turn it off under
   * a nonce-based CSP and inline `PREPAINT` (from `benchlight/js/prepaint-script.mjs`) yourself
   */
  prepaint?: boolean
}

const AUTO_IMPORTS = [
  'useAppearance',
  'useScrollLifted',
  'useReducedMotion',
  'useMarquee',
  'useFollowScroll',
  'useActiveSection',
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
  defaults: { fonts: true, autoImports: true, prepaint: true },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    // This file runs from nuxt/ in the repo and, compiled, from dist/nuxt/ in the package.
    const root = import.meta.url.includes('/dist/nuxt/') ? '../..' : '..'

    const css = [resolve(`${root}/css/index.css`)]
    if (options.fonts) css.unshift(resolve(`${root}/css/fonts.css`))
    nuxt.options.css.unshift(...css)

    if (options.prepaint !== false) {
      nuxt.options.app.head.script = [
        { innerHTML: PREPAINT, tagPosition: 'head' },
        ...(nuxt.options.app.head.script ?? [])
      ]
    }

    // Registered one by one: Nuxt's directory scan would name `BlButton.vue.js` `BlButtonVue`.
    for (const name of COMPONENTS) {
      addComponent({ name, filePath: resolve(`${root}/dist/vue/components/${name}.vue.js`) })
    }
    if (options.autoImports) {
      const prefix =
        typeof options.autoImports === 'object' ? (options.autoImports.prefix ?? 'Bl') : 'Bl'
      const from = resolve(`${root}/dist/vue/index.js`)
      addImports(AUTO_IMPORTS.map((name) => ({ name, as: prefixedName(name, prefix), from })))
    }

    nuxt.options.build.transpile.push('benchlight')
    nuxt.options.vite.optimizeDeps = {
      ...nuxt.options.vite.optimizeDeps,
      exclude: [...(nuxt.options.vite.optimizeDeps?.exclude ?? []), 'benchlight']
    }
    // lightningcss would lower `:dir()` to `:lang()` for low CSS targets, which ignores `dir="rtl"`.
    // 4 is lightningcss `Features.DirSelector`; tests/integrations/vite.test.ts pins the value.
    nuxt.options.vite.css = {
      ...nuxt.options.vite.css,
      lightningcss: {
        ...nuxt.options.vite.css?.lightningcss,
        exclude: (nuxt.options.vite.css?.lightningcss?.exclude ?? 0) | 4
      }
    }
  }
})
