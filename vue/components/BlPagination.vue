<template>
  <nav v-if="pages > 1" class="bl-pagination" :aria-label="label">
    <ul class="bl-pagination__list">
      <li>
        <button
          type="button"
          class="bl-pagination__prev"
          :aria-disabled="current <= 1 ? 'true' : undefined"
          @click="go(current - 1)"
        >
          {{ text.prev }}
        </button>
      </li>
      <li
        v-for="(item, index) in items"
        :key="item === 'gap' ? `gap-${index}` : item"
        class="bl-pagination__item"
      >
        <span v-if="item === 'gap'" class="bl-pagination__gap" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="bl-pagination__page"
          :aria-label="text.page(item)"
          :aria-current="item === current ? 'page' : undefined"
          @click="go(item)"
        >
          {{ item }}
        </button>
      </li>
      <li class="bl-pagination__compact">{{ text.pageOf(current, pages) }}</li>
      <li>
        <button
          type="button"
          class="bl-pagination__next"
          :aria-disabled="current >= pages ? 'true' : undefined"
          @click="go(current + 1)"
        >
          {{ text.next }}
        </button>
      </li>
    </ul>
    <p class="bl-pagination__range">{{ rangeText }}</p>
    <p class="bl-sr-only" aria-live="polite">{{ announcement }}</p>
  </nav>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { clampPage, pageCount, pageRange } from '../internal/table'
  import type { PaginationLabels } from '../types'

  const props = withDefaults(
    defineProps<{
      total: number
      pageSize: number
      label: string
      siblings?: number
      labels?: Partial<PaginationLabels>
    }>(),
    { siblings: 1 }
  )
  const page = defineModel<number>('page', { default: 1 })

  const text = computed<Omit<PaginationLabels, 'nav'>>(() => {
    const merged: Omit<PaginationLabels, 'nav'> = {
      prev: 'Previous',
      next: 'Next',
      page: (n) => `Page ${n}`,
      pageOf: (p, of) => `Page ${p} of ${of}`,
      range: (from, to, total) => `${from}–${to} of ${total}`
    }
    for (const [key, value] of Object.entries(props.labels ?? {})) {
      if (value !== undefined && key !== 'nav') Object.assign(merged, { [key]: value })
    }
    return merged
  })
  const pages = computed(() => pageCount(props.total, props.pageSize))
  const current = computed(() => clampPage(page.value, props.total, props.pageSize))
  const items = computed(() => pageRange(current.value, pages.value, props.siblings))
  const rangeText = computed(() => {
    const from = (current.value - 1) * props.pageSize + 1
    const to = Math.min(props.total, current.value * props.pageSize)
    return text.value.range(from, to, props.total)
  })
  const announcement = ref('')
  watch(current, () => {
    announcement.value = rangeText.value
  })

  function go(target: number): void {
    const next = clampPage(target, props.total, props.pageSize)
    if (next === current.value) return
    page.value = next
  }
</script>
