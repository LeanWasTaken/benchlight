<template>
  <BlSectionHead :level="3" eyebrow="Default" heading="Sorting, paging and row links" />
  <div data-demo="table-default">
    <BlTable
      v-model:sort="sort"
      v-model:page="page"
      caption="Connected clients"
      :columns="clientColumns"
      :rows="clients"
      row-key="name"
      :page-size="5"
      :row-link="clientLink"
    />
  </div>

  <BlSectionHead :level="3" eyebrow="Narrow card" heading="Always stacked" />
  <div class="pg-card" data-demo="table-narrow">
    <BlTable
      caption="Connected clients, narrow"
      :columns="clientColumns"
      :rows="narrowRows"
      row-key="name"
    />
  </div>

  <BlSectionHead :level="3" eyebrow="Scroll mode" heading="Six columns" />
  <div data-demo="table-scroll">
    <BlTable
      scroll
      caption="Connected clients, all columns"
      :columns="clientColumnsWide"
      :rows="clients.slice(0, 5)"
      row-key="name"
      :row-link="() => ({ href: '#scroll-row' })"
    />
  </div>

  <BlSectionHead :level="3" eyebrow="Compact" heading="Totals, a hidden caption and slots" />
  <div data-demo="table-totals">
    <BlTable
      compact
      caption-hidden
      caption="Totals by band"
      :columns="totalColumns"
      :rows="bands"
      row-key="band"
      locale="en"
      :labels="{ total: 'Sum' }"
    >
      <template #cell-clients="{ value }">
        <strong>{{ value }}</strong>
      </template>
      <template #head-share>Share</template>
    </BlTable>
  </div>

  <BlSectionHead :level="3" eyebrow="Actions" heading="Row activate and the empty state" />
  <div data-demo="table-activate">
    <BlTable
      caption="Activate a row"
      :columns="clientColumns.slice(0, 2)"
      :rows="clients.slice(0, 3)"
      row-key="name"
      @row-activate="activated = $event.name"
    >
      <template #footer>
        <td role="cell" colspan="2">Activated: {{ activated ?? 'none' }}</td>
      </template>
    </BlTable>
  </div>
  <div data-demo="table-empty">
    <BlTable caption="No clients" :columns="clientColumns" :rows="[]">
      <template #empty>Nothing is connected.</template>
    </BlTable>
  </div>

  <BlSectionHead :level="3" eyebrow="Manual" heading="Server-side sorting and paging" />
  <div data-demo="table-manual">
    <BlTable
      v-model:sort="manualSort"
      v-model:page="manualPage"
      manual
      caption="Manual clients"
      :columns="clientColumns.slice(0, 3)"
      :rows="manualRows"
      row-key="name"
      :page-size="4"
      :total-rows="clients.length"
      :totals="{ signal: 'avg -58 dBm' }"
    />
  </div>

  <BlSectionHead :level="3" eyebrow="Pagination" heading="Standalone" />
  <BlPagination
    v-model:page="standalonePage"
    aria-label="Standalone pages"
    :total="95"
    :page-size="5"
  />
  <BlPagination :page="10" aria-label="Sibling pages" :total="200" :page-size="10" :siblings="2" />
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import type { TableColumn, TableSort } from '../../../vue'
  import { BlPagination, BlSectionHead, BlTable } from '../../../vue'
  import { clientColumns, clientColumnsWide, clients } from './data'

  // App passes a fresh array on every render, so a re-render makes the narrow table re-measure.
  defineProps<{ narrowRows: typeof clients }>()

  const sort = ref<TableSort | null>(null)
  const page = ref(1)
  const clientLink = () => ({ href: '#tables' })
  const activated = ref<string | null>(null)

  const bands = [
    { band: '2.4 GHz', clients: 6, share: 50 },
    { band: '5 GHz', clients: 6, share: 50 },
    { band: '6 GHz', clients: 0, share: 0 }
  ]
  const totalColumns: TableColumn<(typeof bands)[number]>[] = [
    { key: 'band', label: 'Band', primary: true },
    { key: 'clients', label: 'Clients', numeric: true, total: 'sum' },
    {
      key: 'share',
      label: 'Share',
      numeric: true,
      total: (rows) => rows.length,
      formatTotal: (n) => `${n} bands`
    }
  ]

  // Manual mode: the page owns the data, so it sorts and slices here.
  const manualSort = ref<TableSort | null>(null)
  const manualPage = ref(1)
  const manualRows = computed(() => {
    const rows = [...clients]
    const s = manualSort.value
    if (s) {
      const key = s.key as keyof (typeof clients)[number]
      rows.sort((a, b) => (a[key] > b[key] ? 1 : -1) * (s.dir === 'asc' ? 1 : -1))
    }
    return rows.slice((manualPage.value - 1) * 4, manualPage.value * 4)
  })
  const standalonePage = ref(3)
</script>
