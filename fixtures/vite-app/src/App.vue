<template>
  <main class="bl-col">
    <h1 class="bl-display bl-display--lg">Benchlight vite fixture</h1>
    <BlAppearanceSwitch />
    <BlButton variant="secondary">Back</BlButton>
    <BlLed tone="success" />
    <BlMeter label="Load" :value="0.5" />
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
</template>

<script setup>
  import { ref } from 'vue'
  import { BlAppearanceSwitch, BlButton, BlLed, BlMeter, BlTable } from 'benchlight/vue'

  const sort = ref(null)
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'value', label: 'Value', numeric: true, sortable: true }
  ]
  const rows = [
    { name: 'alpha', value: 3 },
    { name: 'beta', value: 1 },
    { name: 'gamma', value: 2 }
  ]
  const rowLink = () => ({ href: '#row' })
</script>
