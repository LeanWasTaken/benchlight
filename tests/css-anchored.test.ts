import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('dist/modules/anchored.min.css', 'utf8')

/** Returns the text of every top-level `@supports ... { }` block. */
function supportsBlocks(source: string): string[] {
  const blocks: string[] = []
  let from = 0
  for (;;) {
    const start = source.indexOf('@supports', from)
    if (start === -1) return blocks
    const open = source.indexOf('{', start)
    let depth = 1
    let i = open + 1
    while (i < source.length && depth > 0) {
      if (source[i] === '{') depth++
      else if (source[i] === '}') depth--
      i++
    }
    blocks.push(source.slice(start, i))
    from = i
  }
}

describe('anchored module', () => {
  it('keeps anchor positioning through minification', () => {
    expect(css).toContain('position-area')
    expect(css).toContain('position-try-fallbacks')
    expect(css).toMatch(/@supports\s*\(position-area:\s*top\)/)
  })

  it('has no position-area outside the @supports block', () => {
    let rest = css
    for (const block of supportsBlocks(css)) rest = rest.replace(block, '')
    expect(rest).not.toContain('position-area')
    expect(rest).not.toContain('position-try-fallbacks')
  })

  it('applies the gap above the margin reset', () => {
    const body = supportsBlocks(css)[0] ?? ''
    const inner = body.slice(body.indexOf('{') + 1, body.lastIndexOf('}'))
    const rules = [...inner.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
      selector: (m[1] ?? '').trim(),
      decls: m[2] ?? ''
    }))
    // Specificity of attribute/class/pseudo-class parts; :where() contributes nothing.
    const weight = (selector: string) => {
      const flat = selector.replace(/:where\([^)]*(?:\([^)]*\))*[^)]*\)/g, '')
      return (flat.match(/\[|\.|:(?!:)/g) ?? []).length
    }
    const resets = rules.filter((r) => /(^|;)margin:0(;|$)/.test(r.decls))
    const gaps = rules.filter((r) => r.decls.includes('--bl-anchored-gap'))
    expect(resets.length).toBeGreaterThan(0)
    expect(gaps).toHaveLength(4)
    for (const reset of resets) {
      for (const gap of gaps) {
        expect(Math.max(...reset.selector.split(',').map(weight))).toBeLessThanOrEqual(
          Math.min(...gap.selector.split(',').map(weight))
        )
      }
    }
  })
})
