// @vitest-environment node
import { Features } from 'lightningcss'
import { describe, expect, it } from 'vitest'
import { benchlight } from '../../vite/index.js'
import { PREPAINT } from '../../js/prepaint-script.mjs'

describe('vite plugin', () => {
  const plugin = benchlight()

  it('is named benchlight', () => {
    expect(plugin.name).toBe('benchlight')
  })

  it('keeps the package out of dependency pre-bundling', () => {
    const config = (plugin.config as (user: object) => { optimizeDeps: { exclude: string[] } })({})
    expect(config.optimizeDeps.exclude).toEqual(['benchlight'])
  })

  it('keeps lightningcss from lowering :dir(), preserving a user exclude', () => {
    const config = plugin.config as (user: object) => {
      css: { lightningcss: { exclude: number } }
    }
    expect(config({}).css.lightningcss.exclude).toBe(4)
    expect(config({ css: { lightningcss: { exclude: 8 } } }).css.lightningcss.exclude).toBe(12)
  })

  it('hardcodes the lightningcss DirSelector flag', () => {
    expect(Features.DirSelector).toBe(4)
  })

  it('injects the prepaint script first in <head>', () => {
    const tags = (plugin.transformIndexHtml as () => unknown[])()
    expect(tags).toEqual([{ tag: 'script', children: PREPAINT, injectTo: 'head-prepend' }])
    expect(PREPAINT.length).toBeGreaterThan(0)
  })

  it('injects nothing with prepaint: false', () => {
    const tags = (benchlight({ prepaint: false }).transformIndexHtml as () => unknown[])()
    expect(tags).toEqual([])
  })
})
