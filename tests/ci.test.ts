// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('CI browser job', () => {
  it('runs the Playwright image matching the installed @playwright/test', () => {
    const { version } = JSON.parse(read('node_modules/@playwright/test/package.json')) as {
      version: string
    }
    expect(read('.github/workflows/ci.yml')).toContain(
      `image: mcr.microsoft.com/playwright:v${version}-noble`
    )
  })
})
