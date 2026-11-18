import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCommentVNode, defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import BlLightbox from '../../vue/components/BlLightbox.vue'
import { toastHosts } from '../../vue/internal/toastHosts'
import type { LightboxItem } from '../../vue/types'

type Scope = { item: LightboxItem; index: number }
const ITEMS: LightboxItem[] = [
  { src: 'a.jpg', alt: 'A bridge at dusk', caption: 'Bridge', width: 1600, height: 1067 },
  { src: 'b.jpg', alt: 'A tall tower', srcset: 'b-800.jpg 800w, b-1600.jpg 1600w' },
  { src: 'c.jpg', alt: 'A wide valley', caption: 'Valley', sizes: '80vw' }
]

let wrappers: VueWrapper[] = []
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  vi.restoreAllMocks()
  toastHosts.value = []
  document.documentElement.removeAttribute('dir')
})

type Slots = Record<string, (scope: Scope) => unknown>
function lightbox(props: Record<string, unknown> = {}, slots: Slots = {}) {
  const w = mount(BlLightbox, {
    props: { open: false, items: ITEMS, ...props },
    slots: slots as never,
    attachTo: document.body
  })
  wrappers.push(w)
  return w
}
async function opened(props: Record<string, unknown> = {}, slots: Slots = {}) {
  const w = lightbox(props, slots)
  await w.setProps({ open: true })
  return w
}
const dialogEl = (w: VueWrapper) => w.element as HTMLDialogElement
const img = (w: VueWrapper) => w.get<HTMLImageElement>('.bl-lightbox__media')
const indexes = (w: VueWrapper) => (w.emitted('update:index') ?? []).map((e) => e[0])
function esc(w: VueWrapper) {
  const ev = new Event('cancel', { cancelable: true })
  dialogEl(w).dispatchEvent(ev)
  if (!ev.defaultPrevented) dialogEl(w).close()
}
function key(target: EventTarget, k: string, init: KeyboardEventInit = {}) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }))
}
// Real pointer events from one finger (id 1) unless told otherwise.
function pointer(target: EventTarget, type: string, x: number, y = 0, id = 1) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      clientX: x,
      clientY: y,
      pointerId: id,
      isPrimary: id === 1,
      pointerType: 'touch'
    })
  )
}
function swipe(target: EventTarget, dx: number, dy = 0) {
  pointer(target, 'pointerdown', 200, 200)
  pointer(target, 'pointermove', 200 + dx / 2, 200 + dy / 2)
  pointer(target, 'pointermove', 200 + dx, 200 + dy)
  pointer(target, 'pointerup', 200 + dx, 200 + dy)
}
function rtl() {
  document.documentElement.dir = 'rtl'
  const real = window.getComputedStyle.bind(window)
  vi.spyOn(window, 'getComputedStyle').mockImplementation((node, pseudo) => {
    const style = real(node, pseudo)
    return new Proxy(style, {
      get: (t, p) => (p === 'direction' ? 'rtl' : Reflect.get(t, p))
    })
  })
}

describe('BlLightbox', () => {
  it('names itself by labels.dialog and describes itself by the caption', async () => {
    const w = await opened()
    const d = dialogEl(w)
    expect(d.getAttribute('aria-label')).toBe('Image viewer')
    const caption = w.get('.bl-lightbox__caption')
    expect(caption.text()).toBe('Bridge')
    expect(d.getAttribute('aria-describedby')).toBe(caption.attributes('id'))
    await w.setProps({ index: 1 })
    expect(w.find('.bl-lightbox__caption').exists()).toBe(false)
    expect(d.hasAttribute('aria-describedby')).toBe(false)
    const labelled = await opened({
      labels: { dialog: 'Bildbetrachter', close: 'Schliessen', previous: 'Zurück', next: 'Weiter' }
    })
    expect(dialogEl(labelled).getAttribute('aria-label')).toBe('Bildbetrachter')
    expect(labelled.get('.bl-lightbox__close').attributes('aria-label')).toBe('Schliessen')
    expect(labelled.get('.bl-lightbox__nav--prev').attributes('aria-label')).toBe('Zurück')
    expect(labelled.get('.bl-lightbox__nav--next').attributes('aria-label')).toBe('Weiter')
  })

  it('never renders open, and puts the close button first so showModal focuses it', () => {
    const w = lightbox()
    expect(dialogEl(w).hasAttribute('open')).toBe(false)
    const buttons = w.findAll('button')
    expect(buttons[0]!.classes()).toContain('bl-lightbox__close')
  })

  it("renders the current item's src, srcset, sizes, alt, width and height", async () => {
    const w = await opened()
    const a = img(w)
    expect(a.attributes('src')).toBe('a.jpg')
    expect(a.attributes('alt')).toBe('A bridge at dusk')
    expect(a.attributes('width')).toBe('1600')
    expect(a.attributes('height')).toBe('1067')
    expect(a.attributes('sizes')).toBe('100vw')
    expect(a.attributes('data-loaded')).toBe('false')
    await w.setProps({ index: 1 })
    expect(img(w).attributes('srcset')).toBe('b-800.jpg 800w, b-1600.jpg 1600w')
    expect(img(w).attributes('width')).toBeUndefined()
    await w.setProps({ index: 2 })
    expect(img(w).attributes('sizes')).toBe('80vw')
  })

  it.each([
    ['button', (w: VueWrapper) => w.get('.bl-lightbox__close').trigger('click')],
    ['escape', (w: VueWrapper) => esc(w)],
    ['native', (w: VueWrapper) => dialogEl(w).close('done')]
  ] as const)('closes with reason %s and emits update:open once', async (reason, act) => {
    const w = await opened()
    await act(w)
    expect(w.emitted('update:open')).toEqual([[false]])
    const close = w.emitted('close')!
    expect(close).toHaveLength(1)
    expect((close[0]![0] as { reason: string }).reason).toBe(reason)
  })

  it('reports program when the parent closes it, without echoing update:open', async () => {
    const w = await opened()
    await w.setProps({ open: false })
    expect(dialogEl(w).open).toBe(false)
    expect(w.emitted('update:open')).toBeUndefined()
    expect((w.emitted('close')![0]![0] as { reason: string }).reason).toBe('program')
  })

  it('closes on a stage click outside the media but not on the media or after a swipe', async () => {
    const w = await opened()
    const stage = w.get('.bl-lightbox__stage').element
    const media = img(w).element
    // on the media
    pointer(media, 'pointerdown', 10)
    pointer(media, 'pointerup', 10)
    media.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(dialogEl(w).open).toBe(true)
    // pressed on the media, released on the stage
    pointer(media, 'pointerdown', 10)
    pointer(stage, 'pointerup', 10)
    stage.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(dialogEl(w).open).toBe(true)
    // a swipe that ends on the stage
    swipe(stage, -120)
    stage.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(dialogEl(w).open).toBe(true)
    // pressed and released on the stage
    pointer(stage, 'pointerdown', 10)
    pointer(stage, 'pointerup', 10)
    stage.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(dialogEl(w).open).toBe(false)
    expect((w.emitted('close')![0]![0] as { reason: string }).reason).toBe('backdrop')
  })

  it('does not close on a click in the bar or the bottom-row gap, outside the stage', async () => {
    const w = await opened()
    const d = dialogEl(w)
    d.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    d.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    const bar = w.get('.bl-lightbox__bar').element
    bar.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    bar.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(d.open).toBe(true)
    expect(w.emitted('close')).toBeUndefined()
  })

  it('does not close on a stage click right next to a nav button', async () => {
    const w = await opened({ index: 1 })
    const stage = w.get('.bl-lightbox__stage').element
    const next = w.get('.bl-lightbox__nav--next').element
    vi.spyOn(next, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 900, y: 400, width: 44, height: 44 })
    )
    const tap = (x: number, y: number) => {
      stage.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y })
      )
      stage.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y }))
      stage.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }))
    }
    tap(890, 420) // a near miss beside the button
    tap(920, 455) // just below it
    expect(dialogEl(w).open).toBe(true)
    tap(500, 420)
    expect(dialogEl(w).open).toBe(false)
  })

  it('next and previous move the index and emit update:index; ends stop without loop', async () => {
    const w = await opened()
    const prev = w.get<HTMLButtonElement>('.bl-lightbox__nav--prev')
    const next = w.get<HTMLButtonElement>('.bl-lightbox__nav--next')
    expect(prev.element.disabled).toBe(true)
    await next.trigger('click')
    expect(indexes(w)).toEqual([1])
    await w.setProps({ index: 2 })
    expect(next.element.disabled).toBe(true)
    await next.trigger('click')
    expect(indexes(w)).toEqual([1])
    expect(w.get('.bl-lightbox__count').text()).toBe('3 / 3')
    await prev.trigger('click')
    expect(indexes(w)).toEqual([1, 1])
  })

  it('loop wraps both ways', async () => {
    const w = await opened({ loop: true })
    const prev = w.get<HTMLButtonElement>('.bl-lightbox__nav--prev')
    expect(prev.element.disabled).toBe(false)
    await prev.trigger('click')
    expect(indexes(w)).toEqual([2])
    await w.setProps({ index: 2 })
    await w.get('.bl-lightbox__nav--next').trigger('click')
    expect(indexes(w)).toEqual([2, 0])
  })

  it('keeps working with an unbound index', async () => {
    const w = await opened()
    await w.get('.bl-lightbox__nav--next').trigger('click')
    expect(img(w).attributes('src')).toBe('b.jpg')
    expect(w.get('.bl-lightbox__count').text()).toBe('2 / 3')
    key(dialogEl(w), 'End')
    await nextTick()
    expect(img(w).attributes('src')).toBe('c.jpg')
  })

  it('maps ArrowLeft/ArrowRight to previous/next, swapped under rtl; Home/End jump', async () => {
    const w = await opened({ index: 1 })
    key(dialogEl(w), 'ArrowRight')
    key(dialogEl(w), 'ArrowLeft')
    expect(indexes(w)).toEqual([2, 1])
    key(dialogEl(w), 'End')
    key(dialogEl(w), 'Home')
    expect(indexes(w)).toEqual([2, 1, 2, 0])
    rtl()
    const r = await opened({ index: 1 })
    key(dialogEl(r), 'ArrowRight')
    key(dialogEl(r), 'ArrowLeft')
    expect(indexes(r)).toEqual([0, 1])
  })

  it('ignores keys from editable targets and with modifiers', async () => {
    const w = await opened({ index: 1 }, { default: () => h('input', { class: 'field' }) })
    key(w.get('.field').element, 'ArrowRight')
    for (const mod of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'])
      key(dialogEl(w), 'ArrowRight', { [mod]: true })
    expect(indexes(w)).toEqual([])
    const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    dialogEl(w).dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    expect(indexes(w)).toEqual([2])
  })

  it('swipes past the threshold navigate, short or vertical drags and a second pointer do not', async () => {
    const w = await opened({ index: 1 })
    const stage = w.get('.bl-lightbox__stage').element
    Object.defineProperty(stage, 'clientWidth', { configurable: true, value: 400 })
    // threshold max(48, 15% of 400) = 60
    swipe(stage, -59)
    swipe(stage, 30, 200)
    expect(indexes(w)).toEqual([])
    // a second finger lands mid-drag: a pinch, not a swipe
    pointer(stage, 'pointerdown', 200)
    pointer(stage, 'pointerdown', 300, 0, 2)
    pointer(stage, 'pointermove', 100)
    pointer(stage, 'pointerup', 100)
    pointer(stage, 'pointerup', 300, 0, 2)
    expect(indexes(w)).toEqual([])
    swipe(stage, -61)
    swipe(stage, 61)
    expect(indexes(w)).toEqual([2, 1])
    Object.defineProperty(stage, 'clientWidth', { configurable: true, value: 200 })
    swipe(stage, -50) // 48px floor
    expect(indexes(w)).toEqual([2, 1, 2])
    rtl()
    const r = await opened({ index: 1 })
    swipe(r.get('.bl-lightbox__stage').element, -120)
    expect(indexes(r)).toEqual([0])
  })

  it('moves focus to the other nav button when the focused one becomes disabled', async () => {
    const w = await opened({ index: 1 })
    const prev = w.get<HTMLButtonElement>('.bl-lightbox__nav--prev')
    const next = w.get<HTMLButtonElement>('.bl-lightbox__nav--next')
    next.element.focus()
    await next.trigger('click')
    await w.setProps({ index: 2 })
    await nextTick()
    expect(next.element.disabled).toBe(true)
    expect(document.activeElement).toBe(prev.element)
    // focus elsewhere stays put
    w.get<HTMLElement>('.bl-lightbox__close').element.focus()
    key(dialogEl(w), 'Home')
    await w.setProps({ index: 0 })
    await nextTick()
    expect(document.activeElement).toBe(w.get('.bl-lightbox__close').element)
  })

  it('announces the position after navigation, not on open', async () => {
    const w = await opened()
    const live = w.get('[aria-live="polite"]')
    expect(live.text()).toBe('')
    await w.get('.bl-lightbox__nav--next').trigger('click')
    expect(live.text()).toBe('Image 2 of 3')
    const custom = await opened({ labels: { position: (i: number, n: number) => `${i}/${n}` } })
    key(dialogEl(custom), 'End')
    await nextTick()
    expect(custom.get('[aria-live="polite"]').text()).toBe('3/3')
  })

  it('hides nav, counter and announcement for a single item', async () => {
    const w = await opened({ items: [ITEMS[0]] })
    expect(w.find('.bl-lightbox__nav').exists()).toBe(false)
    expect(w.find('.bl-lightbox__count').exists()).toBe(false)
    expect(w.find('[aria-live]').exists()).toBe(false)
    key(dialogEl(w), 'ArrowRight')
    expect(indexes(w)).toEqual([])
  })

  it('clamps an out-of-range index and when items shrink while open', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await opened({ index: 7 })
    await nextTick()
    expect(indexes(w)).toEqual([2])
    expect(img(w).attributes('src')).toBe('c.jpg')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('BlLightbox'))
    await w.setProps({ index: 1.5 })
    expect(indexes(w)).toEqual([2, 1])
    await w.setProps({ index: 2 })
    warn.mockClear()
    await w.setProps({ items: ITEMS.slice(0, 2) })
    expect(indexes(w)).toEqual([2, 1, 1])
    expect(img(w).attributes('src')).toBe('b.jpg')
    expect(warn).not.toHaveBeenCalled()
    expect(dialogEl(w).open).toBe(true)
  })

  it('warns and stays closed with empty items', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = lightbox({ items: [] })
    const spy = vi.spyOn(dialogEl(w), 'showModal')
    await w.setProps({ open: true })
    expect(spy).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('BlLightbox'))
    expect(w.emitted('update:open')).toBeUndefined()
    expect(w.find('.bl-lightbox__stage').exists()).toBe(false)
    await w.setProps({ items: ITEMS })
    expect(dialogEl(w).open).toBe(true)
  })

  it('ignores a stale load from a previous item', async () => {
    const w = await opened()
    const old = img(w).element
    await w.setProps({ index: 1 })
    expect(img(w).element).not.toBe(old)
    old.dispatchEvent(new Event('load'))
    await nextTick()
    expect(img(w).attributes('data-loaded')).toBe('false')
    img(w).element.dispatchEvent(new Event('load'))
    await nextTick()
    expect(img(w).attributes('data-loaded')).toBe('true')
  })

  it('preloads neighbours after the current image loads', async () => {
    const made: HTMLImageElement[] = []
    const Real = globalThis.Image
    vi.spyOn(globalThis, 'Image').mockImplementation(function () {
      const image = new Real()
      made.push(image)
      return image
    } as unknown as () => HTMLImageElement)
    const w = await opened({ index: 1 })
    expect(made).toEqual([])
    img(w).element.dispatchEvent(new Event('load'))
    await nextTick()
    expect(made.map((i) => i.getAttribute('src'))).toEqual(['a.jpg', 'c.jpg'])
    expect(made[1]!.getAttribute('sizes')).toBe('80vw')
    made.length = 0
    const looped = await opened({ loop: true })
    img(looped).element.dispatchEvent(new Event('load'))
    expect(made.map((i) => i.getAttribute('src'))).toEqual(['c.jpg', 'b.jpg'])
    made.length = 0
    const ends = await opened({ items: ITEMS.slice(0, 2) })
    img(ends).element.dispatchEvent(new Event('load'))
    expect(made.map((i) => i.getAttribute('src'))).toEqual(['b.jpg'])
    made.length = 0
    const single = await opened({ items: [ITEMS[1]], loop: true })
    img(single).element.dispatchEvent(new Event('load'))
    expect(made).toEqual([])
  })

  it('shows the alt text in a message when the image fails to load', async () => {
    const w = await opened()
    img(w).element.dispatchEvent(new Event('error'))
    await nextTick()
    expect(w.find('.bl-lightbox__media').exists()).toBe(false)
    expect(w.get('.bl-lightbox__message').text()).toBe('A bridge at dusk')
    await w.setProps({ index: 1 })
    expect(w.find('.bl-lightbox__message').exists()).toBe(false)
    const captioned = await opened({ items: [{ src: 'x.jpg', alt: '', caption: 'Named here' }] })
    img(captioned).element.dispatchEvent(new Event('error'))
    await nextTick()
    expect(captioned.get('.bl-lightbox__message').text()).toBe('Named here')
  })

  it('default and caption slots replace the media and caption, with item and index', async () => {
    const w = await opened(
      { index: 1 },
      {
        default: (p: Scope) =>
          h('video', { class: 'clip', 'data-src': p.item.src, 'data-i': p.index }),
        caption: (p: Scope) => h('b', `${p.index}: ${p.item.alt}`)
      }
    )
    expect(w.find('.bl-lightbox__media').exists()).toBe(false)
    expect(w.get('.clip').attributes('data-src')).toBe('b.jpg')
    expect(w.get('.clip').attributes('data-i')).toBe('1')
    expect(w.get('.bl-lightbox__caption').text()).toBe('1: A tall tower')
    expect(dialogEl(w).getAttribute('aria-describedby')).toBe(
      w.get('.bl-lightbox__caption').attributes('id')
    )
    // empty slots fall back
    const empty = await opened(
      {},
      { default: () => [createCommentVNode('v-if')], caption: () => [createCommentVNode('v-if')] }
    )
    expect(empty.get('.bl-lightbox__media').attributes('src')).toBe('a.jpg')
    expect(empty.get('.bl-lightbox__caption').text()).toBe('Bridge')
  })

  it('restores focus and unlocks the page on unmount while open', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const w = await opened()
    expect(document.documentElement.style.getPropertyValue('--bl-dialog-gutter')).toMatch(/px$/)
    expect(toastHosts.value).toEqual([w.get('.bl-lightbox__toasts').element])
    w.get<HTMLElement>('.bl-lightbox__close').element.focus()
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(w.emitted('close')).toBeUndefined()
    expect(document.activeElement).toBe(opener)
    expect(document.documentElement.style.getPropertyValue('--bl-dialog-gutter')).toBe('')
    expect(toastHosts.value).toEqual([])
    opener.remove()
  })

  it('closes quietly when deactivated by KeepAlive and reopens on activation', async () => {
    const show = ref(true)
    const Host = defineComponent({
      setup: () => () =>
        h(KeepAlive, null, [
          show.value ? h(BlLightbox, { open: true, items: ITEMS, key: 'l' }) : h('p', 'other')
        ])
    })
    const w = mount(Host, { attachTo: document.body })
    wrappers.push(w)
    await nextTick()
    const d = w.get('dialog').element as HTMLDialogElement
    expect(d.open).toBe(true)
    show.value = false
    await nextTick()
    expect(d.open).toBe(false)
    expect(document.documentElement.style.getPropertyValue('--bl-dialog-gutter')).toBe('')
    show.value = true
    await nextTick()
    expect(d.open).toBe(true)
  })
  it('leaves keys and drags on slotted interactive media alone', async () => {
    const w = await opened(
      { index: 1 },
      { default: () => h('video', { class: 'clip', controls: true }, [h('track')]) }
    )
    const clip = w.get('.clip').element
    key(clip, 'ArrowRight')
    key(clip.firstElementChild!, 'ArrowLeft')
    swipe(clip, -200)
    expect(indexes(w)).toEqual([])
    expect(dialogEl(w).open).toBe(true)
    key(dialogEl(w), 'ArrowRight')
    expect(indexes(w)).toEqual([2])
  })

  it('pans instead of swiping while the page is pinch-zoomed', async () => {
    const vv = Object.assign(new EventTarget(), { scale: 1 })
    vi.stubGlobal('visualViewport', vv)
    const add = vi.spyOn(vv, 'addEventListener')
    const remove = vi.spyOn(vv, 'removeEventListener')
    const w = lightbox({ index: 1 })
    expect(add).not.toHaveBeenCalled() // only while open
    await w.setProps({ open: true })
    expect(add).toHaveBeenCalledWith('resize', expect.any(Function))
    const stage = () => w.get('.bl-lightbox__stage')
    expect(stage().attributes('data-zoomed')).toBeUndefined()
    vv.scale = 2
    vv.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(stage().attributes('data-zoomed')).toBeDefined()
    swipe(stage().element, -200)
    expect(indexes(w)).toEqual([])
    vv.scale = 1
    vv.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(stage().attributes('data-zoomed')).toBeUndefined()
    swipe(stage().element, -200)
    expect(indexes(w)).toEqual([2])
    await w.setProps({ open: false })
    expect(remove).toHaveBeenCalledWith('resize', add.mock.calls[0]![1])
    vi.unstubAllGlobals()
  })

  it('lets slot content claim a key or a pointer with preventDefault', async () => {
    const w = await opened(
      { index: 1 },
      {
        default: () =>
          h('div', {
            class: 'claims',
            onKeydown: (e: Event) => e.preventDefault(),
            onPointerdown: (e: Event) => e.preventDefault()
          })
      }
    )
    const claims = w.get('.claims').element
    key(claims, 'ArrowRight', { cancelable: true })
    const down = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      clientX: 200,
      pointerId: 1,
      isPrimary: true
    })
    claims.dispatchEvent(down)
    pointer(claims, 'pointerup', 0)
    expect(indexes(w)).toEqual([])
  })

  it('closes and reports update:open when items empties while open, and stays closed on refill', async () => {
    const w = await opened()
    await w.setProps({ items: [] })
    expect(dialogEl(w).open).toBe(false)
    expect(w.emitted('update:open')).toEqual([[false]])
    expect(w.emitted('close')).toEqual([[{ reason: 'program', returnValue: '' }]])
    await w.setProps({ open: false })
    await w.setProps({ items: ITEMS })
    expect(dialogEl(w).open).toBe(false)
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('names a failed image by labels.failed when it has neither alt nor caption, and warns about it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await opened({ items: [{ src: 'bare.jpg', alt: '' }] })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('BlLightbox'))
    img(w).element.dispatchEvent(new Event('error'))
    await nextTick()
    expect(w.get('.bl-lightbox__message').text()).toBe('The image could not be loaded.')
    const labelled = await opened({
      items: [{ src: 'bare.jpg', alt: '' }],
      labels: { failed: 'Bild fehlt.' }
    })
    img(labelled).element.dispatchEvent(new Event('error'))
    await nextTick()
    expect(labelled.get('.bl-lightbox__message').text()).toBe('Bild fehlt.')
    warn.mockClear()
    await opened({ items: [{ src: 'a.jpg', alt: '', caption: 'Named' }] })
    expect(warn).not.toHaveBeenCalled()
  })

  it('renders no caption and no aria-describedby when the caption slot and item.caption are empty', async () => {
    const w = await opened({ index: 1 }, { caption: () => [createCommentVNode('v-if')] })
    expect(w.find('.bl-lightbox__caption').exists()).toBe(false)
    expect(dialogEl(w).hasAttribute('aria-describedby')).toBe(false)
  })
  it('drops a stale press before a press it ignores, so the later release cannot navigate', async () => {
    const w = await opened(
      { index: 1 },
      { default: () => h('video', { class: 'clip', controls: true }) }
    )
    const stage = w.get('.bl-lightbox__stage').element
    // pressed on the stage, moved a little, released off the stage (no up reaches it)
    stage.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: 200,
        pointerId: 1,
        isPrimary: true
      })
    )
    pointer(stage, 'pointermove', 195)
    // a mouse reuses its pointerId: the next press lands on the video and is released far away
    const clip = w.get('.clip').element
    pointer(clip, 'pointerdown', 200)
    pointer(stage, 'pointerup', -200)
    expect(indexes(w)).toEqual([])
  })

  it('navigates from a plain slotted video without controls', async () => {
    const w = await opened(
      { index: 1 },
      { default: () => h('video', { class: 'clip', autoplay: true, muted: true, loop: true }) }
    )
    const clip = w.get('.clip').element
    key(clip, 'ArrowRight')
    swipe(clip, 200)
    expect(indexes(w)).toEqual([2, 1])
  })

  it('warns once per src about a missing name, follows new items, and not with a default slot', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const bare = () => [{ src: 'once.jpg', alt: '' }, ITEMS[0]!]
    const w = lightbox({ items: bare() })
    await w.setProps({ items: bare() })
    await w.setProps({ items: bare() })
    expect(warn).toHaveBeenCalledTimes(1)
    await w.setProps({ items: [...bare(), { src: 'added.jpg', alt: '' }] })
    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn).toHaveBeenLastCalledWith(expect.stringContaining('added.jpg'))
    warn.mockClear()
    lightbox({ items: [{ src: 'slotted.jpg', alt: '' }] }, { default: () => h('video') })
    expect(warn).not.toHaveBeenCalled()
  })
})
