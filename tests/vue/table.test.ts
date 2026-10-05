import { mount } from '@vue/test-utils'
import { createSSRApp, h, nextTick, reactive } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'

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
import BlTable from '../../vue/components/BlTable.vue'

const columns = [
  { key: 'name', label: 'Device', sortable: true },
  { key: 'rssi', label: 'Signal', numeric: true, sortable: true },
  { key: 'ip', label: 'Address' }
]
const rows = [
  { mac: 'a', name: 'Lamp', rssi: -60, ip: '10.0.0.4' },
  { mac: 'b', name: 'Desk', rssi: -42, ip: '10.0.0.9' }
]
const make = (props: Record<string, unknown> = {}) =>
  mount(BlTable, { props: { caption: 'Clients', columns, rows, rowKey: 'mac', ...props } })

describe('BlTable', () => {
  it('renders table semantics with explicit roles and a caption', () => {
    const w = make()
    expect(w.find('table').attributes('role')).toBe('table')
    expect(w.find('caption').text()).toBe('Clients')
    expect(w.findAll('thead th').map((th) => th.attributes('role'))).toEqual(
      Array(3).fill('columnheader')
    )
    const first = w.findAll('tbody tr')[0]!
    expect(first.attributes('role')).toBe('row')
    expect(first.find('th').attributes()).toMatchObject({ role: 'rowheader', scope: 'row' })
    expect(first.findAll('td').map((td) => td.attributes('role'))).toEqual(['cell', 'cell'])
    expect(first.findAll('td').map((td) => td.attributes('data-label'))).toEqual([
      'Signal',
      'Address'
    ])
    expect(first.find('td .bl-table__label').attributes('aria-hidden')).toBe('true')
    expect(first.find('td.bl-table__num').exists()).toBe(true)
  })

  it('hides the caption visually with captionHidden', () => {
    expect(make({ captionHidden: true }).find('caption').classes()).toContain('bl-sr-only')
  })

  it('sorts through header buttons, sets aria-sort only on the sorted column, and cycles', async () => {
    const w = make()
    const signal = () => w.findAll('thead th')[1]!
    await signal().find('button.bl-table__sort').trigger('click')
    expect(w.emitted('update:sort')![0]).toEqual([{ key: 'rssi', dir: 'asc' }])
    await w.setProps({ sort: { key: 'rssi', dir: 'asc' } })
    expect(w.findAll('tbody th').map((th) => th.text())).toEqual(['Lamp', 'Desk'])
    expect(signal().attributes('aria-sort')).toBe('ascending')
    expect(w.findAll('thead th')[0]!.attributes('aria-sort')).toBeUndefined()
    await signal().find('button').trigger('click')
    expect(w.emitted('update:sort')![1]).toEqual([{ key: 'rssi', dir: 'desc' }])
  })

  it('does not reorder rows in manual mode', async () => {
    const w = make({ manual: true, sort: { key: 'rssi', dir: 'asc' } })
    expect(w.findAll('tbody th').map((th) => th.text())).toEqual(['Lamp', 'Desk'])
  })

  it('ignores undefined label overrides', () => {
    const w = make({ rows: [], labels: { empty: undefined } })
    expect(w.find('td.bl-table__empty').text()).toBe('No data')
  })

  it('renders the empty state', () => {
    const w = make({ rows: [] })
    expect(w.find('td.bl-table__empty').attributes('colspan')).toBe('3')
    expect(w.find('td.bl-table__empty').text()).toBe('No data')
    expect(make({ rows: [], labels: { empty: 'Nothing yet' } }).text()).toContain('Nothing yet')
  })

  it('uses cell and head slots', () => {
    const w = mount(BlTable, {
      props: { caption: 'C', columns, rows, rowKey: 'mac' },
      slots: {
        'cell-rssi': ({ value }: { value: unknown }) => `${value} dBm`,
        'head-ip': () => 'IP'
      }
    })
    expect(w.findAll('tbody tr')[0]!.findAll('td')[0]!.text()).toContain('-60 dBm')
    expect(w.findAll('thead th')[2]!.text()).toBe('IP')
  })

  it('re-renders when rows are mutated in place (Review Focus 1)', async () => {
    const data = reactive([...rows])
    const w = mount(BlTable, { props: { caption: 'C', columns, rows: data, rowKey: 'mac' } })
    data.push({ mac: 'c', name: 'Fan', rssi: -70, ip: '10.0.0.2' })
    await nextTick()
    expect(w.findAll('tbody tr')).toHaveLength(3)
  })

  it('shows a visible sort strip instead of header buttons when stacked', async () => {
    const w = make()
    fitState.stacked!.value = true
    await nextTick()
    expect(w.attributes('data-stacked')).toBe('')
    expect(w.find('thead button').exists()).toBe(false)
    const strip = w.find('.bl-table__sort-strip')
    expect(strip.findAll('button').map((b) => b.text())).toEqual(['Device', 'Signal'])
    // headers keep their label and icon (same width as unstacked) but are not interactive
    expect(w.findAll('thead span.bl-table__sort')).toHaveLength(2)
    expect(w.find('thead .bl-table__sort-icon').exists()).toBe(true)
    await w.setProps({ sort: { key: 'rssi', dir: 'desc' } })
    expect(strip.findAll('button').map((b) => b.attributes('data-dir'))).toEqual([
      undefined,
      'desc'
    ])
  })

  it('SSR-renders an initial sort that hydrates identically (Review Focus 5)', async () => {
    const app = createSSRApp({
      render: () =>
        h(BlTable, {
          caption: 'C',
          columns,
          rows,
          rowKey: 'mac',
          sort: { key: 'name', dir: 'asc' },
          locale: 'en'
        })
    })
    const html = await renderToString(app)
    expect(html.indexOf('Desk')).toBeLessThan(html.indexOf('Lamp'))
    expect(html).not.toContain('data-fit')
  })
})

describe('BlTable pagination', () => {
  const many = Array.from({ length: 25 }, (_, i) => ({
    mac: `m${i}`,
    name: `Device ${String(i + 1).padStart(2, '0')}`,
    rssi: -i,
    ip: `10.0.0.${i}`
  }))

  it('slices client-side and renders BlPagination', async () => {
    const w = mount(BlTable, {
      props: { caption: 'Clients', columns, rows: many, rowKey: 'mac', pageSize: 10, page: 2 }
    })
    expect(w.findAll('tbody tr')).toHaveLength(10)
    expect(w.find('tbody th').text()).toBe('Device 11')
    expect(w.find('nav.bl-pagination').attributes('aria-label')).toBe('Clients, pages')
  })

  it('resets to page 1 when the sort changes', async () => {
    const w = mount(BlTable, {
      props: { caption: 'C', columns, rows: many, rowKey: 'mac', pageSize: 10, page: 3 }
    })
    await w.find('thead button').trigger('click')
    expect(w.emitted('update:page')!.at(-1)).toEqual([1])
  })

  it('clamps and emits when rows shrink (Review Focus 3)', async () => {
    const w = mount(BlTable, {
      props: { caption: 'C', columns, rows: many, rowKey: 'mac', pageSize: 10, page: 3 }
    })
    await w.setProps({ rows: many.slice(0, 12) })
    expect(w.emitted('update:page')!.at(-1)).toEqual([2])
    expect(w.findAll('tbody tr')).toHaveLength(2)
  })

  it('uses rows as given in manual mode with totalRows', () => {
    const w = mount(BlTable, {
      props: {
        caption: 'C',
        columns,
        rows: many.slice(0, 10),
        rowKey: 'mac',
        pageSize: 10,
        page: 4,
        manual: true,
        totalRows: 250
      }
    })
    expect(w.findAll('tbody tr')).toHaveLength(10)
    expect(w.find('.bl-pagination__range').text()).toBe('31–40 of 250')
  })
})
