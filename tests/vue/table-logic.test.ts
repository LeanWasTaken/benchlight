import { describe, expect, it } from 'vitest'
import {
  clampPage,
  computeTotals,
  formatCell,
  nextSort,
  pageCount,
  pageRange,
  pageSlice,
  sortRows
} from '../../vue/internal/table'
import type { TableColumn } from '../../vue/types'

type R = Record<string, unknown>
const col = (key: string, extra: Partial<TableColumn<R>> = {}): TableColumn<R> => ({
  key,
  label: key,
  ...extra
})

describe('sortRows', () => {
  const rows = [
    { name: 'b10', n: 10 },
    { name: 'B2', n: 2 },
    { name: 'a', n: null },
    { name: 'c', n: 2 }
  ]
  it('returns a copy in original order without a sort', () => {
    const out = sortRows(rows, [col('name')], null)
    expect(out).toEqual(rows)
    expect(out).not.toBe(rows)
  })
  it('compares text numeric-aware and case-insensitively', () => {
    const names = sortRows(rows, [col('name')], { key: 'name', dir: 'asc' }).map((r) => r.name)
    expect(names).toEqual(['a', 'B2', 'b10', 'c'])
  })
  it('compares numbers numerically, is stable and puts empties last in both directions', () => {
    const asc = sortRows(rows, [col('n')], { key: 'n', dir: 'asc' }).map((r) => r.name)
    expect(asc).toEqual(['B2', 'c', 'b10', 'a'])
    const desc = sortRows(rows, [col('n')], { key: 'n', dir: 'desc' }).map((r) => r.name)
    expect(desc).toEqual(['b10', 'B2', 'c', 'a'])
  })
  it('coerces a numeric column and treats NaN/empty as empty (Review Focus 2)', () => {
    const mixed = [{ v: '10' }, { v: 2 }, { v: '' }, { v: 'n/a' }, { v: null }, { v: '3.5' }]
    const out = sortRows(mixed, [col('v', { numeric: true })], { key: 'v', dir: 'asc' })
    expect(out.map((r) => r.v)).toEqual([2, '3.5', '10', '', 'n/a', null])
    const down = sortRows(mixed, [col('v', { numeric: true })], { key: 'v', dir: 'desc' })
    expect(down.slice(0, 3).map((r) => r.v)).toEqual(['10', '3.5', 2])
  })
  it('uses sortBy and ignores an unknown sort key', () => {
    const out = sortRows(rows, [col('name', { sortBy: (r) => -(r.n as number) })], {
      key: 'name',
      dir: 'asc'
    })
    expect(out[0]!.name).toBe('b10')
    expect(sortRows(rows, [col('name')], { key: 'nope', dir: 'asc' })).toEqual(rows)
  })
  it('handles Infinity values stably in numeric sort', () => {
    const rows = [{ v: 'Infinity' }, { v: 1 }, { v: 'Infinity' }]
    const out = sortRows(rows, [col('v', { numeric: true })], { key: 'v', dir: 'asc' })
    expect(out.map((r) => r.v)).toEqual([1, 'Infinity', 'Infinity'])
  })
  it('coerces and sorts Date values chronologically', () => {
    const d1 = new Date('2025-01-02')
    const d2 = new Date('2025-01-01')
    const d3 = new Date('2025-01-03')
    const rows = [{ d: d3 }, { d: d1 }, { d: d2 }]
    const asc = sortRows(rows, [col('d')], { key: 'd', dir: 'asc' }).map((r) =>
      (r.d as Date).toISOString()
    )
    expect(asc).toEqual([d2.toISOString(), d1.toISOString(), d3.toISOString()])
    const desc = sortRows(rows, [col('d')], { key: 'd', dir: 'desc' }).map((r) =>
      (r.d as Date).toISOString()
    )
    expect(desc).toEqual([d3.toISOString(), d1.toISOString(), d2.toISOString()])
  })
})

describe('nextSort', () => {
  it('cycles asc → desc → off, and a new key starts asc', () => {
    expect(nextSort(null, 'a')).toEqual({ key: 'a', dir: 'asc' })
    expect(nextSort({ key: 'a', dir: 'asc' }, 'a')).toEqual({ key: 'a', dir: 'desc' })
    expect(nextSort({ key: 'a', dir: 'desc' }, 'a')).toBeNull()
    expect(nextSort({ key: 'a', dir: 'desc' }, 'b')).toEqual({ key: 'b', dir: 'asc' })
  })
})

describe('paging', () => {
  it('counts pages with a floor of one', () => {
    expect(pageCount(0, 10)).toBe(1)
    expect(pageCount(25, 10)).toBe(3)
  })
  it('clamps pages', () => {
    expect(clampPage(5, 25, 10)).toBe(3)
    expect(clampPage(0, 25, 10)).toBe(1)
    expect(clampPage(Number.NaN, 25, 10)).toBe(1)
  })
  it('slices a page', () => {
    expect(pageSlice([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4])
  })
  it.each([
    [1, 1, [1]],
    [1, 2, [1, 2]],
    [4, 7, [1, 2, 3, 4, 5, 6, 7]],
    [5, 12, [1, 'gap', 4, 5, 6, 'gap', 12]],
    [1, 100, [1, 2, 'gap', 100]],
    [100, 100, [1, 'gap', 99, 100]]
  ] as const)('pageRange(%i, %i)', (page, pages, expected) => {
    expect(pageRange(page, pages)).toEqual(expected)
  })
  it('normalizes non-positive and non-finite pageSizes', () => {
    expect(pageCount(25, 0)).toBe(25)
    expect(pageCount(0, 0)).toBe(1)
    expect(pageCount(25, -5)).toBe(25)
    const clamped = clampPage(3, 25, -5)
    expect(Number.isFinite(clamped)).toBe(true)
    expect(clamped).toBeGreaterThanOrEqual(1)
    expect(pageSlice([1, 2, 3], 1, 0)).toEqual([1])
    expect(pageCount(25, 2.7)).toBe(13)
    expect(pageCount(NaN, 10)).toBe(1)
  })
})

describe('totals and formatting', () => {
  const rows = [
    { a: 2, b: 'x' },
    { a: '3', b: '' },
    { a: null, b: 'y' },
    { a: 'n/a', b: null }
  ]
  it('sums, averages and counts non-empty values', () => {
    const totals = computeTotals(rows, [col('a', { total: 'sum' }), col('b', { total: 'count' })])
    expect(totals).toEqual({ a: 5, b: 2 })
    expect(computeTotals(rows, [col('a', { total: 'avg' })])).toEqual({ a: 2.5 })
    expect(computeTotals([], [col('a', { total: 'avg' })])).toEqual({ a: '' })
  })
  it('formats sum/avg with format(value) and passes custom totals through', () => {
    const totals = computeTotals(rows, [
      col('a', { total: 'sum', format: (v) => `${v} dB` }),
      col('b', { total: (all) => `${all.length} rows` })
    ])
    expect(totals).toEqual({ a: '5 dB', b: '4 rows' })
  })
  it('formats cells', () => {
    expect(formatCell({ a: null }, col('a'))).toBe('')
    expect(formatCell({ a: 3 }, col('a'))).toBe('3')
    expect(formatCell({ a: 3 }, col('a', { format: (v, r) => `${v}/${r?.a}` }))).toBe('3/3')
  })
})
