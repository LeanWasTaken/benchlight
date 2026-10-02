// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildPreset, inlinableVars, inlineStaticTokens, minifyCss } from '../scripts/lib/bundle'
import { PRESETS } from '../scripts/lib/modules'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const device = buildPreset('device', ROOT)

describe('inlineStaticTokens', () => {
  it('substitutes short literals and drops their declaration', () => {
    const css =
      ':root {\n    --kd-text-micro: 0.6875rem;\n}\n.a { font-size: var(--kd-text-micro); }'
    const out = inlineStaticTokens(css, [['--kd-text-micro', '0.6875rem']])
    expect(out).toContain('font-size: 0.6875rem;')
    expect(out).not.toContain('--kd-text-micro')
  })

  it('keeps long values (font stacks, shadows, easing) as variables', () => {
    const names = inlinableVars().map(([name]) => name)
    expect(names).toContain('--kd-text-micro')
    expect(names).toContain('--kd-radius-card')
    expect(names).not.toContain('--kd-font-mono')
    expect(names).not.toContain('--kd-ease-out')
    expect(names).not.toContain('--kd-shadow-float')
  })
})

describe('device preset', () => {
  it('is fresh on disk', () => {
    expect(read('dist/device.min.css')).toBe(device.bundle)
    for (const [name, css] of Object.entries(device.modules)) {
      expect(read(`dist/device/${name}.min.css`)).toBe(css)
    }
  })

  it('emits one file per preset module', () => {
    expect(Object.keys(device.modules)).toEqual([...PRESETS.device])
  })

  it('fits the 16,384-byte budget', () => {
    expect(Buffer.byteLength(device.bundle)).toBeLessThanOrEqual(16_384)
  })

  it('keeps colour tokens switchable and inlines short static tokens', () => {
    expect(device.bundle).toContain('--kd-canvas:#eff1f3')
    expect(device.bundle).toContain('[data-kd-appearance=dark]')
    expect(device.bundle).not.toContain('var(--kd-text-micro)')
    expect(device.bundle).toContain('var(--kd-font-mono)')
  })

  it('leaves out the components the device does not use', () => {
    for (const absent of ['prose', 'index-row', 'prev-next', 'eq', 'marquee']) {
      expect(device.bundle).not.toMatch(new RegExp(`\\.kd-${absent}(?![\\w-])`))
    }
  })

  it('declares the layer order first', () => {
    expect(device.bundle.startsWith('@layer theme,base,components,utilities;')).toBe(true)
    expect(device.modules.tokens!.startsWith('@layer theme,base,components,utilities;')).toBe(true)
  })
})

describe('minifyCss', () => {
  it('keeps cascade layers', () => {
    expect(minifyCss('@layer components { .kd-x { color: red; } }', 'x.css')).toBe(
      '@layer components{.kd-x{color:red}}'
    )
  })
})
