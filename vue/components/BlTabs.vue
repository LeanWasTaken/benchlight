<template>
  <div ref="root" class="bl-tabs">
    <div
      ref="list"
      class="bl-tabs__list"
      role="tablist"
      :aria-label="ariaLabel"
      @keydown="onKeydown"
    >
      <button
        v-for="(item, i) in items"
        :id="tabId(i)"
        :key="keyOf(item, i)"
        type="button"
        role="tab"
        class="bl-tabs__tab"
        :aria-selected="item.value === current ? 'true' : 'false'"
        :aria-controls="panelId(i)"
        :tabindex="item.value === current ? 0 : -1"
        :disabled="item.disabled || undefined"
        @click="select(item)"
      >
        {{ item.label }}
      </button>
    </div>
    <div
      v-for="(item, i) in items"
      :id="panelId(i)"
      :key="keyOf(item, i)"
      class="bl-tabs__panel"
      role="tabpanel"
      :aria-labelledby="tabId(i)"
      :tabindex="plain[i] ? 0 : undefined"
      :hidden="item.value !== current"
    >
      <slot :name="`panel-${item.value}`" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number">
  import { computed, onMounted, onUpdated, ref, useId, watch } from 'vue'
  import { warn } from '../internal/dev'
  import type { TabItem } from '../types'

  /**
   * Tabs (WAI-ARIA tabs pattern). One dynamic slot `panel-<value>` per item; every panel renders
   * and the inactive ones are `hidden`. See README.
   */
  const props = withDefaults(
    defineProps<{
      items: readonly TabItem<T>[]
      ariaLabel?: string
      activation?: 'auto' | 'manual'
    }>(),
    { activation: 'auto' }
  )
  const model = defineModel<T>()
  const slots = defineSlots<{
    [K in T as `panel-${K}`]?: () => unknown
  }>()

  const uid = useId()
  const tabId = (i: number) => `${uid}-tab-${i}`
  const panelId = (i: number) => `${uid}-panel-${i}`
  // Index plus value: stays unique (so patching stays defined) even with duplicate values, which
  // only warn.
  const keyOf = (item: TabItem<T>, i: number) => `${i}:${typeof item.value}:${item.value}`

  const root = ref<HTMLElement>()
  const list = ref<HTMLElement>()

  // The model when it names an enabled item, else the first enabled item (none when all are
  // disabled). Shown only: the model is never written here, it changes on a user selection.
  const current = computed<T | undefined>(() => {
    const value = model.value
    if (props.items.some((item) => item.value === value && !item.disabled)) return value
    return props.items.find((item) => !item.disabled)?.value
  })

  function select(item: TabItem<T>): void {
    if (!item.disabled) model.value = item.value
  }

  watch(
    () => props.ariaLabel,
    (name) => {
      if (name === undefined) warn('BlTabs: set `ariaLabel` (`aria-label`) to name the tablist.')
    },
    { immediate: true }
  )
  watch(
    () => props.items,
    (items) => {
      const seen = new Set<T>()
      for (const item of items) {
        if (seen.has(item.value)) warn(`BlTabs: duplicate value "${item.value}" in items.`)
        seen.add(item.value)
        if (!(slots as Record<string, unknown>)[`panel-${item.value}`])
          warn(`BlTabs: item "${item.value}" has no \`panel-${item.value}\` slot.`)
      }
    },
    { immediate: true }
  )

  function isRtl(el: HTMLElement): boolean {
    const dir = el.closest('[dir]')?.getAttribute('dir')?.toLowerCase()
    if (dir === 'rtl' || dir === 'ltr') return dir === 'rtl'
    return getComputedStyle(el).direction === 'rtl'
  }

  // Roving focus over the enabled tabs: Left/Right wrap (swapped under RTL), Home/End jump.
  // `auto` selects the tab focus lands on; `manual` waits for Enter or Space.
  function onKeydown(event: KeyboardEvent): void {
    // Modified keys belong to the browser and assistive tech (Alt+Arrow is history, Ctrl/Cmd+Home
    // scrolls, Shift+Arrow extends a selection); the pattern defines only the bare keys.
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const el = list.value
    if (!el) return
    const buttons = [...el.children] as HTMLButtonElement[]
    const from = buttons.indexOf(event.target as HTMLButtonElement)
    if (from < 0) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      select(props.items[from]!)
      return
    }
    const enabled = props.items.flatMap((item, i) => (item.disabled ? [] : [i]))
    if (enabled.length === 0) return
    let to: number | undefined
    if (event.key === 'Home') to = enabled[0]
    else if (event.key === 'End') to = enabled.at(-1)
    else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const forward = (event.key === 'ArrowRight') !== isRtl(el)
      const n = props.items.length
      for (let step = 1; step <= n; step++) {
        const i = (from + (forward ? step : -step) + n) % n
        if (!props.items[i]!.disabled) {
          to = i
          break
        }
      }
    }
    if (to === undefined) return
    event.preventDefault()
    buttons[to]?.focus()
    if (props.activation === 'auto') select(props.items[to]!)
  }

  // A panel joins the tab order only when nothing inside it can take focus, so Tab from the
  // tablist still lands somewhere. Measured after each render.
  const FOCUSABLE = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    'audio[controls]',
    'video[controls]',
    'summary',
    '[contenteditable]:not([contenteditable="false"])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',')
  const plain = ref<boolean[]>([])
  function measure(): void {
    const panels = [...(root.value?.children ?? [])].slice(1)
    const next = panels.map((panel) => !panel.querySelector(FOCUSABLE))
    if (next.length !== plain.value.length || next.some((v, i) => v !== plain.value[i]))
      plain.value = next
  }
  onMounted(measure)
  onUpdated(measure)
</script>
