<template>
  <div>
    <BlSkipLink />
    <BlSiteBar>
      <template #brand>
        <NuxtLink to="/" class="bl-site-bar__brand">FIXTURE</NuxtLink>
      </template>
      <template #nav>
        <BlNavLink :as="NuxtLink" to="/" current>Home</BlNavLink>
      </template>
      <template #actions>
        <BlAppearanceSwitch />
      </template>
    </BlSiteBar>
    <main id="main-content" class="bl-col">
      <h1 class="bl-display bl-display--lg bl-rise" :style="blRiseDelay(1)">Fixture</h1>
      <p class="bg-surface text-ink-2 font-display">tailwind utilities</p>
      <BlLed state="on" />
      <BlSpecPanel :rows="[{ label: 'Refdes', value: 'SW-01' }]" />
      <BlTable
        v-model:sort="sort"
        caption="Items"
        :columns="columns"
        :rows="rows"
        row-key="name"
        :page-size="2"
        :row-link="rowLink"
      />
    </main>
    <BlColophon :items="['fixture']" />
  </div>
</template>

<script setup lang="ts">
  import { NuxtLink } from '#components'
  import type { TableColumn } from 'benchlight/vue'

  interface Row {
    name: string
    value: number
  }

  const sort = ref<{ key: string; dir: 'asc' | 'desc' } | null>(null)
  const columns: TableColumn<Row>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'value', label: 'Value', numeric: true, sortable: true }
  ]
  const rows: Row[] = [
    { name: 'alpha', value: 3 },
    { name: 'beta', value: 1 },
    { name: 'gamma', value: 2 }
  ]
  const rowLink = () => ({ href: '#row' })
</script>
