<template>
  <dialog
    ref="el"
    class="bl-lightbox"
    :aria-label="text.dialog"
    :aria-describedby="hasCaption() ? captionId : undefined"
    @cancel="onCancel"
    @close="onClose"
    @keydown="onKeydown"
  >
    <div class="bl-lightbox__bar">
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
    </div>
    <figure
      v-if="item"
      ref="stage"
      class="bl-lightbox__stage"
      :data-zoomed="zoomed ? '' : undefined"
      @pointerdown="onStageDown"
      @pointermove="onStageMove"
      @pointerup="onStageUp"
      @pointercancel="onStageCancel"
      @click="onStageClick"
    >
      <slot :item="item" :index="current">
        <p v-if="status === 'failed'" class="bl-lightbox__message">
          {{ item.alt || item.caption || text.failed }}
        </p>
        <img
          v-else
          ref="media"
          :key="`${current}:${item.src}`"
          class="bl-lightbox__media"
          :src="item.src"
          :srcset="item.srcset"
          :sizes="item.sizes ?? '100vw'"
          :alt="item.alt"
          :width="item.width"
          :height="item.height"
          :data-loaded="status === 'loaded' ? 'true' : 'false'"
          draggable="false"
          @load="onLoad"
          @error="onError"
        />
      </slot>
      <figcaption v-if="hasCaption()" :id="captionId" class="bl-lightbox__caption">
        <Nodes v-if="captionNodes()" :nodes="captionNodes()!" />
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

<script setup lang="ts">
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
    useSlots,
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
      items: readonly LightboxItem[]
      loop?: boolean
      labels?: Partial<LabelOverrides<LightboxLabels>>
    }>(),
    { loop: false }
  )
  defineSlots<{
    default?: (scope: { item: LightboxItem; index: number }) => VNode[]
    caption?: (scope: { item: LightboxItem; index: number }) => VNode[]
  }>()
  const open = defineModel<boolean>('open', { required: true })
  const index = defineModel<number>('index', { default: 0 })
  const emit = defineEmits<{
    close: [payload: DialogCloseEvent]
  }>()
  const slots = useSlots()

  const el = ref<HTMLDialogElement>()
  const toasts = ref<HTMLElement>()
  const stage = ref<HTMLElement>()
  const media = ref<HTMLImageElement>()
  const prev = ref<InstanceType<typeof BlButton>>()
  const next = ref<InstanceType<typeof BlButton>>()
  const captionId = useId()
  const text = computed<LightboxLabels>(() =>
    mergeLabels(
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
  const item = computed<LightboxItem | undefined>(() => props.items[current.value])
  const many = computed(() => props.items.length > 1)
  // The caption slot is evaluated once per render: an empty one falls back to item.caption, and
  // with neither there is no figcaption for aria-describedby to point at.
  let captionCache: VNode[] | null | undefined
  onBeforeUpdate(() => {
    captionCache = undefined
  })
  function captionNodes(): VNode[] | null {
    if (captionCache === undefined) {
      const it = item.value
      const nodes = it ? slots['caption']?.({ item: it, index: current.value }) : undefined
      captionCache = hasContent(nodes) ? nodes! : null
    }
    return captionCache
  }
  const hasCaption = () => Boolean(item.value?.caption) || captionNodes() !== null
  const Nodes = (p: { nodes: VNode[] }) => p.nodes
  const status = ref<'loading' | 'loaded' | 'failed'>('loading')
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
  watch([current, () => item.value?.src], () => {
    status.value = 'loading'
    // A focused nav button that just became disabled at an end would drop focus to <body>.
    nextTick(() => {
      const [a, b] = [prev.value?.$el, next.value?.$el] as (HTMLButtonElement | undefined)[]
      if (a?.disabled && document.activeElement === a) b?.focus()
      else if (b?.disabled && document.activeElement === b) a?.focus()
    })
  })

  const unnamed = new Set<string>()
  watch(
    () => props.items,
    (items) => {
      // A default slot renders its own media and names it there.
      if (slots['default']) return
      for (const it of items) {
        if (it.alt !== '' || it.caption || unnamed.has(it.src)) continue
        unnamed.add(it.src)
        warn(`BlLightbox: ${it.src} has an empty alt and no caption, so nothing names it.`)
      }
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
  const { closeWith, onCancel, onClose } = useModal({
    el,
    toasts,
    open: active,
    dismissible: () => true,
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
    if (i === current.value || i < 0 || i >= props.items.length) return
    index.value = i
    announcement.value = text.value.position(i + 1, props.items.length)
  }
  function previous(): void {
    const i = current.value
    go(i > 0 ? i - 1 : props.loop ? props.items.length - 1 : i)
  }
  function nextItem(): void {
    const i = current.value
    go(i < props.items.length - 1 ? i + 1 : props.loop ? 0 : i)
  }

  const isRtl = () => !!el.value && getComputedStyle(el.value).direction === 'rtl'

  // Media with its own controls keeps its keys and drags (seeking, volume).
  const interactive = (target: EventTarget | null) =>
    target instanceof Element && target.closest('iframe, [controls]') !== null

  function onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || !many.value) return
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

  function onLoad(event: Event): void {
    if (event.currentTarget !== media.value) return
    status.value = 'loaded'
    preload()
  }
  function onError(event: Event): void {
    if (event.currentTarget === media.value) status.value = 'failed'
  }
  function preload(): void {
    const n = props.items.length
    if (n < 2) return
    const i = current.value
    const around = [i - 1, i + 1]
      .map((j) => (props.loop ? (j + n) % n : j))
      .filter((j, k, all) => j >= 0 && j < n && j !== i && all.indexOf(j) === k)
    for (const j of around) {
      const neighbour = props.items[j]!
      const image = new Image()
      image.sizes = neighbour.sizes ?? '100vw'
      if (neighbour.srcset) image.srcset = neighbour.srcset
      image.src = neighbour.src
    }
  }
</script>
