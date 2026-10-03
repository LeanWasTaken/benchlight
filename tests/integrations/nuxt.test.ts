// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PREPAINT } from '../../js/prepaint-script.mjs'

const kit = vi.hoisted(() => ({
  addComponentsDir: vi.fn(),
  addImports: vi.fn()
}))

vi.mock('@nuxt/kit', () => ({
  ...kit,
  createResolver: () => ({ resolve: (path: string) => `/pkg/nuxt/${path}` }),
  defineNuxtModule: <T>(definition: T) => definition
}))

interface TestNuxt {
  options: {
    css: string[]
    app: { head: { script?: Array<Record<string, unknown>> } }
    build: { transpile: string[] }
    vite: { optimizeDeps?: { exclude?: string[]; include?: string[] } }
  }
}

type Definition = {
  meta: { name: string; configKey: string }
  defaults: { fonts: boolean }
  setup: (options: { fonts: boolean }, nuxt: TestNuxt) => void
}

const load = async () => (await import('../../nuxt/module')).default as unknown as Definition

const makeNuxt = (): TestNuxt => ({
  options: {
    css: ['/app/main.css'],
    app: { head: { script: [{ src: '/existing.js' }] } },
    build: { transpile: ['other'] },
    vite: { optimizeDeps: { exclude: ['already'], include: ['kept'] } }
  }
})

describe('nuxt module', () => {
  beforeEach(() => {
    kit.addComponentsDir.mockClear()
    kit.addImports.mockClear()
  })

  it('registers under the benchlight config key with fonts on by default', async () => {
    const module = await load()
    expect(module.meta.name).toBe('benchlight')
    expect(module.meta.configKey).toBe('benchlight')
    expect(module.defaults).toEqual({ fonts: true })
  })

  it('puts fonts then the library css ahead of the app css', async () => {
    const nuxt = makeNuxt()
    ;(await load()).setup({ fonts: true }, nuxt)
    expect(nuxt.options.css).toEqual([
      '/pkg/nuxt/../css/fonts.css',
      '/pkg/nuxt/../css/index.css',
      '/app/main.css'
    ])
  })

  it('omits fonts.css when fonts is off', async () => {
    const nuxt = makeNuxt()
    ;(await load()).setup({ fonts: false }, nuxt)
    expect(nuxt.options.css).toEqual(['/pkg/nuxt/../css/index.css', '/app/main.css'])
  })

  it('prepends the prepaint script to the head scripts', async () => {
    const nuxt = makeNuxt()
    ;(await load()).setup({ fonts: true }, nuxt)
    expect(nuxt.options.app.head.script).toEqual([
      { innerHTML: PREPAINT, tagPosition: 'head' },
      { src: '/existing.js' }
    ])
  })

  it('adds the components dir without a path prefix', async () => {
    ;(await load()).setup({ fonts: true }, makeNuxt())
    expect(kit.addComponentsDir).toHaveBeenCalledWith({
      path: '/pkg/nuxt/../vue/components',
      pathPrefix: false
    })
  })

  it('auto-imports the composables and helpers from the vue entry', async () => {
    ;(await load()).setup({ fonts: true }, makeNuxt())
    const imports = kit.addImports.mock.calls[0]![0] as Array<{ name: string; from: string }>
    expect(imports.map((entry) => entry.name)).toEqual([
      'useAppearance',
      'useScrollLifted',
      'useReducedMotion',
      'useMarquee',
      'useFollowScroll',
      'riseDelay',
      'ansiToSegments'
    ])
    expect(new Set(imports.map((entry) => entry.from))).toEqual(new Set(['/pkg/nuxt/../vue/index']))
  })

  it('transpiles the package and keeps it out of vite pre-bundling', async () => {
    const nuxt = makeNuxt()
    ;(await load()).setup({ fonts: true }, nuxt)
    expect(nuxt.options.build.transpile).toEqual(['other', 'benchlight'])
    expect(nuxt.options.vite.optimizeDeps).toEqual({
      exclude: ['already', 'benchlight'],
      include: ['kept']
    })
  })

  it('creates optimizeDeps when the app has none', async () => {
    const nuxt = makeNuxt()
    nuxt.options.vite = {}
    ;(await load()).setup({ fonts: true }, nuxt)
    expect(nuxt.options.vite.optimizeDeps).toEqual({ exclude: ['benchlight'] })
  })
})
