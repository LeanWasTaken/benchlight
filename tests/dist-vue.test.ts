import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const read = (path: string) =>
  readFileSync(join(import.meta.dirname, '..', 'dist', 'vue', path), 'utf8')

describe('compiled vue build', () => {
  it('leaves the dev switch to the consumer bundler', () => {
    const dev = read('internal/dev.js')
    expect(dev).toContain('process.env.NODE_ENV')
    expect(dev).not.toMatch(/isDev\s*=\s*(Boolean\()?(false|true)/)
  })

  it('keeps vue external', () => {
    expect(read('index.js')).not.toMatch(/from\s+['"]vue['"]/)
    expect(read('components/BlButton.vue.js')).toMatch(/from\s+["']vue["']/)
  })

  describe('dev warnings follow process.env.NODE_ENV at run time', () => {
    const distIndex = join(import.meta.dirname, '..', 'dist', 'vue', 'index.js')
    // BlMeter warns once when `value` is outside 0 to 1.
    const mountMeter = async () => {
      const { BlMeter } = await import(/* @vite-ignore */ distIndex)
      mount(BlMeter, { props: { label: 'Load', value: 75 } })
    }

    afterEach(() => {
      vi.unstubAllEnvs()
      vi.restoreAllMocks()
      vi.resetModules()
    })

    it('warns outside production', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      vi.resetModules()
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await mountMeter()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[benchlight] BlMeter'))
    })

    it('stays silent in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.resetModules()
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await mountMeter()
      expect(warn).not.toHaveBeenCalled()
    })
  })
})

describe('compiled nuxt module', () => {
  const mjs = read('../nuxt/module.mjs')
  const dts = read('../nuxt/module.d.mts')

  it('inlines the component list and needs no node: builtins', () => {
    expect(mjs).not.toMatch(/^import .*\.json/m)
    expect(mjs).toContain('BlButton')
    expect(mjs).not.toMatch(/['"]node:/)
  })

  it('declares its types without touching source or generated files', () => {
    expect(dts).toContain('ModuleOptions')
    expect(dts).not.toMatch(/components\.json|\.\.\/(js|dist)\//)
  })

  it('resolves package files from dist/nuxt', () => {
    expect(mjs).toContain('"/dist/nuxt/"')
  })
})
