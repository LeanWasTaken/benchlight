// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { benchlight } from '../../vite/index.js'
import { PREPAINT } from '../../js/prepaint-script.mjs'

describe('vite plugin', () => {
  const plugin = benchlight()

  it('is named benchlight', () => {
    expect(plugin.name).toBe('benchlight')
  })

  it('keeps the package out of dependency pre-bundling', () => {
    const config = (plugin.config as () => { optimizeDeps: { exclude: string[] } })()
    expect(config.optimizeDeps.exclude).toEqual(['benchlight'])
  })

  it('injects the prepaint script first in <head>', () => {
    const tags = (plugin.transformIndexHtml as () => unknown[])()
    expect(tags).toEqual([{ tag: 'script', children: PREPAINT, injectTo: 'head-prepend' }])
    expect(PREPAINT.length).toBeGreaterThan(0)
  })
})
