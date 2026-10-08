import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const code = readFileSync(join(process.cwd(), 'js/appearance.js'), 'utf8')
const run = () => new Function(code)()
const root = document.documentElement
const radio = (value: string) =>
  document.querySelector<HTMLInputElement>(`input[name="bl-appearance"][value="${value}"]`)!

function choose(value: string): void {
  radio(value).checked = true
  radio(value).dispatchEvent(new Event('change'))
}

function scrollTo(y: number): void {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

describe('js/appearance.js', () => {
  beforeEach(() => {
    localStorage.clear()
    root.removeAttribute('data-bl-appearance')
    scrollTo(0)
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true })
    document.body.innerHTML = `
      <header class="bl-site-bar" data-bl-lift="40"></header>
      <input type="radio" name="bl-appearance" value="auto">
      <input type="radio" name="bl-appearance" value="light">
      <input type="radio" name="bl-appearance" value="dark">`
  })
  afterEach(() => vi.restoreAllMocks())

  it('checks auto when nothing is stamped', () => {
    run()
    expect(radio('auto').checked).toBe(true)
  })

  it('checks the stamped mode', () => {
    root.setAttribute('data-bl-appearance', 'dark')
    run()
    expect(radio('dark').checked).toBe(true)
  })

  it('applies and persists a choice', () => {
    run()
    choose('light')
    expect(root.getAttribute('data-bl-appearance')).toBe('light')
    expect(localStorage.getItem('bl-appearance')).toBe('light')
  })

  it('applies a choice inside a view transition when the browser has one', () => {
    const start = vi.fn((update: () => void) => {
      update()
      return { ready: Promise.resolve() }
    })
    Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true })
    try {
      run()
      choose('dark')
      expect(start).toHaveBeenCalledTimes(1)
      expect(root.getAttribute('data-bl-appearance')).toBe('dark')
    } finally {
      delete (document as unknown as { startViewTransition?: unknown }).startViewTransition
    }
  })

  it('returns to auto by removing the attribute', () => {
    root.setAttribute('data-bl-appearance', 'dark')
    run()
    choose('auto')
    expect(root.hasAttribute('data-bl-appearance')).toBe(false)
    expect(localStorage.getItem('bl-appearance')).toBe('auto')
  })

  it('keeps switching when storage throws', () => {
    const errors: unknown[] = []
    const onError = (event: Event): void => {
      errors.push(event)
    }
    window.addEventListener('error', onError)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    run()
    choose('dark')
    expect(root.getAttribute('data-bl-appearance')).toBe('dark')
    choose('light')
    expect(root.getAttribute('data-bl-appearance')).toBe('light')
    window.removeEventListener('error', onError)
    expect(setItem).toHaveBeenCalled()
    expect(errors).toEqual([])
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('lifts [data-bl-lift] past its threshold and drops it back', () => {
    run()
    const header = document.querySelector('header')!
    scrollTo(30)
    expect(header.hasAttribute('data-lifted')).toBe(false)
    scrollTo(40)
    expect(header.hasAttribute('data-lifted')).toBe(false)
    scrollTo(41)
    expect(header.hasAttribute('data-lifted')).toBe(true)
    scrollTo(10)
    expect(header.hasAttribute('data-lifted')).toBe(false)
  })

  it('defaults the lift threshold to 24px', () => {
    const header = document.querySelector('header')!
    header.setAttribute('data-bl-lift', '')
    run()
    scrollTo(24)
    expect(header.hasAttribute('data-lifted')).toBe(false)
    scrollTo(25)
    expect(header.hasAttribute('data-lifted')).toBe(true)
  })

  it('lifts immediately when already scrolled before init', () => {
    scrollTo(100)
    run()
    expect(document.querySelector('header')!.hasAttribute('data-lifted')).toBe(true)
  })
})
