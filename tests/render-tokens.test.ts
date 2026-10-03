// @vitest-environment node
import { compile } from '@tailwindcss/node'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderTailwindTheme, renderTokensCss, staticVars } from '../scripts/lib/render-tokens'
import { tokens } from '../tokens/tokens'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('renderTokensCss', () => {
  const css = renderTokensCss(tokens)

  it('declares the layer order before anything else', () => {
    expect(css).toMatch(/^\/\* GENERATED[^\n]*\*\/\n\n@layer theme, base, components, utilities;\n/)
  })

  it('puts light colours and every static token on :root', () => {
    expect(css).toContain('    --bl-canvas: #eff1f3;')
    expect(css).toContain('    --bl-text-micro: 0.6875rem;')
    expect(css).toContain('    --bl-ease-out: cubic-bezier(0.32, 0.72, 0, 1);')
  })

  it('follows the OS unless the user saved light', () => {
    expect(css).toContain('  @media (prefers-color-scheme: dark) {')
    expect(css).toContain("    :root:not([data-bl-appearance='light']) {")
  })

  it('forces dark when the user saved dark', () => {
    expect(css).toContain("  :root[data-bl-appearance='dark'] {")
  })

  it('emits dark colours twice and static tokens once', () => {
    expect(css.match(/--bl-canvas: #101214;/g)).toHaveLength(2)
    expect(css.match(/--bl-ease-out:/g)).toHaveLength(1)
  })

  it('names static tokens by group', () => {
    const names = staticVars(tokens).map(([name]) => name)
    expect(names).toContain('--bl-font-sans-features')
    expect(names).toContain('--bl-layout-gutter-narrow')
    expect(names).not.toContain('--bl-breakpoint-sm')
  })
})

describe('generated files are fresh', () => {
  it('css/tokens.css', () => expect(read('css/tokens.css')).toBe(renderTokensCss(tokens)))
  it('tailwind/theme.css', () =>
    expect(read('tailwind/theme.css')).toBe(renderTailwindTheme(tokens)))
})

describe('renderTailwindTheme', () => {
  it('carries the sans feature settings into the theme', () => {
    expect(renderTailwindTheme(tokens)).toContain(
      '  --font-sans--font-feature-settings: var(--bl-font-sans-features);'
    )
  })
})

describe('Tailwind v4 theme', () => {
  it('maps tokens onto utilities that follow the appearance switch', async () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const compiler = await compile(`@import 'tailwindcss';\n@import './tailwind/theme.css';`, {
      base: root,
      onDependency: () => {}
    })
    const css = compiler.build([
      'bg-canvas',
      'text-ink-2',
      'font-display',
      'text-annotation',
      'max-w-column',
      'rounded-card',
      'ease-out',
      'shadow-float',
      'tracking-silkscreen'
    ])
    const rule = (selector: string) => new RegExp(`\\.${selector}\\s*\\{[^}]*var\\(--bl-`, 's')
    for (const selector of [
      'bg-canvas',
      'text-ink-2',
      'font-display',
      'text-annotation',
      'max-w-column',
      'rounded-card',
      'ease-out',
      'shadow-float',
      'tracking-silkscreen'
    ]) {
      expect(css).toMatch(rule(selector))
    }
    expect(css).toContain('var(--bl-canvas)')
    expect(css).toContain('var(--bl-ease-out)')
  })

  it('keeps the sans feature settings through preflight', async () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const compiler = await compile(`@import 'tailwindcss';\n@import './tailwind/theme.css';`, {
      base: root,
      onDependency: () => {}
    })
    const css = compiler.build(['font-sans'])
    expect(css).toMatch(/--default-font-feature-settings:[^;]*var\(--bl-font-sans-features\)/)
    expect(css).toContain('--bl-font-sans-features')
  })
})
