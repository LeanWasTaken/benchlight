import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import BlAppearanceSwitch from '../../vue/components/BlAppearanceSwitch.vue'
import BlDialog from '../../vue/components/BlDialog.vue'
import BlLed from '../../vue/components/BlLed.vue'
import BlLog from '../../vue/components/BlLog.vue'
import BlMeter from '../../vue/components/BlMeter.vue'
import BlPagination from '../../vue/components/BlPagination.vue'
import BlPrevNext from '../../vue/components/BlPrevNext.vue'
import BlTabBar from '../../vue/components/BlTabBar.vue'
import BlTableOf from '../../vue/components/BlTable.vue'
import BlToaster from '../../vue/components/BlToaster.vue'
import { mergeLabels } from '../../vue/internal/labels'
import { resetToastStore } from '../../vue/internal/toastStore'
import { useToast } from '../../vue/composables/useToast'

// Loose rows: these tests mount with ad hoc keys, which the inferred row type would reject.
const BlTable = BlTableOf<Record<string, unknown>>

const fitState = vi.hoisted(() => ({ stacked: null as null | { value: boolean } }))
vi.mock('../../vue/internal/useTableFit', async () => {
  const { ref } = await import('vue')
  return {
    useTableFit: () => {
      const stacked = ref(false)
      fitState.stacked = stacked
      return { stacked, fitted: ref(false), overflowing: ref(false), measure: () => {} }
    }
  }
})

afterEach(() => {
  resetToastStore()
  document.body.innerHTML = ''
})

describe('mergeLabels', () => {
  it('skips undefined, keeps other values and function labels', () => {
    const fn = (n: number) => `p${n}`
    const merged = mergeLabels(
      { a: 'A', b: 'B', c: (n: number) => `c${n}` },
      { a: undefined, b: '', c: fn }
    )
    expect(merged.a).toBe('A')
    expect(merged.b).toBe('')
    expect(merged.c).toBe(fn)
  })

  it('returns the defaults for no partial', () => {
    expect(mergeLabels({ a: 'A' }, undefined)).toEqual({ a: 'A' })
  })
})

// The pre-0.9 naming props are gone: passed anyway, they fall through as plain attributes or are
// ignored, and the default or `ariaLabel` names the element.
describe('removed naming props no longer name the element', () => {
  it('BlLed label', () => {
    const w = mount(BlLed, { attrs: { label: 'Old' } })
    expect(w.attributes('aria-label')).toBeUndefined()
    expect(w.attributes('aria-hidden')).toBe('true')
  })

  it('BlLog label', () => {
    const w = mount(BlLog, { props: { lines: [] }, attrs: { label: 'Old' } })
    expect(w.attributes('aria-label')).toBe('Log')
  })

  it('BlTabBar label', () => {
    const w = mount(BlTabBar, { attrs: { label: 'Old' } })
    expect(w.attributes('aria-label')).toBe('Primary')
  })

  it('BlPagination label', () => {
    const w = mount(BlPagination, {
      props: { total: 30, pageSize: 10, page: 1, ariaLabel: 'Pages' },
      attrs: { label: 'Old' }
    })
    expect(w.attributes('aria-label')).toBe('Pages')
  })

  it('BlPrevNext labels.nav', () => {
    const w = mount(BlPrevNext, {
      props: {
        prev: { title: 'A', href: '/a' },
        labels: { nav: 'Old' } as never
      }
    })
    expect(w.attributes('aria-label')).toBe('Pagination')
  })

  it('BlToaster labels.region', async () => {
    const w = mount(BlToaster, {
      props: { labels: { region: 'Old' } as never },
      attachTo: document.body
    })
    await nextTick()
    expect(document.querySelector('.bl-toaster')!.getAttribute('aria-label')).toBe('Notifications')
    w.unmount()
  })

  it('BlMeter showLabel', () => {
    const w = mount(BlMeter, {
      props: { value: 0.5, ariaLabel: 'Disk' },
      attrs: { showLabel: true }
    })
    expect(w.find('.bl-meter-field__label').exists()).toBe(false)
    expect(w.attributes('aria-label')).toBe('Disk')
  })
})

describe('undefined label values fall back to the defaults', () => {
  it('BlAppearanceSwitch', () => {
    const w = mount(BlAppearanceSwitch, {
      props: { labels: { legend: undefined, dark: undefined } }
    })
    expect(w.find('legend').text()).toBe('Appearance')
    expect(w.findAll('input').map((i) => i.attributes('aria-label'))).toEqual([
      'Auto',
      'Light',
      'Dark'
    ])
  })

  it('BlPrevNext', () => {
    const w = mount(BlPrevNext, {
      props: {
        prev: { title: 'A', href: '/a' },
        next: { title: 'B', href: '/b' },
        labels: { prev: undefined }
      }
    })
    expect(w.attributes('aria-label')).toBe('Pagination')
    expect(w.find('.bl-prev-next__link--prev .bl-prev-next__label').text()).toBe('Previous')
  })

  it('BlDialog', () => {
    const w = mount(BlDialog, {
      props: { open: false, title: 'T', labels: { close: undefined } },
      slots: { default: 'Body' },
      attachTo: document.body
    })
    expect(w.get('.bl-dialog__close').attributes('aria-label')).toBe('Close')
    w.unmount()
  })

  it('BlToaster', async () => {
    const w = mount(BlToaster, {
      props: { labels: { dismiss: undefined, actionHint: undefined } },
      attachTo: document.body
    })
    await nextTick()
    await nextTick()
    useToast().toast({ message: 'Deleted', action: { label: 'Undo', onClick: () => {} } })
    await nextTick()
    await nextTick()
    expect(w.find('[aria-label="Notifications"]').exists()).toBe(true)
    expect(document.querySelector('[role="status"]')!.textContent).toBe('Deleted, Undo available')
    expect(w.get('.bl-toast__dismiss').attributes('aria-label')).toBe('Dismiss')
    w.unmount()
  })

  it('BlPagination', () => {
    const w = mount(BlPagination, {
      props: {
        total: 120,
        pageSize: 10,
        label: 'L',
        page: 5,
        labels: { prev: undefined, page: undefined, range: undefined }
      }
    })
    expect(w.get('.bl-pagination__prev').text()).toBe('Previous')
    expect(w.get('.bl-pagination__page').attributes('aria-label')).toBe('Page 1')
    expect(w.get('.bl-pagination__range').text()).toBe('41–50 of 120')
  })

  it('BlTable', () => {
    const w = mount(BlTable, {
      props: {
        caption: 'C',
        columns: [{ key: 'a', label: 'A' }],
        rows: [],
        rowKey: 'a',
        labels: { empty: undefined, total: undefined }
      }
    })
    expect(w.text()).toContain('No data')
  })
})

describe('BlPagination ariaLabel', () => {
  const props = { total: 120, pageSize: 10, page: 5 }

  it('names the nav and not the root', () => {
    const w = mount(BlPagination, { props: { ...props, ariaLabel: 'Seiten' } })
    expect(w.get('nav').attributes('aria-label')).toBe('Seiten')
  })

  it('maps a plain aria-label attribute to the nav only', () => {
    const w = mount(BlPagination, { props, attrs: { 'aria-label': 'Main' } })
    expect(w.element.tagName).toBe('NAV')
    expect(w.attributes('aria-label')).toBe('Main')
  })

  it('warns in development when unnamed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(BlPagination, { props })
    expect(warn.mock.calls.flat().join(' ')).toContain('BlPagination')
    warn.mockRestore()
  })

  it('does not warn when named', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(BlPagination, { props: { ...props, ariaLabel: 'Seiten' } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('BlAppearanceSwitch marks', () => {
  it('shows A / L / D by default and honours labels.marks', () => {
    const marks = (labels?: object) =>
      mount(BlAppearanceSwitch, { props: labels ? { labels } : {} })
        .findAll('label')
        .map((l) => l.text())
    expect(marks()).toEqual(['A', 'L', 'D'])
    expect(marks({ marks: { auto: 'Au', light: 'He', dark: 'Du' } })).toEqual(['Au', 'He', 'Du'])
  })

  it('falls back per mark when a mark is undefined', () => {
    const w = mount(BlAppearanceSwitch, {
      props: { labels: { marks: { auto: undefined, light: 'He' } } }
    })
    expect(w.findAll('label').map((l) => l.text())).toEqual(['A', 'He', 'D'])
  })
})

describe('BlTable sort-state and pagination-name labels', () => {
  const columns = [{ key: 'name', label: 'Device', sortable: true }]
  const rows = [{ mac: 'a', name: 'Lamp' }]
  const stripText = async (props: Record<string, unknown>) => {
    const w = mount(BlTable, {
      props: { caption: 'Clients', columns, rows, rowKey: 'mac', ...props }
    })
    fitState.stacked!.value = true
    await nextTick()
    return w.get('.bl-table__sort-strip .bl-sr-only').text()
  }

  it('defaults to English', async () => {
    expect(await stripText({ sort: { key: 'name', dir: 'asc' } })).toBe(', ascending')
    expect(await stripText({ sort: { key: 'name', dir: 'desc' } })).toBe(', descending')
  })

  it('uses sortAscending / sortDescending', async () => {
    const labels = { sortAscending: 'aufsteigend', sortDescending: 'absteigend' }
    expect(await stripText({ labels, sort: { key: 'name', dir: 'asc' } })).toBe(', aufsteigend')
    expect(await stripText({ labels, sort: { key: 'name', dir: 'desc' } })).toBe(', absteigend')
  })

  it('names the pagination via labels.pages', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ mac: String(i), name: 'x' }))
    const nav = (props: Record<string, unknown>) =>
      mount(BlTable, {
        props: { caption: 'Clients', columns, rows: many, rowKey: 'mac', pageSize: 10, ...props }
      })
        .get('nav')
        .attributes('aria-label')
    expect(nav({})).toBe('Clients, pages')
    expect(nav({ labels: { pages: (c: string) => `${c} Seiten` } })).toBe('Clients Seiten')
  })
})
