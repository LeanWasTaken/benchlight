import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { linkBindings } from '../../vue/internal/link'

const RouterLinkLike = defineComponent({ props: { to: { type: [String, Object] } } })

describe('linkBindings', () => {
  it('gives anchors an href, preferring href over a string to', () => {
    expect(linkBindings('a', '/projects')).toEqual({ href: '/projects' })
    expect(linkBindings('a', '/x', 'https://example.com')).toEqual({ href: 'https://example.com' })
  })

  it('drops object routes on plain anchors', () => {
    expect(linkBindings('a', { name: 'home' })).toEqual({ href: undefined })
  })

  it('passes to through to router components', () => {
    expect(linkBindings(RouterLinkLike, { name: 'home' })).toEqual({ to: { name: 'home' } })
    expect(linkBindings(RouterLinkLike, undefined, 'https://example.com')).toEqual({
      href: 'https://example.com'
    })
  })

  it('binds nothing for non-link tags', () => {
    expect(linkBindings('button', '/x')).toEqual({})
  })
})
