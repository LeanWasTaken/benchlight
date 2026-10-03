// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { barrelExports, autoImports, renderApi } from '../scripts/lib/api'

const ROOT = process.cwd()

describe('API.md', () => {
  it('is fresh: run `bun run gen:api` and review the diff as the breaking-change checklist', () => {
    expect(readFileSync(join(ROOT, 'API.md'), 'utf8')).toBe(renderApi(ROOT))
  }, 120_000)
})

describe('Nuxt auto-imports', () => {
  it('cover every runtime helper the barrel exports', () => {
    const helpers = barrelExports(ROOT).filter(
      (name) => !name.startsWith('Bl') && name !== name.toUpperCase()
    )
    expect(autoImports(ROOT).sort()).toEqual(helpers.sort())
  })
})
