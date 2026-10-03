// @vitest-environment node
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const path = (p: string) => new URL(`../${p}`, import.meta.url)
const sha256 = (p: string) =>
  createHash('sha256')
    .update(readFileSync(path(p)))
    .digest('hex')

interface Pinned {
  file: string
  sha256: string
}
const full: Pinned[] = JSON.parse(readFileSync(path('fonts/full/manifest.json'), 'utf8'))
const subset: Pinned[] = JSON.parse(readFileSync(path('fonts/subset/manifest.json'), 'utf8'))

describe('full fonts', () => {
  it.each(full)('$file matches its pinned hash', ({ file, sha256: pinned }) => {
    expect(sha256(`fonts/full/${file}`)).toBe(pinned)
  })

  it('css/fonts.css serves every pinned file locally and nothing remote', () => {
    const css = readFileSync(path('css/fonts.css'), 'utf8')
    for (const { file } of full) expect(css).toContain(`url('../fonts/full/${file}')`)
    expect(css).not.toMatch(/https?:/)
    expect(css.match(/@font-face/g)).toHaveLength(full.length)
  })
})

describe('subset fonts', () => {
  it.each(subset)('$file matches its pinned hash', ({ file, sha256: pinned }) => {
    expect(sha256(`fonts/subset/${file}`)).toBe(pinned)
  })

  it('stay compact (≤ 22,528 bytes total)', () => {
    const total = subset.reduce(
      (sum, { file }) => sum + statSync(path(`fonts/subset/${file}`)).size,
      0
    )
    expect(total).toBeLessThanOrEqual(22_528)
  })
})

describe('licences', () => {
  it.each(['fonts/OFL-geist.txt', 'fonts/OFL-bricolage.txt'])('%s ships', (file) => {
    expect(existsSync(path(file))).toBe(true)
    expect(readFileSync(path(file), 'utf8')).toContain('SIL OPEN FONT LICENSE')
  })
})
