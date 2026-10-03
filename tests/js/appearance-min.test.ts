import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
const minified = read('dist/appearance.min.js')

describe('dist/appearance.min.js', () => {
  it('is fresh on disk', () => {
    const built = execFileSync('bun', ['build', 'js/appearance.js', '--minify'], {
      cwd: process.cwd(),
      encoding: 'utf8'
    })
    expect(minified).toBe(built)
  })

  it('is smaller than the source', () => {
    expect(Buffer.byteLength(minified)).toBeLessThan(Buffer.byteLength(read('js/appearance.js')))
  })

  describe('behaviour', () => {
    beforeEach(() => {
      localStorage.clear()
      document.documentElement.removeAttribute('data-bl-appearance')
      Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true })
      document.body.innerHTML = `
        <input type="radio" name="bl-appearance" value="auto">
        <input type="radio" name="bl-appearance" value="dark">`
    })

    it('wires the appearance switch and persists the choice', () => {
      new Function(minified)()
      const dark = document.querySelector<HTMLInputElement>('input[value="dark"]')!
      dark.checked = true
      dark.dispatchEvent(new Event('change'))
      expect(document.documentElement.getAttribute('data-bl-appearance')).toBe('dark')
      expect(localStorage.getItem('bl-appearance')).toBe('dark')
    })
  })
})
