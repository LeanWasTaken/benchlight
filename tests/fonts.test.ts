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
  unicodes?: string
  features?: string[]
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

  it('cover every non-ASCII character the library renders (§ © – ’ …)', () => {
    const covers = (unicodes: string, cp: number) =>
      unicodes.split(',').some((range) => {
        const [lo, hi = lo] = range.replace(/U\+/g, '').split('-')
        return cp >= parseInt(lo!, 16) && cp <= parseInt(hi!, 16)
      })
    for (const { file, unicodes } of subset.filter((f) => f.file.startsWith('geist'))) {
      for (const ch of ['§', '©', '–', '’', '…', '—', '·', '°', '−'])
        expect(covers(unicodes ?? '', ch.codePointAt(0)!), `${file} ${ch}`).toBe(true)
    }
  })

  it('scripts/subset-fonts.sh requests the same text range as the manifest', () => {
    const script = readFileSync(path('scripts/subset-fonts.sh'), 'utf8')
    const text = /^TEXT='([^']+)'/m.exec(script)![1]
    for (const { file, unicodes } of subset.filter((f) => f.file.startsWith('geist')))
      expect(unicodes, file).toBe(text)
  })

  it('scripts/subset-fonts.sh keeps exactly the layout features the manifest records', () => {
    const script = readFileSync(path('scripts/subset-fonts.sh'), 'utf8')
    const byOutput = new Map<string, string>()
    for (const m of script.matchAll(
      /pyftsubset fonts\/full\/([\w-]+)-latin\.woff2[\s\S]*?--layout-features=(\S+)/g
    ))
      byOutput.set(`${m[1]}.woff2`, m[2]!)
    expect(byOutput.size).toBe(subset.length)
    for (const { file, features } of subset) {
      expect(features, `${file} features`).toBeTruthy()
      expect(byOutput.get(file)!.split(',').sort(), file).toEqual([...features!].sort())
    }
    expect(subset.find((f) => f.file === 'geist.woff2')!.features).toContain('kern')
  })

  it('stay compact (≤ 23,552 bytes total)', () => {
    const total = subset.reduce(
      (sum, { file }) => sum + statSync(path(`fonts/subset/${file}`)).size,
      0
    )
    expect(total).toBeLessThanOrEqual(23_552)
  })
})

describe('licences', () => {
  it.each(['fonts/OFL-geist.txt', 'fonts/OFL-bricolage.txt'])('%s ships', (file) => {
    expect(existsSync(path(file))).toBe(true)
    expect(readFileSync(path(file), 'utf8')).toContain('SIL OPEN FONT LICENSE')
  })
})
