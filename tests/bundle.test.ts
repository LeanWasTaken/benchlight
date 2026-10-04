// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  buildDist,
  buildModules,
  inlinableVars,
  missingFoundations,
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
      ':root {\n    --bl-text-micro: 0.6875rem;\n}\n.a { font-size: var(--bl-text-micro); }'
    const out = inlineStaticTokens(css, [['--bl-text-micro', '0.6875rem']])
    expect(out).toContain('font-size: 0.6875rem;')
    expect(out).not.toContain('--bl-text-micro')
  })

  it('removes a redeclared static token declaration everywhere', () => {
    const css =
      ':root {\n  --bl-text-micro: 0.6875rem;\n}\n@media (min-width: 1px) {\n  :root {\n    --bl-text-micro: 1rem;\n  }\n}\n.a { font-size: var(--bl-text-micro); }'
    const out = inlineStaticTokens(css, [['--bl-text-micro', '0.6875rem']])
    expect(out).not.toContain('--bl-text-micro')
    expect(out).toContain('font-size: 0.6875rem;')
  })

  it('throws when the token is used with a fallback', () => {
    expect(() =>
      inlineStaticTokens('.a { font-size: var(--bl-text-micro, 1px); }', [
        ['--bl-text-micro', '0.6875rem']
      ])
    ).toThrow('--bl-text-micro is used with a fallback and cannot be inlined')
  })

  it('keeps long values (font stacks, shadows, easing) as variables', () => {
    const names = inlinableVars().map(([name]) => name)
    expect(names).toContain('--bl-text-micro')
    expect(names).toContain('--bl-radius-card')
    expect(names).not.toContain('--bl-font-mono')
    expect(names).not.toContain('--bl-ease-out')
    expect(names).not.toContain('--bl-shadow-float')
  })
})

describe('buildDist', () => {
  it('is fresh on disk', () => {
    expect(read('dist/benchlight.min.css')).toBe(dist.bundle)
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
    expect(dist.bundle).toContain('--bl-text-micro:')
    expect(dist.bundle).toContain('var(--bl-text-micro)')
  })

  it('has six local font faces and nothing remote', () => {
    expect(dist.fonts.match(/@font-face/g)).toHaveLength(6)
    expect(dist.fonts).not.toContain('http')
  })

  it('keeps media queries readable by the source browser floor', () => {
    expect(dist.bundle).toContain('max-width:480px')
    expect(dist.bundle).not.toMatch(/width[<>]=/)
  })

  it('keeps hand-written vendor prefixes without adding duplicates', () => {
    const count = (re: RegExp) => dist.bundle.match(re)?.length ?? 0
    const prefixed = count(/-webkit-mask:/g)
    expect(prefixed).toBeGreaterThan(0)
    expect(prefixed).toBe(count(/(?<!-webkit-)mask:/g))
    expect(count(/-webkit-font-smoothing:/g)).toBeGreaterThan(0)
  })

  it('stays within the 30720-byte guard', () => {
    expect(Buffer.byteLength(read('dist/benchlight.min.css'))).toBeLessThanOrEqual(30_720)
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
    expect(inlined).not.toContain('var(--bl-text-micro)')
    expect(inlined).toContain('var(--bl-font-mono)')
  })

  it('contains only the requested modules', () => {
    expect(inlined).not.toMatch(/\.bl-prose(?![\w-])/)
  })
})

describe('minifyCss', () => {
  it('keeps cascade layers', () => {
    expect(minifyCss('@layer components { .bl-x { color: red; } }', 'x.css')).toBe(
      '@layer components{.bl-x{color:red}}'
    )
  })
})

describe('missingFoundations', () => {
  const warn = (names: string[]) => missingFoundations(names as never, ROOT)

  it('is silent for the full set and for a self-sufficient one', () => {
    expect(warn(Object.keys(MODULES))).toEqual([])
    expect(warn(['tokens', 'base', 'type', 'field', 'eq'])).toEqual([])
  })

  it('names type for components that speak in its voices', () => {
    const messages = warn(['tokens', 'base', 'field', 'meta', 'link-arrow'])
    expect(messages).toHaveLength(3)
    for (const name of ['field', 'meta', 'link-arrow']) {
      expect(messages.join('\n')).toContain(`${name} needs type`)
    }
  })

  it('names base for animated modules without their own reduced-motion rule', () => {
    const messages = warn(['tokens', 'type', 'eq', 'motion', 'meter'])
    expect(messages.join('\n')).toContain('eq needs base')
    expect(messages.join('\n')).toContain('motion needs base')
    expect(messages.join('\n')).not.toContain('meter')
  })

  it('does not ask for modules that are not needed', () => {
    expect(warn(['tokens', 'btn', 'led'])).toEqual([])
  })
})

describe('bundle CLI', () => {
  it('builds but warns on stderr when foundations are missing', () => {
    const out = join(tmpdir(), `bl-bundle-${process.pid}.css`)
    const result = spawnSync(
      'bun',
      ['scripts/bundle.ts', '--modules', 'tokens,field,eq', '--out', out],
      { cwd: ROOT, encoding: 'utf8' }
    )
    rmSync(out, { force: true })
    expect(result.status).toBe(0)
    expect(result.stderr).toContain('field needs type')
    expect(result.stderr).toContain('eq needs base')
  })
})
