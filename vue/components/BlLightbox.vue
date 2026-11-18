<template>
  <dialog
    ref="el"
    class="bl-lightbox"
    tabindex="-1"
    :aria-labelledby="hasTitle() ? titleId : undefined"
    :aria-label="hasTitle() ? undefined : text.dialog"
    :aria-describedby="hasCaption() ? captionId : undefined"
    @cancel="onCancel"
    @close="onClose"
    @keydown="onKeydown"
  >
    <div ref="bar" class="bl-lightbox__bar">
      <BlButton
        class="bl-lightbox__close"
        variant="ghost"
        :aria-label="text.close"
        @click="closeWith('button')"
      >
        <template #icon>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </template>
      </BlButton>
      <p v-if="many" class="bl-lightbox__count" aria-hidden="true">
        {{ current + 1 }} / {{ items.length }}
      </p>
      <h2 v-if="hasTitle()" :id="titleId" class="bl-lightbox__title">
        <Nodes v-if="slotNodes('title')" :nodes="slotNodes('title')!" />
        <template v-else>{{ title }}</template>
      </h2>
      <div v-if="slotNodes('actions')" class="bl-lightbox__actions">
        <Nodes :nodes="slotNodes('actions')!" />
      </div>
    </div>
    <figure
      v-if="item"
      ref="stage"
      class="bl-lightbox__stage"
      :data-loaded="status === 'loaded' ? 'true' : 'false'"
      :data-zoomed="zoomed ? '' : undefined"
      @pointerdown="onStageDown"
      @pointermove="onStageMove"
      @pointerup="onStageUp"
      @pointercancel="onStageCancel"
      @click="onStageClick"
    >
      <p v-if="status === 'failed'" class="bl-lightbox__message">{{ failure() }}</p>
      <slot
        v-else
        :item="item"
        :index="current"
        :loaded="loadedFor(generation)"
        :failed="failedFor(generation)"
      >
        <img
          v-if="item.src"
          ref="media"
          :key="`${current}:${item.src}`"
          class="bl-lightbox__media"
          :src="item.src"
          :srcset="item.srcset"
          :sizes="item.sizes ?? '100vw'"
          :alt="item.alt ?? ''"
          :width="item.width"
          :height="item.height"
          :data-loaded="status === 'loaded' ? 'true' : 'false'"
          draggable="false"
          @load="onLoad"
          @error="onError"
        />
        <p v-else class="bl-lightbox__message">{{ failure() }}</p>
      </slot>
      <figcaption v-if="hasCaption()" :id="captionId" class="bl-lightbox__caption">
        <Nodes v-if="slotNodes('caption')" :nodes="slotNodes('caption')!" />
        <template v-else>{{ item.caption }}</template>
      </figcaption>
    </figure>
    <template v-if="many">
      <BlButton
        ref="prev"
        class="bl-lightbox__nav bl-lightbox__nav--prev"
        variant="ghost"
        :aria-label="text.previous"
        :disabled="!loop && current === 0"
        @click="previous"
      >
        <template #icon>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </template>
      </BlButton>
      <BlButton
        ref="next"
        class="bl-lightbox__nav bl-lightbox__nav--next"
        variant="ghost"
        :aria-label="text.next"
        :disabled="!loop && current === items.length - 1"
        @click="nextItem"
      >
        <template #icon>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 3l5 5-5 5" />
          </svg>
        </template>
      </BlButton>
      <p class="bl-sr-only" aria-live="polite">{{ announcement }}</p>
    </template>
    <div ref="toasts" class="bl-lightbox__toasts" />
  </dialog>
</template>

<script setup lang="ts" generic="T extends LightboxItem">
  import {
    computed,
    nextTick,
    onActivated,
    onBeforeUnmount,
    onBeforeUpdate,
    onDeactivated,
    onMounted,
    ref,
    useId,
    watch,
    type VNode
  } from 'vue'
  import { warn } from '../internal/dev'
  import { mergeLabels } from '../internal/labels'
  import { hasContent } from '../internal/slots'
  import { useModal } from '../internal/useModal'
  import type { DialogCloseEvent, LabelOverrides, LightboxItem, LightboxLabels } from '../types'
  import BlButton from './BlButton.vue'

  const props = withDefaults(
    defineProps<{
      items: readonly T[]
      loop?: boolean
      title?: string
      preload?: number | false
      announce?: 'position' | 'position+caption'
      labels?: Partial<LabelOverrides<LightboxLabels<T>>>
    }>(),
    { loop: false, preload: 1, announce: 'position' }
  )
  const slots = defineSlots<{
    default?: (scope: {
      item: T
      index: number
      loaded: (size?: { width: number; height: number }) => void
      failed: () => void
    }) => VNode[]
    caption?: (scope: { item: T; index: number }) => VNode[]
    title?: (scope: { item: T; index: number }) => VNode[]
    actions?: (scope: { item: T; index: number }) => VNode[]
  }>()
  const open = defineModel<boolean>('open', { required: true })
  const index = defineModel<number>('index', { default: 0 })
  const emit = defineEmits<{
    close: [payload: DialogCloseEvent]
  }>()

  const el = ref<HTMLDialogElement>()
  const toasts = ref<HTMLElement>()
  const bar = ref<HTMLElement>()
  const stage = ref<HTMLElement>()
  const media = ref<HTMLImageElement>()
  const prev = ref<InstanceType<typeof BlButton>>()
  const next = ref<InstanceType<typeof BlButton>>()
  const captionId = useId()
  const titleId = useId()
  const text = computed<LightboxLabels<T>>(() =>
    mergeLabels<LightboxLabels<T>>(
      {
        dialog: 'Image viewer',
        close: 'Close',
        previous: 'Previous image',
        next: 'Next image',
        failed: 'The image could not be loaded.',
        position: (i: number, n: number) => `Image ${i} of ${n}`
      },
      props.labels
    )
  )

  const clamp = (i: number) =>
    Math.min(Math.max(Number.isFinite(i) ? Math.trunc(i) : 0, 0), props.items.length - 1)
  const current = computed(() => Math.max(clamp(index.value), 0))
  const item = computed<T | undefined>(() => props.items[current.value])
  const many = computed(() => props.items.length > 1)
  // Each optional slot is evaluated once per render: an empty one falls back (caption and title
  // to the item or prop, actions to nothing), and the dialog's aria attributes follow.
  type Named = 'caption' | 'title' | 'actions'
  let rendered: Partial<Record<Named, VNode[] | null>> = {}
  onBeforeUpdate(() => {
    rendered = {}
  })
  function slotNodes(name: Named): VNode[] | null {
    if (!(name in rendered)) {
      const it = item.value
      const nodes = it ? slots[name]?.({ item: it, index: current.value }) : undefined
      rendered[name] = hasContent(nodes) ? nodes! : null
    }
    return rendered[name] ?? null
  }
  const hasCaption = () => Boolean(item.value?.caption) || slotNodes('caption') !== null
  const hasTitle = () => Boolean(props.title) || slotNodes('title') !== null
  const Nodes = (p: { nodes: VNode[] }) => p.nodes
  const status = ref<'loading' | 'loaded' | 'failed'>('loading')
  const failure = () => item.value?.alt || item.value?.caption || text.value.failed
  const announcement = ref('')

  // An index the parent set out of range is a mistake; one left behind by shrinking items is not.
  watch(
    [() => index.value, () => props.items.length],
    ([i, length], old) => {
      if (length === 0) return
      const fixed = clamp(i)
      if (fixed === i) return
      if (!old || old[0] !== i)
        warn(`BlLightbox: index ${i} is not an item index (0 to ${length - 1}); using ${fixed}.`)
      index.value = fixed
    },
    { immediate: true }
  )
  // Each item shown starts a new generation: loaded()/failed() handed to an earlier one do nothing.
  let generation = 0
  watch([current, () => item.value?.src, () => item.value?.key], () => {
    generation++
    status.value = 'loading'
    // A focused nav button that just became disabled at an end would drop focus to <body>.
    nextTick(() => {
      const [a, b] = [prev.value?.$el, next.value?.$el] as (HTMLButtonElement | undefined)[]
      if (a?.disabled && document.activeElement === a) b?.focus()
      else if (b?.disabled && document.activeElement === b) a?.focus()
    })
  })

  const warned = new Set<string>()
  function warnFor(id: string, message: string): void {
    if (warned.has(id)) return
    warned.add(id)
    warn(message)
  }
  watch(
    () => props.items,
    (items) => {
      // A default slot renders its own media and names it there.
      if (slots.default) return
      items.forEach((it, i) => {
        const key = String(it.key ?? i)
        if (!it.src)
          warnFor(`src:${key}`, `BlLightbox: item ${key} has no src and there is no default slot.`)
        else if (!it.alt && !it.caption)
          warnFor(
            `alt:${key}`,
            `BlLightbox: ${it.src} (item ${key}) has no alt and no caption, so nothing names it.`
          )
      })
    },
    { immediate: true }
  )

  // Empty items never show the dialog; opening waits for items. Emptied while open, it closes.
  const active = computed({
    get: () => open.value && props.items.length > 0,
    set: (value) => (open.value = value)
  })
  watch(
    () => open.value && props.items.length === 0,
    (empty) => {
      if (empty) warn('BlLightbox: items is empty, so there is nothing to show.')
    },
    { immediate: true }
  )

  // The dialog itself is not a backdrop here: a tap in the bar or the bottom row would close it.
  // Its controls and stage are inert during the exit; the dialog keeps its toast host usable.
  const { closeWith, onCancel, onClose, isOpen } = useModal({
    el,
    toasts,
    open: active,
    dismissible: () => true,
    inert: () => [bar.value, stage.value, prev.value?.$el, next.value?.$el],
    emitClose: (payload) => {
      announcement.value = ''
      if (open.value && props.items.length === 0) open.value = false
      emit('close', payload)
    }
  })

  // Pinch-zoomed, a one-finger drag pans the page: the stage hands touch back to the browser.
  const zoomed = ref(false)
  const viewport = () => (typeof visualViewport === 'undefined' ? null : visualViewport)
  function onViewportResize(): void {
    zoomed.value = (viewport()?.scale ?? 1) > 1.01
  }
  function watchZoom(on: boolean): void {
    const vv = viewport()
    if (!vv) return
    if (on) {
      vv.addEventListener('resize', onViewportResize)
      onViewportResize()
    } else vv.removeEventListener('resize', onViewportResize)
  }
  watch(active, watchZoom)
  onMounted(() => active.value && watchZoom(true))
  onActivated(() => active.value && watchZoom(true))
  onDeactivated(() => watchZoom(false))
  onBeforeUnmount(() => watchZoom(false))

  function go(i: number): void {
    const n = props.items.length
    if (!Number.isInteger(i) || i === current.value || i < 0 || i >= n) return
    index.value = i
    // Only while shown: a live region filled before opening would speak on open.
    if (!isOpen()) return
    const it = props.items[i]!
    const position = text.value.position(i + 1, n, it)
    const extra = props.announce === 'position+caption' ? it.caption || it.alt : ''
    announcement.value = extra ? `${position}, ${extra}` : position
  }
  function previous(): void {
    const i = current.value
    go(i > 0 ? i - 1 : props.loop ? props.items.length - 1 : i)
  }
  function nextItem(): void {
    const i = current.value
    go(i < props.items.length - 1 ? i + 1 : props.loop ? 0 : i)
  }
  defineExpose({ next: nextItem, previous, go })

  const isRtl = () => !!el.value && getComputedStyle(el.value).direction === 'rtl'

  // Media with its own controls keeps its keys and drags (seeking, volume), as does content that
  // opts out with data-bl-no-swipe (a map, a 3D view).
  const interactive = (target: EventTarget | null) =>
    target instanceof Element && target.closest('iframe, [controls], [data-bl-no-swipe]') !== null

  function onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || !many.value || el.value?.hasAttribute('data-closing')) return
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const target = event.target as HTMLElement | null
    if (target?.isContentEditable || target?.closest('input, textarea, select, [contenteditable]'))
      return
    if (interactive(target)) return
    const forward = isRtl() ? 'ArrowLeft' : 'ArrowRight'
    const back = isRtl() ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === forward) nextItem()
    else if (event.key === back) previous()
    else if (event.key === 'Home') go(0)
    else if (event.key === 'End') go(props.items.length - 1)
    else return
    event.preventDefault()
  }

  // Swipe: one pointer only; a second one (a pinch) cancels until every pointer is up. A drag
  // that moved never counts as a stage click.
  const pointers = new Set<number>()
  let start: { id: number; x: number; y: number } | null = null
  let downOnStage = false
  let dragged = false
  function onStageDown(event: PointerEvent): void {
    // A primary pointer starts a new gesture; forget any whose up landed outside the stage.
    if (event.isPrimary) pointers.clear()
    pointers.add(event.pointerId)
    if (pointers.size > 1) {
      start = null
      return
    }
    downOnStage = event.target === stage.value
    dragged = false
    start = null
    if (event.defaultPrevented || interactive(event.target) || zoomed.value) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    start = { id: event.pointerId, x: event.clientX, y: event.clientY }
  }
  function onStageMove(event: PointerEvent): void {
    if (!start || event.pointerId !== start.id || dragged) return
    if (Math.abs(event.clientX - start.x) < 10 && Math.abs(event.clientY - start.y) < 10) return
    dragged = true
    // Captured only once it is a drag: a captured tap would retarget its click to the stage.
    try {
      stage.value?.setPointerCapture(event.pointerId)
    } catch {
      // The pointer is already gone; the up event still arrives.
    }
  }
  function onStageUp(event: PointerEvent): void {
    pointers.delete(event.pointerId)
    const s = start
    if (!s || event.pointerId !== s.id) return
    start = null
    const dx = event.clientX - s.x
    const dy = event.clientY - s.y
    if (Math.hypot(dx, dy) >= 10) dragged = true
    if (event.defaultPrevented || zoomed.value) return
    const threshold = Math.max(48, 0.15 * (stage.value?.clientWidth ?? 0))
    if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return
    if (dx < 0 !== isRtl()) nextItem()
    else previous()
  }
  function onStageCancel(event: PointerEvent): void {
    pointers.delete(event.pointerId)
    start = null
  }
  // The stage is the backdrop: a press and release on it, outside the media and caption, closes.
  // A near miss beside a nav button (which sits over the stage from 40em up) does not.
  function onStageClick(event: MouseEvent): void {
    const backdrop = downOnStage && !dragged && event.target === stage.value
    downOnStage = false
    if (backdrop && !nearNav(event)) closeWith('backdrop')
  }
  function nearNav({ clientX: x, clientY: y }: MouseEvent): boolean {
    return [prev.value?.$el, next.value?.$el].some((button: Element | undefined) => {
      if (!button) return false
      const r = button.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return false // not laid out
      const slop = 24
      return x >= r.left - slop && x <= r.right + slop && y >= r.top - slop && y <= r.bottom + slop
    })
  }

  // The built-in image and a default slot report through the same states.
  function settle(): void {
    if (status.value === 'loaded') return
    status.value = 'loaded'
    preloadNeighbours()
  }
  const loadedFor = (g: number) => () => {
    if (g === generation) settle()
  }
  const failedFor = (g: number) => () => {
    if (g === generation) status.value = 'failed'
  }
  function onLoad(event: Event): void {
    if (event.currentTarget === media.value) settle()
  }
  function onError(event: Event): void {
    if (event.currentTarget === media.value) status.value = 'failed'
  }
  // `preload` neighbours each way (wrapping with loop), nearest first; only items with a src.
  function preloadNeighbours(): void {
    const n = props.items.length
    const reach = props.preload === false ? 0 : Math.min(Math.floor(props.preload), n - 1)
    const i = current.value
    const seen = new Set([i])
    for (let d = 1; d <= reach; d++) {
      for (const j of [i - d, i + d]) {
        const k = props.loop ? (j + n * d) % n : j
        if (k < 0 || k >= n || seen.has(k)) continue
        seen.add(k)
        const neighbour = props.items[k]!
        if (!neighbour.src) continue
        const image = new Image()
        image.sizes = neighbour.sizes ?? '100vw'
        if (neighbour.srcset) image.srcset = neighbour.srcset
        image.src = neighbour.src
      }
    }
  }
</script>
