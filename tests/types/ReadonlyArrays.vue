<!-- Type fixture: `bun run typecheck` fails if an array prop stops accepting a readonly array
     (`as const` data). -->
<template>
  <BlTable caption="Users" :columns="columns" :rows="rows" />
  <BlSelect :options="options" />
  <BlTabs :items="options" aria-label="Tabs" />
  <BlSegmented :options="options" aria-label="Mode" />
</template>

<script setup lang="ts">
  import BlSegmented from '../../vue/components/BlSegmented.vue'
  import BlSelect from '../../vue/components/BlSelect.vue'
  import BlTable from '../../vue/components/BlTable.vue'
  import BlTabs from '../../vue/components/BlTabs.vue'

  const rows: readonly { name: string }[] = [{ name: 'a' }]
  const columns = [{ key: 'name', label: 'Name' }] as const
  const options = [{ value: 'a', label: 'A' }] as const
</script>
