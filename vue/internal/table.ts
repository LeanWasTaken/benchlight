import type { TableColumn, TableSort, TableTotal } from '../types'

export type TableRow = Record<string, unknown>

export function isEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value === 'number' && Number.isNaN(value))
  )
}

// The three column kinds, seen through one loose shape: the public union cannot be called
// without narrowing every member.
interface LooseColumn<R> {
  key: string
  slot?: true
  value?: (row: R) => unknown
  format?: (value: unknown, row: R) => string
  numeric?: boolean
  sortBy?: (row: R) => string | number | null | undefined
  total?: TableTotal<R>
  formatTotal?: (value: number, rows: R[]) => string
}
const loose = <R extends object>(column: TableColumn<R>) => column as unknown as LooseColumn<R>

/** A cell's value: `value(row)` for a derived column, `row[key]` for a key column, none for a slot-only one. */
export function columnValue<R extends object>(row: R, column: TableColumn<R>): unknown {
  const c = loose(column)
  if (c.slot) return undefined
  if (c.value) return c.value(row)
  return (row as TableRow)[c.key]
}

export function formatCell<R extends object>(row: R, column: TableColumn<R>): string {
  const c = loose(column)
  if (c.slot) return ''
  const value = columnValue(row, column)
  if (c.format) return c.format(value, row)
  return isEmpty(value) ? '' : String(value)
}

function sortValue<R extends object>(row: R, column: TableColumn<R>): unknown {
  const c = loose(column)
  const raw = c.sortBy ? c.sortBy(row) : columnValue(row, column)
  if (raw instanceof Date) {
    const time = raw.getTime()
    return Number.isNaN(time) ? null : time
  }
  if (c.numeric && !isEmpty(raw) && typeof raw !== 'number') {
    const n = Number(raw)
    return Number.isNaN(n) ? null : n
  }
  return raw
}

// Stable sort; empty values (null, undefined, '', NaN) always last; numbers numerically,
// everything else with a numeric-aware, case-insensitive collator. The collator defaults to
// 'en', not the runtime's locale, so a server-rendered sort hydrates without a mismatch.
export function sortRows<R extends object>(
  rows: readonly R[],
  columns: readonly TableColumn<R>[],
  sort: TableSort | null,
  locale?: string
): R[] {
  const column = sort && columns.find((c) => c.key === sort.key)
  if (!sort || !column || loose(column).slot) return rows.slice()
  const collator = new Intl.Collator(locale ?? 'en', { numeric: true, sensitivity: 'base' })
  const dir = sort.dir === 'desc' ? -1 : 1
  return rows
    .map((row, index) => ({ row, index, value: sortValue(row, column) }))
    .sort((a, b) => {
      const ae = isEmpty(a.value)
      const be = isEmpty(b.value)
      if (ae || be) return ae && be ? a.index - b.index : ae ? 1 : -1
      const c =
        typeof a.value === 'number' && typeof b.value === 'number'
          ? a.value < b.value
            ? -1
            : a.value > b.value
              ? 1
              : 0
          : collator.compare(String(a.value), String(b.value))
      return c !== 0 ? c * dir : a.index - b.index
    })
    .map((entry) => entry.row)
}

export function nextSort(current: TableSort | null, key: string): TableSort | null {
  if (!current || current.key !== key) return { key, dir: 'asc' }
  return current.dir === 'asc' ? { key, dir: 'desc' } : null
}

function normSize(pageSize: number): number {
  return Number.isFinite(pageSize) && pageSize >= 1 ? Math.floor(pageSize) : 1
}

function normTotal(total: number): number {
  return Number.isFinite(total) && total > 0 ? Math.floor(total) : 0
}

export function pageCount(total: number, pageSize: number): number {
  const size = normSize(pageSize)
  const t = normTotal(total)
  return Math.max(1, Math.ceil(t / size))
}

export function clampPage(page: number, total: number, pageSize: number): number {
  const p = Number.isFinite(page) ? Math.trunc(page) : 1
  return Math.min(Math.max(1, p), pageCount(total, pageSize))
}

export function pageSlice<R>(rows: readonly R[], page: number, pageSize: number): R[] {
  const size = normSize(pageSize)
  const start = (page - 1) * size
  return rows.slice(start, start + size)
}

// First, last and current ± siblings; a single skipped page is shown instead of a gap.
export function pageRange(page: number, pages: number, siblings = 1): Array<number | 'gap'> {
  const shown = new Set<number>([1, pages])
  for (let p = page - siblings; p <= page + siblings; p++) if (p >= 1 && p <= pages) shown.add(p)
  const sorted = [...shown].sort((a, b) => a - b)
  const out: Array<number | 'gap'> = []
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1]
    if (prev !== undefined && p - prev === 2) out.push(prev + 1)
    else if (prev !== undefined && p - prev > 2) out.push('gap')
    out.push(p)
  })
  return out
}

// Every total kind goes through formatTotal(value, rows), or String(); never through format().
export function computeTotals<R extends object>(
  rows: readonly R[],
  columns: readonly TableColumn<R>[]
): Record<string, string> {
  const out: Record<string, string> = {}
  const all = rows.slice()
  for (const column of columns) {
    const c = loose(column)
    const total = c.total
    if (!total || c.slot) continue
    const render = (value: number) => (c.formatTotal ? c.formatTotal(value, all) : String(value))
    if (typeof total === 'function') {
      out[c.key] = render(total(all))
      continue
    }
    const values = rows.map((row) => columnValue(row, column)).filter((v) => !isEmpty(v))
    if (total === 'count') {
      out[c.key] = render(values.length)
      continue
    }
    const nums = values
      .map((v) => (typeof v === 'number' ? v : Number(v)))
      .filter((n) => !Number.isNaN(n))
    if (total === 'avg' && nums.length === 0) {
      out[c.key] = ''
      continue
    }
    const sum = nums.reduce((a, b) => a + b, 0)
    out[c.key] = render(total === 'sum' ? sum : sum / nums.length)
  }
  return out
}
