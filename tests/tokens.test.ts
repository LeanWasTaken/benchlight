// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { tokensDeclaration } from '../scripts/lib/tokens-dts'
import { colorNames, tokens } from '../tokens/tokens'

describe('tokens', () => {
  it('defines every colour in both themes as lowercase 6-digit hex', () => {
    for (const theme of ['light', 'dark'] as const) {
      expect(Object.keys(tokens.color[theme]).sort()).toEqual([...colorNames].sort())
      for (const value of Object.values(tokens.color[theme]))
        expect(value).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('keeps the Benchlight colour values and adds danger and the on-colours', () => {
    expect(tokens.color.light).toEqual({
      canvas: '#eff1f3',
      surface: '#f8f9fa',
      raised: '#ffffff',
      separator: '#d9dde1',
      'control-border': '#7f858c',
      'ink-1': '#1a1d21',
      'ink-2': '#4e555d',
      'ink-3': '#646c75',
      trace: '#2151cc',
      copper: '#a6512a',
      phosphor: '#1f7a46',
      danger: '#a42d37',
      'on-trace': '#ffffff',
      'on-danger': '#ffffff'
    })
    expect(tokens.color.dark).toEqual({
      canvas: '#101214',
      surface: '#16191c',
      raised: '#1c2024',
      separator: '#2a2f35',
      'control-border': '#69707a',
      'ink-1': '#e8eaed',
      'ink-2': '#a2a9b0',
      'ink-3': '#8a929b',
      trace: '#97b1ff',
      copper: '#e8936a',
      phosphor: '#7bd9a2',
      danger: '#ff9098',
      'on-trace': '#101214',
      'on-danger': '#101214'
    })
  })

  it('names the type scale', () => {
    expect(tokens.text).toEqual({
      micro: '0.6875rem',
      annotation: '0.8125rem',
      small: '0.9375rem',
      body: '1.0625rem',
      heading: '1.25rem',
      'display-xl': 'clamp(2.5rem, 1rem + 7vw, 6rem)',
      'display-lg': 'clamp(1.875rem, 0.75rem + 5vw, 3.375rem)',
      'display-md': 'clamp(1.875rem, 4.5vw, 2.5rem)'
    })
  })

  it('carries shape, layout and motion', () => {
    expect(tokens.radius).toEqual({ chip: '6px', card: '12px', pill: '9999px' })
    expect(tokens.layout.column).toBe('1080px')
    expect(tokens.layout.prose).toBe('720px')
    expect(tokens.ease.out).toBe('cubic-bezier(0.32, 0.72, 0, 1)')
    expect(tokens.duration.rise).toBe('500ms')
  })

  it('ships a compiled dist/tokens.js identical to the source', async () => {
    const compiled = await import('../dist/tokens.js')
    expect(compiled.tokens).toEqual(tokens)
    expect(compiled.colorNames).toEqual(colorNames)
  })

  it('ships a fresh dist/tokens.d.ts declaring what tokens/index.ts exports', () => {
    const dts = readFileSync(new URL('../dist/tokens.d.ts', import.meta.url), 'utf8')
    expect(dts).toBe(tokensDeclaration(fileURLToPath(new URL('..', import.meta.url))))
    const index = readFileSync(new URL('../tokens/index.ts', import.meta.url), 'utf8')
    const reexported = [...index.matchAll(/\{([^}]*)\} from '\.\/tokens'/g)].flatMap((m) =>
      m[1]!.split(',').map((name) => name.trim())
    )
    const declared = [...dts.matchAll(/^export (?:declare const|type) (\w+)/gm)].map((m) => m[1])
    expect(declared.sort()).toEqual(reexported.sort())
  })
})
