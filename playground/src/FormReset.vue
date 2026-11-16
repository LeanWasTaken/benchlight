<template>
  <main id="main-content" class="bl-col">
    <!-- Behaviour page for tests/visual/form-reset.spec.ts: prefilled v-models, one reset form. -->
    <form id="reset-form">
      <BlInput v-model="text" aria-label="Text" />
      <BlSelect v-model="choice" aria-label="Choice" :options="options" />
      <BlRange v-model="level" aria-label="Level" :min="0" :max="100" />
      <BlNumberField v-model="count" aria-label="Count" />
      <BlTextarea v-model="note" aria-label="Note" />
      <BlSegmented v-model="seg" aria-label="Segment" :options="options" />
    </form>
    <BlInput v-model="outside" form="reset-form" aria-label="Outside" />
    <BlSegmented
      v-model="segOutside"
      form="reset-form"
      aria-label="Segment outside"
      :options="options"
    />
    <output data-state>{{
      JSON.stringify({ text, choice, level, count, note, seg, outside, segOutside })
    }}</output>
  </main>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { BlInput, BlNumberField, BlRange, BlSegmented, BlSelect, BlTextarea } from '../../vue'

  const options = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' }
  ]
  const text = ref('hello')
  const choice = ref('b')
  const level = ref(30)
  const count = ref<number | null>(7)
  const note = ref('memo')
  const seg = ref('c')
  const outside = ref('away')
  const segOutside = ref('b')
</script>
