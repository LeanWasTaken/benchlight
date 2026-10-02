import { readFileSync } from 'node:fs'
import { addComponentsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: { name: 'kdesign', configKey: 'kdesign' },
  setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    nuxt.options.css.unshift(resolve('../css/index.css'))
    const prepaint = readFileSync(resolve('../js/prepaint.js'), 'utf8').trim()
    nuxt.options.app.head.script = [
      { innerHTML: prepaint, tagPosition: 'head' },
      ...(nuxt.options.app.head.script ?? [])
    ]
    addComponentsDir({ path: resolve('../vue/components'), pathPrefix: false })
    nuxt.options.build.transpile.push('kdesign')
    nuxt.options.vite.optimizeDeps = {
      ...nuxt.options.vite.optimizeDeps,
      exclude: [...(nuxt.options.vite.optimizeDeps?.exclude ?? []), 'kdesign']
    }
  }
})
