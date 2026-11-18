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
      <div v-if="zoomable && zoomControls" class="bl-lightbox__zoom">
        <BlButton
          ref="zoomOutButton"
          variant="ghost"
          :aria-label="text.zoomOut"
          :disabled="!canZoom() || view.zoom <= 1"
          @click="zoomer.zoomBy(-1)"
        >
          <template #icon>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 8h10" />
            </svg>
          </template>
        </BlButton>
        <BlButton
          ref="readoutButton"
          class="bl-lightbox__readout"
          variant="ghost"
          :aria-label="`${text.resetZoom}, ${percent}`"
          :disabled="!canZoom()"
          @click="zoomer.reset(true)"
        >
          {{ percent }}
        </BlButton>
        <BlButton
          ref="zoomInButton"
          variant="ghost"
          :aria-label="text.zoomIn"
          :disabled="!canZoom() || view.zoom >= zoomMax"
          @click="zoomer.zoomBy(1)"
        >
          <template #icon>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 8h10M8 3v10" />
            </svg>
          </template>
        </BlButton>
      </div>
    </div>
    <figure
      v-if="item"
      ref="stage"
      class="bl-lightbox__stage"
      :class="{ 'bl-lightbox__stage--zoomable': zoomable }"
      :data-loaded="status === 'loaded' ? 'true' : 'false'"
      :data-zoomed="zoomed ? '' : undefined"
      :data-magnified="view.zoom > 1 ? '' : undefined"
      @pointerdown="onStageDown"
      @pointermove="onStageMove"
      @pointerup="onStageUp"
      @pointercancel="onStageCancel"
      @lostpointercapture="zoomer.onLostCapture"
      @wheel="zoomer.onWheel"
      @click.capture="zoomer.onClickCapture"
      @click="onStageClick"
    >
      <p v-if="status === 'failed'" class="bl-lightbox__message">{{ failure() }}</p>
      <Frame v-else :on="zoomable" :transform="transform" :easing="easing">
        <slot
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
      </Frame>
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
    h,
    nextTick,
    onActivated,
    onBeforeUnmount,
    onBeforeUpdate,
    onDeactivated,
    onMounted,
    ref,
    useId,
    watch,
    type FunctionalComponent,
    type VNode
  } from 'vue'
  import { warn } from '../internal/dev'
  import { mergeLabels } from '../internal/labels'
  import { hasContent } from '../internal/slots'
  import { useModal } from '../internal/useModal'
  import { useZoom } from '../internal/useZoom'
  import type { Size } from '../internal/zoom'
  import type { DialogCloseEvent, LabelOverrides, LightboxItem, LightboxLabels } from '../types'
  import BlButton from './BlButton.vue'

  const props = withDefaults(
    defineProps<{
      items: readonly T[]
      loop?: boolean
      title?: string
      preload?: number | false
      announce?: 'position' | 'position+caption'
      zoomable?: boolean
      maxZoom?: number
      zoomControls?: boolean
      labels?: Partial<LabelOverrides<LightboxLabels<T>>>
    }>(),
    { loop: false, preload: 1, announce: 'position', zoomable: false, zoomControls: true }
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
  const zoom = defineModel<number>('zoom', { default: 1 })
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
  const frame = ref<HTMLElement>()
  const zoomOutButton = ref<InstanceType<typeof BlButton>>()
  const zoomInButton = ref<InstanceType<typeof BlButton>>()
  const readoutButton = ref<InstanceType<typeof BlButton>>()
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
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        resetZoom: 'Reset zoom',
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
  // Zoomable, the media sits in a frame that carries the transform, so slotted media zooms too.
  const Frame: FunctionalComponent<{
    on: boolean
    transform: string | undefined
    easing: boolean
  }> = (p, { slots: inner }) =>
    p.on
      ? h(
          'div',
          {
            ref: frame,
            class: 'bl-lightbox__frame',
            style: p.transform ? { transform: p.transform } : undefined,
            'data-easing': p.easing ? '' : undefined
          },
          inner['default']?.()
        )
      : inner['default']?.()
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
  // A focused button that just became disabled (a nav button at an end, a zoom button at a limit)
  // would drop focus to <body>; an enabled partner takes it, else (every zoom control is off on
  // a failed item) the dialog.
  function keepFocus(...group: (InstanceType<typeof BlButton> | undefined)[]): void {
    nextTick(() => {
      const buttons = group.map((button) => button?.$el as HTMLButtonElement | undefined)
      const lost = buttons.find((b) => b?.disabled && document.activeElement === b)
      if (!lost) return
      const partner = buttons.find((b) => b && b !== lost && !b.disabled)
      if (partner) partner.focus()
      else el.value?.focus({ preventScroll: true })
    })
  }

  // The natural size, for the zoom limit and 1:1: a slot's loaded(size), else the item's width
  // and height, else the image's or a slotted svg's own.
  const sized = (it: LightboxItem | undefined): Size | null =>
    it?.width && it.height ? { width: it.width, height: it.height } : null
  const natural = ref<Size | null>(sized(item.value))

  // Each item shown starts a new generation: loaded()/failed() handed to an earlier one do nothing.
  let generation = 0
  watch([current, () => item.value?.src, () => item.value?.key], () => {
    generation++
    status.value = 'loading'
    natural.value = sized(item.value)
    zoomer.release()
    zoomer.reset()
    keepFocus(prev.value, next.value)
  })
  watch(
    [frame, current, () => item.value?.src, () => item.value?.key],
    () => {
      const svg = frame.value?.firstElementChild
      if (natural.value || svg?.localName !== 'svg') return
      const box = (svg.getAttribute('viewBox') ?? '')
        .trim()
        .split(/[\s,]+/)
        .map(Number)
      if (box.length === 4 && box[2]! > 0 && box[3]! > 0)
        natural.value = { width: box[2]!, height: box[3]! }
    },
    { flush: 'post' }
  )

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
      zoomer.release()
      zoomer.reset()
      if (open.value && props.items.length === 0) open.value = false
      emit('close', payload)
    }
  })

  // A failed item shows a message, not media: nothing to zoom.
  const canZoom = () => props.zoomable && status.value !== 'failed'
  const zoomer = useZoom({
    enabled: canZoom,
    model: zoom,
    frame,
    surface: stage,
    natural,
    maxZoom: () => props.maxZoom,
    // The caption is text to select and scroll, not part of the media.
    ignore: (event) =>
      event.defaultPrevented ||
      interactive(event.target) ||
      (event.target instanceof Element && event.target.closest('.bl-lightbox__caption') !== null)
  })
  const { state: view, easing, max: zoomMax } = zoomer
  const transform = computed(() => {
    const { zoom: z, x, y } = view.value
    return z === 1 && x === 0 && y === 0 ? undefined : `translate(${x}px, ${y}px) scale(${z})`
  })
  const percent = computed(() => `${Math.round(view.value.zoom * 100)}%`)
  watch([() => view.value.zoom, zoomMax, canZoom], () =>
    keepFocus(zoomOutButton.value, readoutButton.value, zoomInButton.value)
  )

  // Pinch-zoomed, a one-finger drag pans the page: the stage hands touch back to the browser.
  const zoomed = ref(false)
  const viewport = () => (typeof visualViewport === 'undefined' ? null : visualViewport)
  function onViewportResize(): void {
    zoomed.value = (viewport()?.scale ?? 1) > 1.01
  }
  // A blur mid-gesture (a switch of window) may swallow the pointer's up: drop the gesture.
  const onBlur = () => zoomer.release()
  function listenBlur(on: boolean): void {
    if (typeof window === 'undefined') return
    if (on && props.zoomable) window.addEventListener('blur', onBlur)
    else window.removeEventListener('blur', onBlur)
  }
  watch(
    () => props.zoomable,
    (on) => active.value && listenBlur(on)
  )
  function listen(on: boolean): void {
    if (on) zoomer.reset()
    else zoomer.release()
    listenBlur(on)
    const vv = viewport()
    if (!vv) return
    if (on) {
      vv.addEventListener('resize', onViewportResize)
      onViewportResize()
    } else vv.removeEventListener('resize', onViewportResize)
  }
  watch(active, listen)
  onMounted(() => active.value && listen(true))
  onActivated(() => active.value && listen(true))
  onDeactivated(() => listen(false))
  onBeforeUnmount(() => listen(false))

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
  defineExpose({
    next: nextItem,
    previous,
    go,
    zoomTo: (z: number) => zoomer.zoomTo(z),
    resetZoom: () => zoomer.reset(true)
  })

  const isRtl = () => !!el.value && getComputedStyle(el.value).direction === 'rtl'

  // Media with its own controls keeps its keys and drags (seeking, volume), as does content that
  // opts out with data-bl-no-swipe (a map, a 3D view).
  const interactive = (target: EventTarget | null) =>
    target instanceof Element && target.closest('iframe, [controls], [data-bl-no-swipe]') !== null

  // Zoom keys work with one item and with Shift (+ needs it on many layouts); Ctrl/Cmd + and -
  // stay the browser's page zoom. Zoomed in, the arrows pan; Home and End still navigate.
  const PAN: Record<string, [number, number]> = {
    ArrowLeft: [0.1, 0],
    ArrowRight: [-0.1, 0],
    ArrowUp: [0, 0.1],
    ArrowDown: [0, -0.1]
  }
  function onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || el.value?.hasAttribute('data-closing')) return
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const target = event.target as HTMLElement | null
    if (target?.isContentEditable || target?.closest('input, textarea, select, [contenteditable]'))
      return
    if (interactive(target)) return
    if (canZoom() && zoomKey(event.key)) {
      event.preventDefault()
      return
    }
    if (event.shiftKey) return
    const pan = PAN[event.key]
    if (props.zoomable && view.value.zoom > 1 && pan) {
      zoomer.panBy(...pan)
      event.preventDefault()
      return
    }
    if (!many.value) return
    const forward = isRtl() ? 'ArrowLeft' : 'ArrowRight'
    const back = isRtl() ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === forward) nextItem()
    else if (event.key === back) previous()
    else if (event.key === 'Home') go(0)
    else if (event.key === 'End') go(props.items.length - 1)
    else return
    event.preventDefault()
  }

  function zoomKey(key: string): boolean {
    if (key === '+' || key === '=') zoomer.zoomBy(1)
    else if (key === '-') zoomer.zoomBy(-1)
    else if (key === '0') zoomer.reset(true)
    else return false
    return true
  }

  // Swipe: one pointer only; a second one (a pinch) cancels until every pointer is up. A drag
  // that moved never counts as a stage click.
  const pointers = new Set<number>()
  let start: { id: number; x: number; y: number } | null = null
  let downOnStage = false
  let dragged = false
  function onStageDown(event: PointerEvent): void {
    zoomer.onPointerDown(event)
    // A primary pointer starts a new gesture; forget any whose up landed outside the stage.
    if (event.isPrimary) pointers.clear()
    pointers.add(event.pointerId)
    if (pointers.size > 1) {
      start = null
      return
    }
    downOnStage = backdrop(event.target)
    dragged = false
    start = null
    if (event.defaultPrevented || interactive(event.target) || zoomed.value || zoomer.busy()) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    start = { id: event.pointerId, x: event.clientX, y: event.clientY }
  }
  function onStageMove(event: PointerEvent): void {
    zoomer.onPointerMove(event)
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
    zoomer.onPointerUp(event)
    pointers.delete(event.pointerId)
    const s = start
    if (!s || event.pointerId !== s.id) return
    start = null
    const dx = event.clientX - s.x
    const dy = event.clientY - s.y
    if (Math.hypot(dx, dy) >= 10) dragged = true
    if (event.defaultPrevented || zoomed.value || zoomer.busy()) return
    const threshold = Math.max(48, 0.15 * (stage.value?.clientWidth ?? 0))
    if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return
    if (dx < 0 !== isRtl()) nextItem()
    else previous()
  }
  function onStageCancel(event: PointerEvent): void {
    zoomer.onPointerCancel(event)
    pointers.delete(event.pointerId)
    start = null
  }
  // The stage is the backdrop (with the frame around zoomable media): a press and release on it,
  // outside the media and caption, closes. A near miss beside a nav button (which sits over the
  // stage from 40em up) does not, nor does the click that ends a drag.
  const backdrop = (target: EventTarget | null) =>
    target !== null && (target === stage.value || target === frame.value)
  function onStageClick(event: MouseEvent): void {
    const close = downOnStage && !dragged && !event.defaultPrevented && backdrop(event.target)
    downOnStage = false
    if (close && !nearNav(event)) closeWith('backdrop')
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
  const loadedFor = (g: number) => (size?: Size) => {
    if (g !== generation) return
    if (size && size.width > 0 && size.height > 0)
      natural.value = { width: size.width, height: size.height }
    settle()
    zoomer.refit()
  }
  const failedFor = (g: number) => () => {
    if (g === generation) status.value = 'failed'
  }
  // Again after a srcset swap: the natural and shown sizes may both have changed.
  function onLoad(event: Event): void {
    const image = media.value
    if (!image || event.currentTarget !== image) return
    if (!sized(item.value) && image.naturalWidth > 0 && image.naturalHeight > 0)
      natural.value = { width: image.naturalWidth, height: image.naturalHeight }
    settle()
    zoomer.refit()
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
