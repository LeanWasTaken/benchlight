<!-- Type fixture: `bun run typecheck` fails if BlTable stops taking interface rows, stops typing
     column keys, rowKey and format() from the row, or stops typing the cell slots from the columns. -->
<template>
  <!-- Columns typed as TableColumn<User>[]: keys are `string`, so every cell slot is `unknown`. -->
  <BlTable caption="Users" :columns="columns" :rows="users" row-key="id">
    <template #cell-name="{ value }">{{ unknownValue(value) }}</template>
    <template #cell-actions="{ row }">
      <button type="button">{{ row.id.toFixed(0) }}</button>
    </template>
  </BlTable>
  <!-- Literal columns: each cell slot's value follows its column's kind. -->
  <BlTable caption="Users" :columns="literal" :rows="users" row-key="id">
    <template #cell-name="{ value }">{{ upper(value) }}</template>
    <!-- @vue-expect-error with literal keys, an unknown cell slot name fails -->
    <template #cell-nmae>?</template>
    <template #cell-note="{ value }">{{ value ?? '' }}</template>
    <template #cell-bytes="{ value }">
      {{ upper(value) }}
      <!-- @vue-expect-error a derived column's value is what value() returns, not Row['bytes'] -->
      {{ value.toFixed(1) }}
    </template>
    <template #cell-id="{ value, row }">
      {{ isUndefined(value) }}
      <!-- @vue-expect-error a slot-only column has no value -->
      {{ upper(value) }}
      {{ row.name }}
    </template>
  </BlTable>
  <!-- @vue-expect-error rowKey is a key of the row (or a function) -->
  <BlTable caption="Users" :columns="columns" :rows="users" row-key="nmae" />
</template>

<script setup lang="ts">
  import BlTable from '../../vue/components/BlTable.vue'
  import type { DerivedColumn, TableColumn } from '../../vue/index'

  interface User {
    id: number
    name: string
    note?: string
    bytes: number
  }

  const users: User[] = [{ id: 1, name: 'Ada', bytes: 2048 }]
  const upper = (value: string) => value.toUpperCase()
  const unknownValue = (value: unknown) => String(value)
  const isUndefined = (value: undefined) => value === undefined

  // Literal columns (`as const` keeps every key literal; `satisfies` checks them). A slot-only column on the row key `id`
  // and a derived column on the row key `bytes` type their slots by kind, not by Row[key].
  const literal = [
    { key: 'name', label: 'Name' },
    { key: 'note', label: 'Note' },
    { key: 'bytes', label: 'KiB', value: (u: User) => String(u.bytes / 1024) },
    { key: 'id', label: '', slot: true }
  ] as const satisfies readonly TableColumn<User>[]

  // Limits, by design: inside a TableColumn<Row>[] array a derived column's format() cannot infer
  // its parameter from value(), so annotate it or type the column as DerivedColumn<Row, V>.
  // format() there is a method (bivariant), so a mismatched annotation still compiles.
  // A derived column typed on its own gives format() the type value() returns.
  const rate: DerivedColumn<User, number> = {
    key: 'rate',
    label: 'Rate',
    value: (u) => u.bytes / 1024,
    format: (v) => v.toFixed(1)
  }

  const columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name', format: (v) => v.toUpperCase() },
    { key: 'note', label: 'Note', format: (v) => v ?? '-' },
    {
      key: 'bytes',
      label: 'Bytes',
      total: 'sum',
      formatTotal: (v, rows) => `${v} / ${rows.length}`
    },
    // Inline, value() is checked against the row and format() takes the type it is given.
    { key: 'kib', label: 'KiB', value: (u) => u.bytes / 1024, format: (v: number) => v.toFixed(1) },
    rate,
    { key: 'actions', label: '', slot: true }
  ]

  const rejected: TableColumn<User>[] = [
    // @ts-expect-error a key that is not a row key needs value() or slot: true
    { key: 'nmae', label: 'Name' },
    // @ts-expect-error format() gets the row value's type
    { key: 'bytes', label: 'Bytes', format: (v: string) => v },
    // @ts-expect-error a slot-only column is never sortable
    { key: 'actions', label: '', slot: true, sortable: true },
    // @ts-expect-error a custom total returns a number; text belongs in the footer slot
    { key: 'bytes', label: 'Bytes', total: () => 'n/a' }
  ]
  void rejected
</script>
