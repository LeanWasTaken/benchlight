import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import BlIndex from '../../vue/components/BlIndex.vue'
import BlIndexRow from '../../vue/components/BlIndexRow.vue'
import BlMeta from '../../vue/components/BlMeta.vue'
import BlPrevNext from '../../vue/components/BlPrevNext.vue'
import BlProse from '../../vue/components/BlProse.vue'
import BlSectionHead from '../../vue/components/BlSectionHead.vue'

describe('BlSectionHead', () => {
  it('renders an eyebrow and a heading at the given level', () => {
    const wrapper = mount(BlSectionHead, {
      props: { eyebrow: 'Stack', heading: 'What I work with', level: 3 }
    })
    expect(wrapper.find('p.bl-section-head__eyebrow').text()).toBe('Stack')
    expect(wrapper.find('h3.bl-section-head__heading').text()).toBe('What I work with')
  })

  it('bar variant makes the eyebrow the heading and adds actions', () => {
    const wrapper = mount(BlSectionHead, {
      props: { eyebrow: 'Featured projects', bar: true },
      slots: { actions: '<a href="/projects">All</a>' }
    })
    expect(wrapper.classes()).toContain('bl-section-head--bar')
    expect(wrapper.find('h2.bl-section-head__eyebrow').text()).toBe('Featured projects')
    expect(wrapper.find('.bl-section-head__actions a').exists()).toBe(true)
  })

  it('renders the actions slot outside bar mode too', () => {
    const wrapper = mount(BlSectionHead, {
      props: { eyebrow: 'Stack', heading: 'What I work with' },
      slots: { actions: '<a href="/x">All</a>' }
    })
    expect(wrapper.find('.bl-section-head__actions a').exists()).toBe(true)
    expect(wrapper.find('h2.bl-section-head__heading').text()).toBe('What I work with')
  })

  it('renders only the actions slot, not the old action slot', () => {
    for (const bar of [true, false]) {
      const wrapper = mount(BlSectionHead, {
        props: { eyebrow: 'Stack', heading: 'x', bar },
        slots: { action: '<a href="/x">All</a>' }
      })
      expect(wrapper.find('a').exists()).toBe(false)
      expect(wrapper.find('[class*="__action"]').exists()).toBe(false)
    }
  })

  it('is a div, not a banner landmark, and warns when the heading is empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(mount(BlSectionHead, { props: { heading: 'x' } }).element.tagName).toBe('DIV')
    expect(warn).not.toHaveBeenCalled()
    mount(BlSectionHead, { props: { eyebrow: 'Only an eyebrow' } })
    mount(BlSectionHead, { props: { bar: true } })
    const messages = warn.mock.calls.map((call) => String(call[0]))
    expect(messages.filter((m) => m.includes('BlSectionHead')).length).toBeGreaterThanOrEqual(1)
    warn.mockRestore()
  })

  it('ruled adds the hairline modifier', () => {
    expect(mount(BlSectionHead, { props: { heading: 'x', ruled: true } }).classes()).toContain(
      'bl-section-head--ruled'
    )
  })
})

describe('BlMeta', () => {
  it('renders items with optional classes', () => {
    const wrapper = mount(BlMeta, {
      props: { items: [{ text: 'SW-01', class: 'bl-meta__key' }, 'Software', '2026'] }
    })
    expect(wrapper.element.tagName).toBe('P')
    expect(wrapper.findAll('span').map((s) => s.text())).toEqual(['SW-01', 'Software', '2026'])
    expect(wrapper.find('span').classes()).toContain('bl-meta__key')
    expect(wrapper.find('.bl-meta__sep').exists()).toBe(false)
  })

  it('marks separated metas with a modifier instead of rendering separator spans', () => {
    const wrapper = mount(BlMeta, {
      props: { items: ['Krists', 'Riga', 'Rev a1'], separator: true, as: 'span' }
    })
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('bl-meta--sep')
    expect(wrapper.find('.bl-meta__sep').exists()).toBe(false)
    expect([...wrapper.element.children].map((c) => c.textContent)).toEqual([
      'Krists',
      'Riga',
      'Rev a1'
    ])
  })

  it('has no separator modifier by default', () => {
    const wrapper = mount(BlMeta, { props: { items: ['a', 'b'] } })
    expect(wrapper.classes()).not.toContain('bl-meta--sep')
  })
})

describe('BlIndex and BlIndexRow', () => {
  it('wraps rows in a ruled list', () => {
    const wrapper = mount(BlIndex, {
      props: { ruledTop: true, grid: true },
      slots: { default: () => h(BlIndexRow, { href: '/p/x' }, { title: () => 'CANTools' }) }
    })
    expect(wrapper.element.tagName).toBe('UL')
    expect(wrapper.classes()).toEqual(['bl-index', 'bl-index--ruled-top', 'bl-index--grid'])
    expect(wrapper.find('li.bl-index__item > a.bl-index-row').attributes('href')).toBe('/p/x')
  })

  it('renders meta, title, description and icon slots', () => {
    const wrapper = mount(BlIndexRow, {
      props: { href: '/p/x' },
      slots: {
        icon: '<svg />',
        meta: '<span class="m">SW-01</span>',
        title: 'CANTools',
        default: 'CAN bus debugger'
      }
    })
    expect(wrapper.find('.bl-index-row__icon').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.bl-index-row__meta .m').text()).toBe('SW-01')
    expect(wrapper.find('.bl-index-row__title').text()).toBe('CANTools')
    expect(wrapper.find('.bl-index-row__desc').text()).toBe('CAN bus debugger')
  })

  it('is a div without a link and a typed button when asked', () => {
    expect(mount(BlIndexRow, { slots: { title: 't' } }).find('.bl-index-row').element.tagName).toBe(
      'DIV'
    )
    const button = mount(BlIndexRow, { props: { as: 'button' }, slots: { title: 't' } }).find(
      '.bl-index-row'
    )
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.attributes('type')).toBe('button')
  })

  it('marks the current row with aria-current and supports compact rows', () => {
    const row = mount(BlIndexRow, {
      props: { as: 'button', current: true, compact: true },
      slots: { title: 'home-wifi' }
    }).find('.bl-index-row')
    expect(row.attributes('aria-current')).toBe('page')
    expect(row.classes()).toContain('bl-index-row--compact')
  })

  it.each([
    ['page', 'page'],
    ['step', 'step'],
    ['location', 'location'],
    [true, 'page']
  ] as const)('renders current="%s" as aria-current="%s"', (current, expected) => {
    const row = mount(BlIndexRow, { props: { current }, slots: { title: 't' } }).find(
      '.bl-index-row'
    )
    expect(row.attributes('aria-current')).toBe(expected)
  })

  it('renders no aria-current when current is false or unset', () => {
    const off = mount(BlIndexRow, { props: { current: false }, slots: { title: 't' } })
    const unset = mount(BlIndexRow, { slots: { title: 't' } })
    expect(off.find('.bl-index-row').attributes('aria-current')).toBeUndefined()
    expect(unset.find('.bl-index-row').attributes('aria-current')).toBeUndefined()
  })
})

describe('BlPrevNext', () => {
  it('links both neighbours with arrows and labels', () => {
    const wrapper = mount(BlPrevNext, {
      props: {
        prev: { title: 'PSU meters', href: '/p/psu' },
        next: { title: 'iDrive', href: '/p/idrive' }
      }
    })
    expect(wrapper.attributes('aria-label')).toBe('Pagination')
    const prev = wrapper.find('.bl-prev-next__link--prev')
    expect(prev.attributes('href')).toBe('/p/psu')
    expect(prev.find('.bl-prev-next__label').text()).toBe('Previous')
    expect(prev.find('.bl-prev-next__icon > svg[aria-hidden="true"]').exists()).toBe(true)
    expect(wrapper.html()).not.toMatch(/[←→]/)
    expect(wrapper.find('.bl-prev-next__link--next .bl-prev-next__title').text()).toBe('iDrive')
  })

  it('keeps the grid slot when a neighbour is missing', () => {
    const wrapper = mount(BlPrevNext, {
      props: { next: { title: 'iDrive', href: '/p/idrive' }, labels: { next: 'Nākamais' } }
    })
    expect(wrapper.find('.bl-prev-next__link--prev').exists()).toBe(false)
    expect(wrapper.element.children).toHaveLength(2)
    expect(wrapper.find('.bl-prev-next__label').text()).toBe('Nākamais')
    expect(wrapper.find('.bl-prev-next__icon > svg').exists()).toBe(true)
  })
})

describe('BlPrevNext linkAs and ariaLabel', () => {
  const Router = defineComponent({
    props: { to: { type: [String, Object], required: true } },
    setup(props, { slots }) {
      return () => h('a', { href: String(props.to), 'data-router': '' }, slots['default']?.())
    }
  })

  it('renders its items with linkAs', () => {
    const wrapper = mount(BlPrevNext, {
      props: { linkAs: Router, prev: { title: 'A', to: '/a' }, next: { title: 'B', to: '/b' } }
    })
    expect(wrapper.findAll('a[data-router]')).toHaveLength(2)
  })

  it('no longer takes `as` for the item component', () => {
    const wrapper = mount(BlPrevNext, {
      attrs: { as: Router },
      props: { prev: { title: 'A', href: '/a' } }
    })
    expect(wrapper.find('a[data-router]').exists()).toBe(false)
    expect(wrapper.find('a.bl-prev-next__link').attributes('href')).toBe('/a')
  })

  it('names the nav with ariaLabel or a plain aria-label attribute', () => {
    const item = { title: 'A', href: '/a' }
    expect(
      mount(BlPrevNext, { props: { prev: item, ariaLabel: 'Posts' } }).attributes('aria-label')
    ).toBe('Posts')
    expect(
      mount(BlPrevNext, { props: { prev: item }, attrs: { 'aria-label': 'More' } }).attributes(
        'aria-label'
      )
    ).toBe('More')
  })
})

describe('BlPrevNext empty', () => {
  it('renders no landmark without neighbours', () => {
    expect(mount(BlPrevNext).find('nav').exists()).toBe(false)
    expect(mount(BlPrevNext, { props: { prev: null, next: null } }).html()).not.toContain('<nav')
  })
})

describe('BlProse', () => {
  it('wraps content in bl-prose with a configurable tag', () => {
    const wrapper = mount(BlProse, { props: { as: 'article' }, slots: { default: '<h2>Why</h2>' } })
    expect(wrapper.element.tagName).toBe('ARTICLE')
    expect(wrapper.classes()).toEqual(['bl-prose'])
  })
})
