import { addComponentsDir, addImports, createResolver, defineNuxtModule } from '@nuxt/kit'
import { PREPAINT } from '../js/prepaint-script.mjs'

export interface ModuleOptions {
  /** add css/fonts.css (self-hosted Geist, Geist Mono, Bricolage Grotesque) */
  fonts: boolean
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

export default defineNuxtModule<ModuleOptions>({
  meta: { name: 'benchlight', configKey: 'benchlight', compatibility: { nuxt: '>=4.0.0' } },
  defaults: { fonts: true },
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
    addImports(AUTO_IMPORTS.map((name) => ({ name, from: resolve('../vue/index') })))

    nuxt.options.build.transpile.push('benchlight')
    nuxt.options.vite.optimizeDeps = {
      ...nuxt.options.vite.optimizeDeps,
      exclude: [...(nuxt.options.vite.optimizeDeps?.exclude ?? []), 'benchlight']
    }
  }
})
