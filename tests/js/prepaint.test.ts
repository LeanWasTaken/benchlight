import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const code = readFileSync(join(process.cwd(), 'js/prepaint.js'), 'utf8')
const run = () => new Function(code)()
const stamped = () => document.documentElement.getAttribute('data-bl-appearance')

describe('js/prepaint.js', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-bl-appearance')
  })
  afterEach(() => vi.restoreAllMocks())

  it('stamps a saved dark choice', () => {
    localStorage.setItem('bl-appearance', 'dark')
    run()
    expect(stamped()).toBe('dark')
  })

  it('stamps a saved light choice', () => {
    localStorage.setItem('bl-appearance', 'light')
    run()
    expect(stamped()).toBe('light')
  })

  it('leaves auto unstamped', () => {
    localStorage.setItem('bl-appearance', 'auto')
    run()
    expect(stamped()).toBeNull()
  })

  it('ignores junk and the pre-Benchlight key', () => {
    localStorage.setItem('bl-appearance', 'blue')
    localStorage.setItem('appearance', 'dark')
    run()
    expect(stamped()).toBeNull()
  })

  it('survives storage that throws', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(run).not.toThrow()
    expect(stamped()).toBeNull()
  })

  it('stays small enough to inline in every page head', () => {
    expect(Buffer.byteLength(code.trim())).toBeLessThanOrEqual(256)
  })
})
