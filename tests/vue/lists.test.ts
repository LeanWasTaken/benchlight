import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import KdIndex from '../../vue/components/KdIndex.vue'
import KdIndexRow from '../../vue/components/KdIndexRow.vue'
import KdMeta from '../../vue/components/KdMeta.vue'
import KdPrevNext from '../../vue/components/KdPrevNext.vue'
import KdProse from '../../vue/components/KdProse.vue'
import KdSectionHead from '../../vue/components/KdSectionHead.vue'

describe('KdSectionHead', () => {
  it('renders an eyebrow and a heading at the given level', () => {
    const wrapper = mount(KdSectionHead, {
      props: { eyebrow: 'Stack', heading: 'What I work with', level: 3 }
    })
    expect(wrapper.find('p.kd-section-head__eyebrow').text()).toBe('Stack')
    expect(wrapper.find('h3.kd-section-head__heading').text()).toBe('What I work with')
  })

  it('bar variant makes the eyebrow the heading and adds an action', () => {
    const wrapper = mount(KdSectionHead, {
      props: { eyebrow: 'Featured projects', bar: true },
      slots: { action: '<a href="/projects">All</a>' }
    })
    expect(wrapper.classes()).toContain('kd-section-head--bar')
    expect(wrapper.find('h2.kd-section-head__eyebrow').text()).toBe('Featured projects')
    expect(wrapper.find('.kd-section-head__action a').exists()).toBe(true)
  })

  it('ruled adds the hairline modifier', () => {
    expect(mount(KdSectionHead, { props: { heading: 'x', ruled: true } }).classes()).toContain(
      'kd-section-head--ruled'
    )
  })
})

describe('KdMeta', () => {
  it('renders items with optional classes', () => {
    const wrapper = mount(KdMeta, {
      props: { items: [{ text: 'SW-01', class: 'kd-meta__key' }, 'Software', '2026'] }
    })
    expect(wrapper.element.tagName).toBe('P')
    expect(wrapper.findAll('span').map((s) => s.text())).toEqual(['SW-01', 'Software', '2026'])
    expect(wrapper.find('span').classes()).toContain('kd-meta__key')
    expect(wrapper.find('.kd-meta__sep').exists()).toBe(false)
  })

  it('adds em-dash separators between items when asked', () => {
    const wrapper = mount(KdMeta, {
      props: { items: ['Krists', 'Riga', 'Rev a1'], separator: true, as: 'span' }
    })
    expect(wrapper.element.tagName).toBe('SPAN')
    const seps = wrapper.findAll('.kd-meta__sep')
    expect(seps).toHaveLength(2)
    expect(seps[0]!.attributes('aria-hidden')).toBe('true')
    expect(seps[0]!.text()).toBe('—')
  })
})

describe('KdIndex and KdIndexRow', () => {
  it('wraps rows in a ruled list', () => {
    const wrapper = mount(KdIndex, {
      props: { ruledTop: true, grid: true },
      slots: { default: () => h(KdIndexRow, { href: '/p/x' }, { title: () => 'CANTools' }) }
    })
    expect(wrapper.element.tagName).toBe('UL')
    expect(wrapper.classes()).toEqual(['kd-index', 'kd-index--ruled-top', 'kd-index--grid'])
    expect(wrapper.find('li.kd-index__item > a.kd-index-row').attributes('href')).toBe('/p/x')
  })

  it('renders meta, title, description and icon slots', () => {
    const wrapper = mount(KdIndexRow, {
      props: { href: '/p/x' },
      slots: {
        icon: '<svg />',
        meta: '<span class="m">SW-01</span>',
        title: 'CANTools',
        default: 'CAN bus debugger'
      }
    })
    expect(wrapper.find('.kd-index-row__icon').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.kd-index-row__meta .m').text()).toBe('SW-01')
    expect(wrapper.find('.kd-index-row__title').text()).toBe('CANTools')
    expect(wrapper.find('.kd-index-row__desc').text()).toBe('CAN bus debugger')
  })

  it('is a div without a link and a typed button when asked', () => {
    expect(mount(KdIndexRow, { slots: { title: 't' } }).find('.kd-index-row').element.tagName).toBe(
      'DIV'
    )
    const button = mount(KdIndexRow, { props: { as: 'button' }, slots: { title: 't' } }).find(
      '.kd-index-row'
    )
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.attributes('type')).toBe('button')
  })

  it('marks selection with aria-current and supports compact rows', () => {
    const row = mount(KdIndexRow, {
      props: { as: 'button', selected: true, compact: true },
      slots: { title: 'home-wifi' }
    }).find('.kd-index-row')
    expect(row.attributes('aria-current')).toBe('true')
    expect(row.classes()).toContain('kd-index-row--compact')
  })
})

describe('KdPrevNext', () => {
  it('links both neighbours with arrows and labels', () => {
    const wrapper = mount(KdPrevNext, {
      props: {
        prev: { title: 'PSU meters', href: '/p/psu' },
        next: { title: 'iDrive', href: '/p/idrive' }
      }
    })
    expect(wrapper.attributes('aria-label')).toBe('Pagination')
    const prev = wrapper.find('.kd-prev-next__link--prev')
    expect(prev.attributes('href')).toBe('/p/psu')
    expect(prev.find('.kd-prev-next__label').text()).toBe('←Previous')
    expect(wrapper.find('.kd-prev-next__link--next .kd-prev-next__title').text()).toBe('iDrive')
  })

  it('keeps the grid slot when a neighbour is missing', () => {
    const wrapper = mount(KdPrevNext, {
      props: { next: { title: 'iDrive', href: '/p/idrive' }, labels: { next: 'Nākamais' } }
    })
    expect(wrapper.find('.kd-prev-next__link--prev').exists()).toBe(false)
    expect(wrapper.element.children).toHaveLength(2)
    expect(wrapper.find('.kd-prev-next__label').text()).toBe('Nākamais→')
  })
})

describe('KdProse', () => {
  it('wraps content in kd-prose with a configurable tag', () => {
    const wrapper = mount(KdProse, { props: { as: 'article' }, slots: { default: '<h2>Why</h2>' } })
    expect(wrapper.element.tagName).toBe('ARTICLE')
    expect(wrapper.classes()).toEqual(['kd-prose'])
  })
})
