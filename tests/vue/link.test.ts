import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { linkBindings, resolveTag } from '../../vue/internal/link'

const RouterLinkLike = defineComponent({ props: { to: { type: [String, Object] } } })

afterEach(() => vi.restoreAllMocks())
const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('linkBindings', () => {
  it('gives anchors an href, preferring href over a string to', () => {
    const warn = spyWarn()
    expect(linkBindings('a', '/projects')).toEqual({ href: '/projects' })
    expect(linkBindings('a', '/x', 'https://example.com')).toEqual({ href: 'https://example.com' })
    expect(warn).not.toHaveBeenCalled()
  })

  it('drops object routes on plain anchors and warns', () => {
    const warn = spyWarn()
    expect(linkBindings('a', { name: 'home' })).toStrictEqual({ href: undefined })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[benchlight]'))
  })

  it('passes to through to router components', () => {
    const warn = spyWarn()
    expect(linkBindings(RouterLinkLike, { name: 'home' })).toEqual({ to: { name: 'home' } })
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns when a router component only gets href', () => {
    const warn = spyWarn()
    expect(linkBindings(RouterLinkLike, undefined, 'https://example.com')).toEqual({
      href: 'https://example.com'
    })
    expect(warn).toHaveBeenCalledOnce()
  })

  it('binds nothing for non-link tags and warns when a link target was given', () => {
    const warn = spyWarn()
    expect(linkBindings('button')).toEqual({})
    expect(warn).not.toHaveBeenCalled()
    expect(linkBindings('button', '/x')).toEqual({})
    expect(warn).toHaveBeenCalledOnce()
  })
})

describe('resolveTag', () => {
  it('prefers an explicit as', () => {
    expect(resolveTag('span', '/x', undefined, 'a')).toBe('span')
    expect(resolveTag(RouterLinkLike, '/x', undefined, 'a')).toBe(RouterLinkLike)
  })

  it('infers an anchor from to or href, else uses the fallback', () => {
    expect(resolveTag(undefined, '/x', undefined, 'button')).toBe('a')
    expect(resolveTag(undefined, undefined, '/x', 'div')).toBe('a')
    expect(resolveTag(undefined, undefined, undefined, 'button')).toBe('button')
    expect(resolveTag(undefined, undefined, undefined, 'div')).toBe('div')
  })
})
