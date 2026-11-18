import { afterEach, describe, expect, it, vi } from 'vitest'
import { playExit } from '../../vue/internal/exit'
import { mockTransition, transitionEnd } from './transitions'

let nodes: Element[] = []
function box() {
  const el = document.createElement('div')
  document.body.append(el)
  nodes.push(el)
  return el
}
afterEach(() => {
  nodes.forEach((n) => n.remove())
  nodes = []
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('playExit', () => {
  it('finishes at once when nothing transitions, with data-closing set during done', () => {
    const el = box()
    const during = vi.fn(() => el.hasAttribute('data-closing'))
    const cancel = playExit(el, during)
    expect(during).toHaveReturnedWith(true)
    expect(el.hasAttribute('data-closing')).toBe(false)
    cancel() // a no-op once over
    expect(during).toHaveBeenCalledOnce()
  })

  it('finishes at once for a disconnected element or a reduced-motion duration', () => {
    const loose = document.createElement('div')
    mockTransition([loose, { property: 'opacity', duration: '0.2s' }])
    const done = vi.fn()
    playExit(loose, done)
    expect(done).toHaveBeenCalledOnce()
    vi.restoreAllMocks()
    const el = box()
    mockTransition([el, { property: 'opacity', duration: '0.01ms' }])
    const quick = vi.fn()
    playExit(el, quick)
    expect(quick).toHaveBeenCalledOnce()
  })

  it('waits for transitionend of the longest property on the target', () => {
    const el = box()
    const target = document.createElement('span')
    el.append(target)
    mockTransition([
      target,
      { property: 'opacity, scale, display', duration: '0.2s, .3s, 1s', delay: '0s' }
    ])
    const done = vi.fn()
    playExit(el, done, { target })
    expect(el.hasAttribute('data-closing')).toBe(true)
    transitionEnd(target, 'opacity') // not the longest
    transitionEnd(el, 'scale') // not the target
    transitionEnd(target, 'scale', '::backdrop') // a pseudo-element
    expect(done).not.toHaveBeenCalled()
    transitionEnd(target, 'scale')
    expect(done).toHaveBeenCalledOnce()
    expect(el.hasAttribute('data-closing')).toBe(false)
    transitionEnd(target, 'scale')
    expect(done).toHaveBeenCalledOnce()
  })

  it('falls back to a timer at duration + delay + 50ms', () => {
    vi.useFakeTimers()
    const el = box()
    mockTransition([el, { property: 'opacity', duration: '200ms', delay: '100ms' }])
    const done = vi.fn()
    playExit(el, done)
    vi.advanceTimersByTime(349)
    expect(done).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(done).toHaveBeenCalledOnce()
    transitionEnd(el, 'opacity') // the listener is gone
    expect(done).toHaveBeenCalledOnce()
  })

  it('cancel stops the exit: no done, no attribute, no timer', () => {
    vi.useFakeTimers()
    const el = box()
    mockTransition([el, { property: 'opacity', duration: '0.2s' }])
    const done = vi.fn()
    const cancel = playExit(el, done)
    cancel()
    expect(el.hasAttribute('data-closing')).toBe(false)
    transitionEnd(el, 'opacity')
    vi.advanceTimersByTime(1000)
    expect(done).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('undoes data-closing and inert even when done throws', () => {
    const el = box()
    const part = document.createElement('div')
    el.append(part)
    const boom = () => {
      throw new Error('boom')
    }
    expect(() => playExit(el, boom, { inert: [part] })).toThrow('boom')
    expect(el.hasAttribute('data-closing')).toBe(false)
    expect(part.inert).toBe(false)
  })

  it('leaves inert alone on a node someone else set it on during the exit', () => {
    const el = box()
    const mine = document.createElement('div')
    const theirs = document.createElement('div')
    el.append(mine, theirs)
    mockTransition([el, { property: 'opacity', duration: '0.2s' }])
    playExit(el, () => {}, { inert: [mine, theirs] })
    theirs.inert = true // a consumer's own choice, made mid-exit
    transitionEnd(el, 'opacity')
    expect(mine.inert).toBe(false)
    expect(theirs.inert).toBe(true)
  })

  it('moves focus out of what turns inert, to `focus` or else el', () => {
    const el = box()
    el.tabIndex = -1
    const part = document.createElement('div')
    const button = document.createElement('button')
    part.append(button)
    el.append(part)
    mockTransition([el, { property: 'opacity', duration: '0.2s' }])
    button.focus()
    const cancel = playExit(el, () => {}, { inert: [part] })
    expect(document.activeElement).toBe(el)
    cancel()
    const elsewhere = document.createElement('button')
    document.body.append(elsewhere)
    nodes.push(elsewhere)
    button.focus()
    playExit(el, () => {}, { inert: [part], focus: elsewhere })
    expect(document.activeElement).toBe(elsewhere)
  })

  it('makes the given elements inert during the exit, leaving ones already inert alone', () => {
    const el = box()
    const a = document.createElement('div')
    const b = document.createElement('div')
    b.inert = true
    el.append(a, b)
    mockTransition([el, { property: 'opacity', duration: '0.2s' }])
    const cancel = playExit(el, () => {}, { inert: [a, b, undefined] })
    expect([a.inert, b.inert]).toEqual([true, true])
    cancel()
    expect([a.inert, b.inert]).toEqual([false, true])
    // and after an exit that ran to the end
    const during = vi.fn(() => a.inert)
    playExit(el, during, { inert: [a] })
    transitionEnd(el, 'opacity')
    expect(during).toHaveReturnedWith(true)
    expect(a.inert).toBe(false)
  })
})
