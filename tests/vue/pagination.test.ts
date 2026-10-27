import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BlPagination from '../../vue/components/BlPagination.vue'

const make = (props: Record<string, unknown> = {}) =>
  mount(BlPagination, {
    props: { total: 120, pageSize: 10, label: 'Clients pages', page: 5, ...props },
    attachTo: document.body
  })

describe('BlPagination', () => {
  it('renders nothing for a single page', () => {
    expect(make({ total: 8 }).find('nav').exists()).toBe(false)
  })

  it('renders a labelled nav with page buttons, gaps and aria-current', () => {
    const w = make()
    expect(w.find('nav').attributes('aria-label')).toBe('Clients pages')
    const pages = w.findAll('.bl-pagination__page')
    expect(pages.map((b) => b.text())).toEqual(['1', '4', '5', '6', '12'])
    expect(pages[2]!.attributes('aria-current')).toBe('page')
    expect(pages[0]!.attributes('aria-label')).toBe('Page 1')
    expect(
      w.findAll('.bl-pagination__gap').every((g) => g.attributes('aria-hidden') === 'true')
    ).toBe(true)
    expect(w.find('.bl-pagination__range').text()).toBe('41–50 of 120')
    w.unmount()
  })

  it('moves pages, keeps prev/next focusable at the ends, and announces the range', async () => {
    const w = make({ page: 12 })
    const next = w.find('.bl-pagination__next')
    expect(next.attributes('aria-disabled')).toBe('true')
    expect(next.attributes('disabled')).toBeUndefined()
    await next.trigger('click')
    expect(w.emitted('update:page')).toBeUndefined()
    await w.find('.bl-pagination__prev').trigger('click')
    expect(w.emitted('update:page')![0]).toEqual([11])
    await w.setProps({ page: 11 })
    expect(w.find('[aria-live="polite"]').text()).toBe('101–110 of 120')
    w.unmount()
  })

  it('starts with an empty live region and accepts labels', () => {
    const w = make({
      labels: {
        prev: 'Atpakaļ',
        range: (from: number, to: number, total: number) => `${from}-${to} / ${total}`
      }
    })
    expect(w.find('[aria-live="polite"]').text()).toBe('')
    expect(w.find('.bl-pagination__prev').text()).toBe('Atpakaļ')
    expect(w.find('.bl-pagination__range').text()).toBe('41-50 / 120')
    w.unmount()
  })

  it('keeps default labels when an explicit undefined is passed', () => {
    const w = make({ labels: { prev: undefined } })
    expect(w.find('.bl-pagination__prev').text()).toBe('Previous')
    w.unmount()
  })

  it('emits a clamped page when total shrinks, and only while total > 0', async () => {
    const w = make({ page: 8, total: 100, pageSize: 10 })
    await w.setProps({ total: 20 })
    expect(w.emitted('update:page')).toEqual([[2]])
    await w.setProps({ page: 2, total: 0 })
    expect(w.emitted('update:page')).toHaveLength(1)
    await w.setProps({ total: 100 })
    expect(w.emitted('update:page')).toHaveLength(1)
    w.unmount()
  })

  it('clamps on mount only when total > 0, and when pageSize puts the page out of range', async () => {
    const a = make({ page: 8, total: 20, pageSize: 10 })
    expect(a.emitted('update:page')).toEqual([[2]])
    a.unmount()
    const b = make({ page: 8, total: 0, pageSize: 10 })
    expect(b.emitted('update:page')).toBeUndefined()
    b.unmount()
    const c = make({ page: 5, total: 100, pageSize: 10 })
    await c.setProps({ pageSize: 50 })
    expect(c.emitted('update:page')).toEqual([[2]])
    c.unmount()
  })
})
