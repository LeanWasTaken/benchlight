// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  buildDist,
  buildModules,
  inlinableVars,
  inlineStaticTokens,
  minifyCss
} from '../scripts/lib/bundle'
import { MODULES } from '../scripts/lib/modules'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const dist = buildDist(ROOT)
const LAYERS = '@layer theme,base,components,utilities;'

describe('inlineStaticTokens', () => {
  it('substitutes short literals and drops their declaration', () => {
    const css =
      ':root {\n    --kd-text-micro: 0.6875rem;\n}\n.a { font-size: var(--kd-text-micro); }'
    const out = inlineStaticTokens(css, [['--kd-text-micro', '0.6875rem']])
    expect(out).toContain('font-size: 0.6875rem;')
    expect(out).not.toContain('--kd-text-micro')
  })

  it('removes a redeclared static token declaration everywhere', () => {
    const css =
      ':root {\n  --kd-text-micro: 0.6875rem;\n}\n@media (min-width: 1px) {\n  :root {\n    --kd-text-micro: 1rem;\n  }\n}\n.a { font-size: var(--kd-text-micro); }'
    const out = inlineStaticTokens(css, [['--kd-text-micro', '0.6875rem']])
    expect(out).not.toContain('--kd-text-micro')
    expect(out).toContain('font-size: 0.6875rem;')
  })

  it('throws when the token is used with a fallback', () => {
    expect(() =>
      inlineStaticTokens('.a { font-size: var(--kd-text-micro, 1px); }', [
        ['--kd-text-micro', '0.6875rem']
      ])
    ).toThrow('--kd-text-micro is used with a fallback and cannot be inlined')
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

describe('buildDist', () => {
  it('is fresh on disk', () => {
    expect(read('dist/kdesign.min.css')).toBe(dist.bundle)
    expect(read('dist/fonts.min.css')).toBe(dist.fonts)
    for (const [name, css] of Object.entries(dist.modules)) {
      expect(read(`dist/modules/${name}.min.css`)).toBe(css)
    }
  })

  it('emits one file per module', () => {
    expect(Object.keys(dist.modules)).toEqual(Object.keys(MODULES))
  })

  it('declares the layer order first', () => {
    expect(dist.bundle.startsWith(LAYERS)).toBe(true)
    expect(dist.modules.tokens!.startsWith(LAYERS)).toBe(true)
  })

  it('keeps every token as a variable, so it is interchangeable with the source CSS', () => {
    expect(dist.bundle).toContain('--kd-text-micro:')
    expect(dist.bundle).toContain('var(--kd-text-micro)')
  })

  it('has six local font faces and nothing remote', () => {
    expect(dist.fonts.match(/@font-face/g)).toHaveLength(6)
    expect(dist.fonts).not.toContain('http')
  })

  it('stays within the 25600-byte guard', () => {
    expect(Buffer.byteLength(read('dist/kdesign.min.css'))).toBeLessThanOrEqual(25_600)
  })
})

describe('custom build', () => {
  const set = ['tokens', 'base', 'type', 'btn'] as const
  const inlined = buildModules(set, ROOT, { inlineStatic: true }).bundle
  const plain = buildModules(set, ROOT, { inlineStatic: false }).bundle

  it('is smaller with static tokens inlined', () => {
    expect(Buffer.byteLength(inlined)).toBeLessThan(Buffer.byteLength(plain))
  })

  it('inlines short static tokens and keeps long ones as variables', () => {
    expect(inlined).not.toContain('var(--kd-text-micro)')
    expect(inlined).toContain('var(--kd-font-mono)')
  })

  it('contains only the requested modules', () => {
    expect(inlined).not.toMatch(/\.kd-prose(?![\w-])/)
  })
})

describe('minifyCss', () => {
  it('keeps cascade layers', () => {
    expect(minifyCss('@layer components { .kd-x { color: red; } }', 'x.css')).toBe(
      '@layer components{.kd-x{color:red}}'
    )
  })
})
