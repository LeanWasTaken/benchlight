import type { TableColumn, TableSort } from '../types'

export type TableRow = Record<string, unknown>

export function isEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value === 'number' && Number.isNaN(value))
  )
}

export function formatCell<R extends TableRow>(row: R, column: TableColumn<R>): string {
  const value = row[column.key]
  if (column.format) return column.format(value, row)
  return isEmpty(value) ? '' : String(value)
}

function sortValue<R extends TableRow>(row: R, column: TableColumn<R>): unknown {
  const raw = column.sortBy ? column.sortBy(row) : row[column.key]
  if (raw instanceof Date) {
    const time = raw.getTime()
    return Number.isNaN(time) ? null : time
  }
  if (column.numeric && !isEmpty(raw) && typeof raw !== 'number') {
    const n = Number(raw)
    return Number.isNaN(n) ? null : n
  }
  return raw
}

// Stable sort; empty values (null, undefined, '', NaN) always last; numbers numerically,
// everything else with a numeric-aware, case-insensitive collator.
export function sortRows<R extends TableRow>(
  rows: readonly R[],
  columns: readonly TableColumn<R>[],
  sort: TableSort | null,
  locale?: string
): R[] {
  const column = sort && columns.find((c) => c.key === sort.key)
  if (!sort || !column) return rows.slice()
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' })
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

export function computeTotals<R extends TableRow>(
  rows: readonly R[],
  columns: readonly TableColumn<R>[]
): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const column of columns) {
    const total = column.total
    if (!total) continue
    if (typeof total === 'function') {
      out[column.key] = total(rows.slice())
      continue
    }
    const values = rows.map((row) => row[column.key]).filter((v) => !isEmpty(v))
    if (total === 'count') {
      out[column.key] = values.length
      continue
    }
    const nums = values
      .map((v) => (typeof v === 'number' ? v : Number(v)))
      .filter((n) => !Number.isNaN(n))
    if (total === 'avg' && nums.length === 0) {
      out[column.key] = ''
      continue
    }
    const sum = nums.reduce((a, b) => a + b, 0)
    const value = total === 'sum' ? sum : sum / nums.length
    out[column.key] = column.format ? column.format(value) : value
  }
  return out
}
