<template>
  <div
    ref="root"
    class="bl-table"
    :class="{ 'bl-table--compact': compact, 'bl-table--scroll': scroll }"
    :data-fit="fit.fitted.value ? '' : undefined"
    :data-stacked="fit.stacked.value ? '' : undefined"
  >
    <div v-if="fit.stacked.value && sortable.length" class="bl-table__sort-strip">
      <span class="bl-table__sort-strip-label">{{ text.sortStrip }}</span>
      <button
        v-for="column in sortable"
        :key="column.key"
        type="button"
        class="bl-table__sort"
        :data-dir="sort?.key === column.key ? sort.dir : undefined"
        @click="toggleSort(column.key)"
      >
        {{ column.label
        }}<span v-if="sort?.key === column.key" class="bl-sr-only"
          >, {{ sort.dir === 'asc' ? 'ascending' : 'descending' }}</span
        >
        <svg class="bl-table__sort-icon" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 7.5 6 4.5l3 3" fill="none" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
    </div>
    <div
      ref="scroller"
      class="bl-table__scroller"
      :tabindex="scroll && fit.overflowing.value ? 0 : undefined"
      :role="scroll && fit.overflowing.value ? 'region' : undefined"
      :aria-labelledby="scroll && fit.overflowing.value ? captionId : undefined"
    >
      <table ref="table" role="table" class="bl-table__table">
        <caption :id="captionId" :class="{ 'bl-sr-only': captionHidden }">
          <slot name="caption">{{ caption }}</slot>
        </caption>
        <thead role="rowgroup">
          <tr role="row">
            <th
              v-for="column in columns"
              :key="column.key"
              role="columnheader"
              scope="col"
              :class="cellClass(column)"
              :style="column.width ? { width: column.width } : undefined"
              :aria-sort="ariaSort(column.key)"
            >
              <component
                :is="fit.stacked.value ? 'span' : 'button'"
                v-if="column.sortable"
                :type="fit.stacked.value ? undefined : 'button'"
                class="bl-table__sort"
                @click="fit.stacked.value ? undefined : toggleSort(column.key)"
              >
                <slot :name="`head-${column.key}`" :column="column">{{ column.label }}</slot>
                <svg class="bl-table__sort-icon" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M3 7.5 6 4.5l3 3" fill="none" stroke="currentColor" stroke-width="1.5" />
                </svg>
              </component>
              <slot v-else :name="`head-${column.key}`" :column="column">{{ column.label }}</slot>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          <tr v-if="!visibleRows.length" role="row">
            <td role="cell" class="bl-table__empty" :colspan="columns.length">
              <slot name="empty">{{ text.empty }}</slot>
            </td>
          </tr>
          <tr v-for="(row, index) in visibleRows" :key="keyOf(row, index)" role="row">
            <template v-for="column in columns" :key="column.key">
              <th
                v-if="column.key === primaryKey"
                role="rowheader"
                scope="row"
                class="bl-table__primary"
                :class="cellClass(column)"
                :style="minStyle(column)"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :row="row"
                  :value="row[column.key]"
                  :column="column"
                  >{{ formatCell(row, column) }}</slot
                >
              </th>
              <td
                v-else
                role="cell"
                :class="cellClass(column)"
                :style="minStyle(column)"
                :data-label="column.label"
              >
                <span class="bl-table__label" aria-hidden="true">{{ column.label }}</span>
                <slot
                  :name="`cell-${column.key}`"
                  :row="row"
                  :value="row[column.key]"
                  :column="column"
                  >{{ formatCell(row, column) }}</slot
                >
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts" generic="Row extends Record<string, unknown>">
  import { computed, ref, useId } from 'vue'
  import { useTableFit } from '../internal/useTableFit'
  import { formatCell, nextSort, sortRows } from '../internal/table'
  import type { LinkAs, LinkTo, PaginationLabels, TableColumn, TableLabels } from '../types'

  const props = defineProps<{
    caption: string
    captionHidden?: boolean
    columns: TableColumn<Row>[]
    rows: Row[]
    rowKey?: string | ((row: Row) => string | number)
    scroll?: boolean
    compact?: boolean
    pageSize?: number
    manual?: boolean
    totalRows?: number
    totals?: Record<string, string | number>
    rowLink?: (row: Row) => { as?: LinkAs; to?: LinkTo; href?: string }
    onRowActivate?: (row: Row) => void
    locale?: string
    labels?: Partial<TableLabels>
    paginationLabels?: Partial<PaginationLabels>
  }>()
  const sort = defineModel<{ key: string; dir: 'asc' | 'desc' } | null>('sort', { default: null })
  const page = defineModel<number>('page', { default: 1 })

  const root = ref<HTMLElement | null>(null)
  const table = ref<HTMLElement | null>(null)
  const scroller = ref<HTMLElement | null>(null)
  const captionId = useId()

  const text = computed<TableLabels>(() => {
    const merged: TableLabels = { total: 'Total', empty: 'No data', sortStrip: 'Sort by' }
    for (const [key, value] of Object.entries(props.labels ?? {})) {
      if (value !== undefined) merged[key as keyof TableLabels] = value
    }
    return merged
  })
  const primaryKey = computed(() => (props.columns.find((c) => c.primary) ?? props.columns[0])?.key)
  const sortable = computed(() => props.columns.filter((c) => c.sortable))
  const sortedRows = computed<Row[]>(() =>
    props.manual
      ? props.rows.slice()
      : sortRows(props.rows, props.columns, sort.value, props.locale)
  )
  const visibleRows = computed<Row[]>(() => sortedRows.value)

  const fit = useTableFit(root, table, scroller, {
    enabled: () => !props.scroll,
    deps: () => [
      props.rows,
      props.rows.length,
      props.columns,
      visibleRows.value.length,
      props.scroll
    ]
  })

  function toggleSort(key: string): void {
    sort.value = nextSort(sort.value, key)
    if (props.pageSize) page.value = 1
  }
  function ariaSort(key: string): 'ascending' | 'descending' | undefined {
    if (sort.value?.key !== key) return undefined
    return sort.value.dir === 'asc' ? 'ascending' : 'descending'
  }
  function keyOf(row: Row, index: number): string | number {
    if (typeof props.rowKey === 'function') return props.rowKey(row)
    if (props.rowKey) return String(row[props.rowKey])
    return index
  }
  function cellClass(column: TableColumn<Row>): Record<string, boolean> {
    const align = column.align ?? (column.numeric ? 'end' : 'start')
    return {
      'bl-table__num': !!column.numeric,
      'bl-table__end': align === 'end',
      'bl-table__center': align === 'center'
    }
  }
  function minStyle(column: TableColumn<Row>): Record<string, string> | undefined {
    return column.width ? { '--bl-col-min': column.width } : undefined
  }
</script>
