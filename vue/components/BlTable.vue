<template>
  <div
    ref="root"
    v-bind="wrapperAttrs()"
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
      <table ref="table" role="table" class="bl-table__table" v-bind="tableAttrs()">
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
          <tr
            v-for="(row, index) in visibleRows"
            :key="keyOf(row, index)"
            role="row"
            :data-action="hasAction ? '' : undefined"
            @click="hasAction ? forward($event) : undefined"
          >
            <template v-for="column in columns" :key="column.key">
              <th
                v-if="column.key === primaryKey"
                role="rowheader"
                scope="row"
                class="bl-table__primary"
                :class="cellClass(column)"
                :style="minStyle(column)"
              >
                <template v-if="rowLink">
                  <component
                    :is="link.tag"
                    v-for="(link, linkIndex) in [linkFor(row)]"
                    :key="linkIndex"
                    v-bind="link.bind"
                    class="bl-table__action"
                  >
                    <slot
                      :name="`cell-${column.key}`"
                      :row="row"
                      :value="row[column.key]"
                      :column="column"
                      >{{ formatCell(row, column) }}</slot
                    >
                  </component>
                </template>
                <button
                  v-else-if="onRowActivate"
                  type="button"
                  class="bl-table__action"
                  @click="onRowActivate(row)"
                >
                  <slot
                    :name="`cell-${column.key}`"
                    :row="row"
                    :value="row[column.key]"
                    :column="column"
                    >{{ formatCell(row, column) }}</slot
                  >
                </button>
                <slot
                  v-else
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
        <tfoot v-if="hasFooter && visibleRows.length" role="rowgroup">
          <tr role="row" class="bl-table__total">
            <slot name="footer" :rows="sortedRows">
              <template v-for="column in columns" :key="column.key">
                <th
                  v-if="column.key === primaryKey"
                  role="rowheader"
                  scope="row"
                  class="bl-table__primary"
                >
                  {{ totalLabel(column.key) }}
                </th>
                <td
                  v-else
                  role="cell"
                  :class="cellClass(column)"
                  :data-label="column.label"
                  :data-empty="hasTotal(column.key) ? undefined : ''"
                >
                  <span class="bl-table__label" aria-hidden="true">{{ column.label }}</span>
                  {{ totalsMap[column.key] ?? '' }}
                </td>
              </template>
            </slot>
          </tr>
        </tfoot>
      </table>
    </div>
    <BlPagination
      v-if="pageSize"
      v-model:page="currentPage"
      :total="totalCount"
      :page-size="pageSize"
      :label="paginationLabels?.nav ?? `${caption}, pages`"
      :labels="paginationLabels"
    />
  </div>
</template>

<script setup lang="ts" generic="Row extends Record<string, unknown>">
  import { computed, ref, useAttrs, useId, useSlots, watch } from 'vue'
  import BlPagination from './BlPagination.vue'
  import { useTableFit } from '../internal/useTableFit'
  import { warn } from '../internal/dev'
  import { linkBindings, resolveTag } from '../internal/link'
  import {
    clampPage,
    computeTotals,
    formatCell,
    nextSort,
    pageSlice,
    sortRows
  } from '../internal/table'
  import type { LinkAs, LinkTo, PaginationLabels, TableColumn, TableLabels } from '../types'

  /**
   * Responsive table: stacks when its natural width does not fit (measured, not a breakpoint).
   * Dynamic slots `cell-<key>` and `head-<key>` exist per column key. See README.
   */
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

  defineOptions({ inheritAttrs: false })
  const attrs = useAttrs()
  // Naming, description and structure attributes describe the <table>, so they land there;
  // everything else (aria-hidden, aria-busy, aria-live, listeners, class, style, id, data-*) stays
  // on the wrapper, which also holds the sort strip and pagination. Functions evaluated in render,
  // so they re-run on any attr change.
  const TABLE_ATTRS = new Set([
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'aria-description',
    'aria-details',
    'aria-roledescription',
    'aria-rowcount',
    'aria-colcount'
  ])
  function tableAttrs(): Record<string, unknown> {
    return Object.fromEntries(Object.entries(attrs).filter(([key]) => TABLE_ATTRS.has(key)))
  }
  function wrapperAttrs(): Record<string, unknown> {
    return Object.fromEntries(Object.entries(attrs).filter(([key]) => !TABLE_ATTRS.has(key)))
  }

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
  const totalCount = computed(() =>
    props.manual ? (props.totalRows ?? props.rows.length) : props.rows.length
  )
  const currentPage = computed({
    get: () => (props.pageSize ? clampPage(page.value, totalCount.value, props.pageSize) : 1),
    set: (value: number) => {
      page.value = value
    }
  })
  watch(
    () => [totalCount.value, props.pageSize, page.value] as const,
    () => {
      if (props.pageSize && currentPage.value !== page.value) page.value = currentPage.value
    },
    { immediate: true }
  )
  const visibleRows = computed<Row[]>(() =>
    props.pageSize && !props.manual
      ? pageSlice(sortedRows.value, currentPage.value, props.pageSize)
      : sortedRows.value
  )

  const fit = useTableFit(root, table, scroller, {
    enabled: () => !props.scroll,
    deps: () => [
      props.rows,
      props.rows.length,
      props.columns,
      visibleRows.value.length,
      currentPage.value,
      props.scroll
    ]
  })

  const slots = useSlots()
  const hasAction = computed(() => !!props.rowLink || !!props.onRowActivate)
  if (props.rowLink && props.onRowActivate)
    warn('BlTable: rowLink and @row-activate are both set; rowLink wins.')
  if (!props.rowKey && (sortable.value.length || hasAction.value))
    warn('BlTable: set rowKey so rows keep identity when sorted or paged.')
  if (props.manual && props.pageSize && props.totalRows === undefined)
    warn('BlTable: manual paging needs totalRows.')

  function linkFor(row: Row): {
    tag: ReturnType<typeof resolveTag>
    bind: Record<string, unknown>
  } {
    const link = props.rowLink!(row)
    const tag = resolveTag(link.as, link.to, link.href, 'a')
    return { tag, bind: linkBindings(tag, link.to, link.href) }
  }

  const INTERACTIVE = 'a, button, input, select, textarea, label, [tabindex], [contenteditable]'
  function forward(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return
    const target = event.target as Element | null
    const row = event.currentTarget as HTMLElement
    // Only controls inside the row count; the scroller's own tabindex sits above it.
    const hit = target?.closest(INTERACTIVE)
    if (hit && row.contains(hit)) return
    if (window.getSelection()?.toString()) return
    row.querySelector<HTMLElement>('.bl-table__action')?.click()
  }

  const totalsMap = computed<Record<string, string | number>>(() =>
    props.manual ? (props.totals ?? {}) : computeTotals(props.rows, props.columns)
  )
  const hasFooter = computed(
    () =>
      !!slots.footer ||
      (props.manual
        ? !!props.totals && Object.keys(props.totals).length > 0
        : props.columns.some((c) => c.total))
  )
  function hasTotal(key: string): boolean {
    const value = totalsMap.value[key]
    return value !== undefined && value !== ''
  }
  function totalLabel(key: string): string {
    const value = totalsMap.value[key]
    return value === undefined || value === '' ? text.value.total : `${text.value.total} · ${value}`
  }

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
    return column.width ? { '--bl-table-col-min': column.width } : undefined
  }
</script>
