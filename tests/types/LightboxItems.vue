<!-- Type fixture: `bun run typecheck` fails if BlLightbox stops taking a custom item type, stops
     typing its slot scopes from it, or starts accepting items that are not LightboxItems. -->
<template>
  <BlLightbox
    v-model:open="open"
    :items="photos"
    title="Credits"
    :labels="{ position: (i, n, item) => `${i}/${n} ${upper(item.credit)}` }"
  >
    <template #default="{ item, loaded, failed }">
      <img :src="item.src" :alt="upper(item.credit)" @load="loaded()" @error="failed()" />
    </template>
    <template #title="{ item, index }">{{ upper(item.credit) }} {{ index.toFixed(0) }}</template>
    <template #actions="{ item }">
      <a :href="item.original">{{ upper(item.credit) }}</a>
      <!-- @vue-expect-error not a field of the item type -->
      {{ item.nope }}
    </template>
    <template #caption="{ item }">{{ upper(item.credit) }}</template>
  </BlLightbox>
  <BlLightbox v-model:open="open" :items="drawings" :preload="false" announce="position+caption">
    <template #default="{ loaded }">
      <svg viewBox="0 0 10 10" @vue:mounted="loaded({ width: 10, height: 10 })" />
    </template>
  </BlLightbox>
  <!-- @vue-expect-error an item's src is a string -->
  <BlLightbox v-model:open="open" :items="[{ src: 1 }]" />
  <!-- @vue-expect-error position's item is the item type -->
  <BlLightbox
    v-model:open="open"
    :items="photos"
    :labels="{ position: (i, n, item) => item.nope }"
  />
  <!-- @vue-expect-error announce takes 'position' or 'position+caption' -->
  <BlLightbox v-model:open="open" :items="photos" announce="caption" />
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import BlLightbox from '../../vue/components/BlLightbox.vue'
  import type { LightboxItem } from '../../vue/index'

  interface Photo extends LightboxItem {
    src: string
    credit: string
    original: string
  }

  const open = ref(false)
  const photos: readonly Photo[] = [
    { src: 'a.jpg', alt: 'A', credit: 'Ada', original: 'a-full.jpg', key: 'a' }
  ]
  const drawings = [{ alt: 'A drawing', key: 1 }] as const
  const upper = (value: string) => value.toUpperCase()
</script>
