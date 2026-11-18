import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCommentVNode, defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import BlLightbox from '../../vue/components/BlLightbox.vue'
import { toastHosts } from '../../vue/internal/toastHosts'
import type { LightboxItem } from '../../vue/types'
import { mockTransition, transitionEnd } from './transitions'

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

  it('never renders open, and puts the close button first so Tab reaches it first', () => {
    const w = lightbox()
    expect(dialogEl(w).hasAttribute('open')).toBe(false)
    const buttons = w.findAll('button')
    expect(buttons[0]!.classes()).toContain('bl-lightbox__close')
  })

  it('focuses the dialog itself on open, so arrow keys work at once', async () => {
    const w = await opened()
    const d = dialogEl(w)
    expect(d.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(d)
    key(document.activeElement!, 'ArrowRight')
    expect(indexes(w)).toEqual([1])
  })

  it('fades the scrim out before it closes, then emits', async () => {
    const w = lightbox()
    const d = dialogEl(w)
    mockTransition([d, { property: 'background-color', duration: '200ms' }])
    await w.setProps({ open: true })
    w.get<HTMLElement>('.bl-lightbox__close').element.focus()
    await w.get('.bl-lightbox__close').trigger('click')
    expect(d.open).toBe(true)
    expect(d.hasAttribute('data-closing')).toBe(true)
    expect(w.emitted('close')).toBeUndefined()
    transitionEnd(w.get('.bl-lightbox__close').element, 'background-color') // bubbled, not ours
    expect(d.open).toBe(true)
    // the controls and the stage are inert meanwhile; the dialog and its toast host are not
    const parts = ['.bl-lightbox__bar', '.bl-lightbox__stage', '.bl-lightbox__nav--prev']
    const inert = () => parts.map((s) => w.get<HTMLElement>(s).element.inert)
    expect(inert()).toEqual([true, true, true])
    expect(w.get<HTMLElement>('.bl-lightbox__nav--next').element.inert).toBe(true)
    expect(d.inert).toBe(false)
    expect(w.get<HTMLElement>('.bl-lightbox__toasts').element.inert).toBe(false)
    expect(document.activeElement).toBe(d) // out of the inert bar
    key(d, 'ArrowRight') // the arrow keys rest during the exit
    expect(indexes(w)).toEqual([])
    transitionEnd(d, 'background-color')
    expect(d.open).toBe(false)
    expect(d.hasAttribute('data-closing')).toBe(false)
    expect(inert()).toEqual([false, false, false])
    expect(w.emitted('update:open')).toEqual([[false]])
    expect((w.emitted('close')![0]![0] as { reason: string }).reason).toBe('button')
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

type Media = Scope & {
  loaded: (size?: { width: number; height: number }) => void
  failed: () => void
}
function images() {
  const made: HTMLImageElement[] = []
  const Real = globalThis.Image
  vi.spyOn(globalThis, 'Image').mockImplementation(function () {
    const image = new Real()
    made.push(image)
    return image
  } as unknown as () => HTMLImageElement)
  return made
}
const srcs = (made: HTMLImageElement[]) => made.map((i) => i.getAttribute('src'))

describe('BlLightbox bar, items and media contract', () => {
  it('renders slotted items without src: no img and no warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await opened(
      { items: [{ alt: 'A drawing', key: 'svg' }, { caption: 'A clip' }] },
      { default: (p: Scope) => h('svg', { class: 'drawing', 'data-i': p.index }) }
    )
    expect(w.find('img').exists()).toBe(false)
    expect(w.get('.drawing').attributes('data-i')).toBe('0')
    await w.setProps({ index: 1 })
    expect(w.get('.drawing').attributes('data-i')).toBe('1')
    expect(w.find('.bl-lightbox__message').exists()).toBe(false)
    expect(warn).not.toHaveBeenCalled()
  })

  it('without a default slot, an item with no src shows its message and warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await opened({ items: [{ alt: 'Lost photo' }, ITEMS[0]] })
    expect(w.find('img').exists()).toBe(false)
    expect(w.get('.bl-lightbox__message').text()).toBe('Lost photo')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no src'))
  })

  it('de-duplicates warnings by key, else by index, never by src', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = lightbox({
      items: [{ caption: 'no src' }, { src: 'same.jpg' }, { src: 'same.jpg', key: 'b' }]
    })
    expect(warn).toHaveBeenCalledTimes(3) // the same src at two places warns for both
    await w.setProps({
      items: [{ caption: 'still none' }, { src: 'renamed.jpg' }, { src: 'other.jpg', key: 'b' }]
    })
    expect(warn).toHaveBeenCalledTimes(3) // same indexes and key
    await w.setProps({ items: [{ src: 'other.jpg', key: 'c', alt: '' }] })
    expect(warn).toHaveBeenCalledTimes(4)
    expect(warn).toHaveBeenLastCalledWith(expect.stringContaining('other.jpg'))
  })

  it('names the dialog by the title prop or slot via aria-labelledby, else by labels.dialog', async () => {
    const w = await opened({ title: 'Trip to the coast' })
    const d = dialogEl(w)
    const title = w.get('.bl-lightbox__title')
    expect(title.text()).toBe('Trip to the coast')
    expect(d.getAttribute('aria-labelledby')).toBe(title.attributes('id'))
    expect(d.hasAttribute('aria-label')).toBe(false)
    const slotted = await opened(
      { title: 'ignored' },
      { title: (p: Scope) => h('span', `${p.index + 1}: ${p.item.alt}`) }
    )
    expect(slotted.get('.bl-lightbox__title').text()).toBe('1: A bridge at dusk')
    expect(dialogEl(slotted).getAttribute('aria-labelledby')).toBe(
      slotted.get('.bl-lightbox__title').attributes('id')
    )
    // an empty slot falls back to the prop, and with neither there is no title
    const fallback = await opened({ title: 'Prop' }, { title: () => [createCommentVNode('v-if')] })
    expect(fallback.get('.bl-lightbox__title').text()).toBe('Prop')
    const none = await opened({}, { title: () => [createCommentVNode('v-if')] })
    expect(none.find('.bl-lightbox__title').exists()).toBe(false)
    expect(dialogEl(none).getAttribute('aria-label')).toBe('Image viewer')
    expect(dialogEl(none).hasAttribute('aria-labelledby')).toBe(false)
  })

  it('renders actions with item and index in the bar; clicks and drags there never close or swipe', async () => {
    const w = await opened(
      { index: 1 },
      {
        actions: (p: Scope) =>
          h('a', { class: 'original', href: `#${p.item.src}`, 'data-i': p.index }, 'Original')
      }
    )
    const link = w.get('.bl-lightbox__bar .bl-lightbox__actions .original')
    expect(link.attributes('href')).toBe('#b.jpg')
    expect(link.attributes('data-i')).toBe('1')
    pointer(link.element, 'pointerdown', 10)
    pointer(link.element, 'pointerup', 10)
    link.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    swipe(link.element, -200)
    link.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(indexes(w)).toEqual([])
    expect(dialogEl(w).open).toBe(true)
    expect(w.emitted('close')).toBeUndefined()
    // an empty actions slot renders no wrapper
    const empty = await opened({}, { actions: () => [createCommentVNode('v-if')] })
    expect(empty.find('.bl-lightbox__actions').exists()).toBe(false)
  })

  it('loaded(size) marks the item loaded and preloads; failed() shows the message; stale calls are ignored', async () => {
    const made = images()
    let scope: Media | undefined
    const items = [{ src: 'a.jpg', alt: 'A' }, { alt: 'A drawing', key: 'd' }, { src: 'c.jpg' }]
    const w = await opened(
      { index: 1, items },
      {
        default: (p: Scope) => {
          scope = p as Media
          return h('svg', { class: 'drawing' })
        }
      }
    )
    const stage = () => w.get('.bl-lightbox__stage')
    expect(stage().attributes('data-loaded')).toBe('false')
    expect(made).toEqual([])
    const first = scope!
    first.loaded({ width: 400, height: 300 })
    await nextTick()
    expect(stage().attributes('data-loaded')).toBe('true')
    expect(srcs(made)).toEqual(['a.jpg', 'c.jpg'])
    first.loaded() // again: no second preload
    expect(made).toHaveLength(2)
    first.failed()
    await nextTick()
    expect(w.find('.drawing').exists()).toBe(false)
    expect(w.get('.bl-lightbox__message').text()).toBe('A drawing')
    await w.setProps({ index: 2 })
    expect(w.find('.bl-lightbox__message').exists()).toBe(false)
    expect(stage().attributes('data-loaded')).toBe('false')
    first.failed() // from the previous item
    first.loaded()
    await nextTick()
    expect(w.find('.bl-lightbox__message').exists()).toBe(false)
    expect(stage().attributes('data-loaded')).toBe('false')
  })

  it('shows a slot that never calls loaded at once: nothing hides it', async () => {
    const w = await opened({}, { default: () => h('video', { class: 'clip' }) })
    const clip = w.get('.clip')
    expect(clip.attributes('data-loaded')).toBeUndefined()
    expect(clip.attributes('style')).toBeUndefined()
    expect(w.find('[data-loaded="false"]:not(.bl-lightbox__stage)').exists()).toBe(false)
  })

  it('data-bl-no-swipe on slotted content keeps keys, swipes and stage clicks there', async () => {
    const w = await opened(
      { index: 1 },
      {
        default: () =>
          h('div', { class: 'map', 'data-bl-no-swipe': '' }, [h('span', { class: 'pin' })])
      }
    )
    const pin = w.get('.pin').element
    const stage = w.get('.bl-lightbox__stage').element
    key(pin, 'ArrowRight')
    key(pin, 'End')
    swipe(pin, -200)
    pointer(pin, 'pointerdown', 10)
    pointer(stage, 'pointerup', 10)
    stage.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(indexes(w)).toEqual([])
    expect(dialogEl(w).open).toBe(true)
    key(dialogEl(w), 'ArrowRight')
    expect(indexes(w)).toEqual([2])
  })

  it.each([
    [0, 2, false, []],
    [false, 2, false, []],
    [1, 2, false, ['b.jpg', 'd.jpg']],
    [2, 2, false, ['b.jpg', 'd.jpg', 'a.jpg', 'e.jpg']],
    [2, 0, true, ['e.jpg', 'b.jpg', 'd.jpg', 'c.jpg']],
    [9, 0, false, ['b.jpg', 'c.jpg', 'd.jpg', 'e.jpg']]
  ] as const)('preload %s from index %i (loop %s) loads %j', async (preload, index, loop, want) => {
    const made = images()
    const items = ['a', 'b', 'c', 'd', 'e'].map((n) => ({ src: `${n}.jpg`, alt: n }))
    const w = await opened({ items, index, loop, preload })
    img(w).element.dispatchEvent(new Event('load'))
    expect(srcs(made)).toEqual(want)
  })

  it('preloads only neighbours with a src', async () => {
    const made = images()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await opened({
      items: [{ src: 'a.jpg', alt: 'a' }, { alt: 'no src' }, { caption: 'none either' }],
      preload: 2
    })
    img(w).element.dispatchEvent(new Event('load'))
    expect(srcs(made)).toEqual([])
  })

  it("announce 'position+caption' appends the caption, else the alt", async () => {
    const w = await opened({ announce: 'position+caption' })
    const live = w.get('[aria-live="polite"]')
    key(dialogEl(w), 'ArrowRight')
    await nextTick()
    expect(live.text()).toBe('Image 2 of 3, A tall tower')
    key(dialogEl(w), 'End')
    await nextTick()
    expect(live.text()).toBe('Image 3 of 3, Valley')
    const bare = await opened({
      announce: 'position+caption',
      items: [ITEMS[0], { src: 'x.jpg', alt: '' }]
    })
    key(dialogEl(bare), 'ArrowRight')
    await nextTick()
    expect(bare.get('[aria-live="polite"]').text()).toBe('Image 2 of 2')
  })

  it('labels.position receives the item', async () => {
    const position = vi.fn((i: number, n: number, item: LightboxItem) => `${i}/${n} ${item.alt}`)
    const w = await opened({ labels: { position } })
    key(dialogEl(w), 'ArrowRight')
    await nextTick()
    expect(position).toHaveBeenLastCalledWith(2, 3, ITEMS[1])
    expect(w.get('[aria-live="polite"]').text()).toBe('2/3 A tall tower')
  })

  it('exposes next, previous and go, which emit update:index and announce while open', async () => {
    type Api = { next: () => void; previous: () => void; go: (i: number) => void }
    const w = lightbox()
    const api = w.vm as unknown as Api
    api.go(2)
    await nextTick()
    expect(indexes(w)).toEqual([2])
    await w.setProps({ open: true })
    expect(w.get('[aria-live="polite"]').text()).toBe('') // nothing stale from the closed go()
    api.previous()
    await nextTick()
    expect(indexes(w)).toEqual([2, 1])
    expect(w.get('[aria-live="polite"]').text()).toBe('Image 2 of 3')
    api.next()
    api.go(7)
    api.go(-1)
    api.go(0.5)
    await nextTick()
    expect(indexes(w)).toEqual([2, 1, 2])
  })
})

// Zoom: a fake layout. The frame (the media box) is 800 x 600 with its centre at (400, 300) on
// screen; its first element (the media) is `content` at zoom 1, centred. Both rects follow the
// frame's transform, as in a browser.
const BIG = { src: 'big.jpg', alt: 'Big', width: 1600, height: 2400 } // fit 0.25: 1:1 is 4x, max 16
const SMALL = { src: 'small.jpg', alt: 'Small', width: 800, height: 600 } // fit 1: max 8
type Api = {
  next: () => void
  go: (i: number) => void
  zoomTo: (z: number) => void
  resetZoom: () => void
}
const api = (w: VueWrapper) => w.vm as unknown as Api
const frameOf = (w: VueWrapper) => w.get<HTMLElement>('.bl-lightbox__frame').element
function transformOf(el: HTMLElement) {
  const m = /translate\((\S+)px, (\S+)px\) scale\((\S+)\)/.exec(el.style.transform)
  return m ? { x: Number(m[1]), y: Number(m[2]), zoom: Number(m[3]) } : { x: 0, y: 0, zoom: 1 }
}
const zooms = (w: VueWrapper) => (w.emitted('update:zoom') ?? []).map((e) => e[0])
// Layout (offset and client sizes) ignores transforms; painted rects follow the frame's
// transform, or `paint.lag` when set, as while a CSS transition is still running.
const paint: { lag: ReturnType<typeof transformOf> | null } = { lag: null }
function fakeLayout(content = { width: 800, height: 400 }) {
  paint.lag = null
  const size = (el: Element, axis: 'width' | 'height') => {
    if (el.classList.contains('bl-lightbox__frame')) return axis === 'width' ? 800 : 600
    if (el.parentElement?.classList.contains('bl-lightbox__frame')) return content[axis]
    return 0
  }
  for (const [prop, axis] of [
    ['clientWidth', 'width'],
    ['clientHeight', 'height'],
    ['offsetWidth', 'width'],
    ['offsetHeight', 'height']
  ] as const)
    vi.spyOn(HTMLElement.prototype, prop, 'get').mockImplementation(function (this: HTMLElement) {
      return size(this, axis)
    })
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const frame = this.closest<HTMLElement>('.bl-lightbox__frame')
    if (!frame || (this !== frame && this.parentElement !== frame)) return new DOMRect()
    const t = paint.lag ?? transformOf(frame)
    const [w, h] = this === frame ? [800, 600] : [content.width, content.height]
    return DOMRect.fromRect({
      x: 400 + t.x - (w * t.zoom) / 2,
      y: 300 + t.y - (h * t.zoom) / 2,
      width: w * t.zoom,
      height: h * t.zoom
    })
  })
}
async function zoomable(props: Record<string, unknown> = {}, slots: Slots = {}) {
  const w = await opened({ zoomable: true, items: [BIG, SMALL], ...props }, slots)
  return w
}
function wheel(
  target: EventTarget,
  init: { dx?: number; dy?: number; mode?: number; x?: number; y?: number; ctrl?: boolean }
) {
  const ev = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    deltaX: init.dx ?? 0,
    deltaY: init.dy ?? 0,
    deltaMode: init.mode ?? 0
  })
  Object.defineProperties(ev, {
    clientX: { value: init.x ?? 400 },
    clientY: { value: init.y ?? 300 },
    ctrlKey: { value: init.ctrl ?? false }
  })
  target.dispatchEvent(ev)
  return ev
}
function press(target: EventTarget, k: string, init: KeyboardEventInit = {}) {
  const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(ev)
  return ev
}
function mouse(target: EventTarget, type: string, x: number, y = 300, id = 1) {
  const ev = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    pointerId: id,
    isPrimary: true,
    pointerType: 'mouse',
    button: 0
  })
  target.dispatchEvent(ev)
  return ev
}

describe('BlLightbox zoom', () => {
  it('without zoomable: no frame, no controls, and zoom input is left alone', async () => {
    const w = await opened({ items: [BIG, SMALL] })
    expect(w.find('.bl-lightbox__frame').exists()).toBe(false)
    expect(w.find('.bl-lightbox__zoom').exists()).toBe(false)
    expect(w.get('.bl-lightbox__stage').classes()).not.toContain('bl-lightbox__stage--zoomable')
    expect(w.find('.bl-lightbox__stage > .bl-lightbox__media').exists()).toBe(true)
    expect(wheel(w.get('.bl-lightbox__stage').element, { dy: -100 }).defaultPrevented).toBe(false)
    expect(press(dialogEl(w), '+').defaultPrevented).toBe(false)
    api(w).zoomTo(3)
    await nextTick()
    expect(zooms(w)).toEqual([])
  })

  it('wraps the media in a frame and resets v-model:zoom on item change, close and open', async () => {
    fakeLayout()
    const w = await zoomable()
    expect(w.get('.bl-lightbox__stage').classes()).toContain('bl-lightbox__stage--zoomable')
    expect(w.find('.bl-lightbox__frame > .bl-lightbox__media').exists()).toBe(true)
    api(w).zoomTo(2)
    await nextTick()
    expect(zooms(w)).toEqual([2])
    expect(transformOf(frameOf(w)).zoom).toBe(2)
    expect(w.get('.bl-lightbox__stage').attributes('data-magnified')).toBeDefined()
    api(w).next()
    await nextTick()
    expect(zooms(w)).toEqual([2, 1])
    expect(frameOf(w).style.transform).toBe('')
    expect(w.get('.bl-lightbox__stage').attributes('data-magnified')).toBeUndefined()
    api(w).zoomTo(3)
    await w.setProps({ open: false })
    expect(zooms(w)).toEqual([2, 1, 3, 1])
    await w.setProps({ open: true, zoom: 1 })
    expect(frameOf(w).style.transform).toBe('')
  })

  it('follows a bound zoom, clamped into 1 to maxZoom', async () => {
    fakeLayout()
    const w = await zoomable({ zoom: 1 })
    await w.setProps({ zoom: 3 })
    expect(transformOf(frameOf(w)).zoom).toBe(3)
    await w.setProps({ zoom: 100 })
    await nextTick()
    expect(transformOf(frameOf(w)).zoom).toBe(16)
    expect(zooms(w)).toEqual([16])
    await w.setProps({ zoom: 0.2 })
    await nextTick()
    expect(frameOf(w).style.transform).toBe('')
    expect(zooms(w)).toEqual([16, 1])
    const capped = await zoomable({ maxZoom: 3 })
    api(capped).zoomTo(10)
    await nextTick()
    expect(zooms(capped)).toEqual([3])
  })

  it('+, = and - step by 1.25, 0 resets, with a single item and Shift, never with Ctrl', async () => {
    fakeLayout()
    const w = await zoomable({ items: [BIG] })
    const d = dialogEl(w)
    expect(press(d, '+', { shiftKey: true }).defaultPrevented).toBe(true)
    press(d, '=')
    press(d, '-')
    expect(press(d, '0').defaultPrevented).toBe(true)
    expect(press(d, '+', { ctrlKey: true }).defaultPrevented).toBe(false)
    expect(press(d, '-', { metaKey: true }).defaultPrevented).toBe(false)
    await nextTick()
    expect(zooms(w)).toEqual([1.25, 1.5625, 1.25, 1])
  })

  it('arrow keys pan by a tenth of the stage while zoomed; Home and End still navigate', async () => {
    fakeLayout()
    const w = await zoomable()
    const d = dialogEl(w)
    api(w).zoomTo(4) // 3200 x 1600 in 800 x 600: 1200 and 500 each way
    await nextTick()
    press(d, 'ArrowRight')
    press(d, 'ArrowRight')
    press(d, 'ArrowDown')
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: -160, y: -60, zoom: 4 })
    press(d, 'ArrowLeft')
    press(d, 'ArrowUp')
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: -80, y: 0, zoom: 4 })
    expect(indexes(w)).toEqual([])
    press(d, 'End')
    await nextTick()
    expect(indexes(w)).toEqual([1])
    expect(zooms(w)).toEqual([4, 1])
    press(d, 'Home')
    expect(indexes(w)).toEqual([1, 0])
    press(d, 'ArrowRight') // at fit the arrows navigate again
    expect(indexes(w)).toEqual([1, 0, 1])
  })

  it('the wheel zooms around the pointer, with deltaMode and ctrl (pinch) normalised', async () => {
    fakeLayout()
    const w = await zoomable()
    const stage = w.get('.bl-lightbox__stage').element
    const zoomOf = () => transformOf(frameOf(w)).zoom
    // A point 200px right of the frame centre stays where it is.
    expect(wheel(stage, { dy: -100, x: 600 }).defaultPrevented).toBe(true)
    await nextTick()
    const s = transformOf(frameOf(w))
    expect(s.zoom).toBeCloseTo(Math.exp(0.2), 6)
    expect(s.x + s.zoom * 200).toBeCloseTo(200, 6)
    const cases: [Parameters<typeof wheel>[1], number][] = [
      [{ dy: -3, mode: 1 }, Math.exp(48 * 0.002)], // lines x16
      [{ dy: -1, mode: 2 }, 2], // a page is 600px: capped at x2 per event
      [{ dy: -10, ctrl: true }, Math.exp(0.1)], // trackpad pinch
      [{ dy: 100 }, 1] // out of fit: stays at 1
    ]
    for (const [init, want] of cases) {
      api(w).resetZoom()
      await nextTick()
      expect(wheel(stage, init).defaultPrevented).toBe(true)
      await nextTick()
      expect(zoomOf()).toBeCloseTo(want, 6)
    }
  })

  it('a mostly horizontal wheel pans while zoomed and is left alone at fit', async () => {
    fakeLayout()
    const w = await zoomable()
    const stage = w.get('.bl-lightbox__stage').element
    expect(wheel(stage, { dx: 50, dy: 5 }).defaultPrevented).toBe(false)
    await nextTick()
    expect(frameOf(w).style.transform).toBe('')
    api(w).zoomTo(2) // 1600 x 800: 400 and 100 each way
    await nextTick()
    expect(wheel(stage, { dx: 50, dy: 10 }).defaultPrevented).toBe(true)
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: -50, y: -10, zoom: 2 })
    expect(wheel(stage, { dx: -900, dy: 0 }).defaultPrevented).toBe(true)
    await nextTick()
    expect(transformOf(frameOf(w)).x).toBe(400)
    expect(indexes(w)).toEqual([])
  })

  it('two pointers pinch around their midpoint; lifting one continues as a pan', async () => {
    fakeLayout()
    const w = await zoomable()
    const stage = w.get('.bl-lightbox__stage').element
    pointer(stage, 'pointerdown', 300, 300, 1)
    pointer(stage, 'pointerdown', 500, 300, 2)
    pointer(stage, 'pointermove', 700, 300, 2) // twice as far apart, midpoint 100px right
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: 100, y: 0, zoom: 2 })
    pointer(stage, 'pointerup', 700, 300, 2)
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: 100, y: 0, zoom: 2 })
    pointer(stage, 'pointermove', 250, 340, 1)
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: 50, y: 40, zoom: 2 })
    pointer(stage, 'pointerup', 250, 340, 1)
    expect(indexes(w)).toEqual([])
    expect(zooms(w)).toEqual([2])
  })

  it('a pinch that starts as a one-finger pan picks up without a jump', async () => {
    fakeLayout()
    const w = await zoomable()
    api(w).zoomTo(2)
    await nextTick()
    const stage = w.get('.bl-lightbox__stage').element
    pointer(stage, 'pointerdown', 400, 300, 1)
    pointer(stage, 'pointermove', 380, 300, 1)
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: -20, y: 0, zoom: 2 })
    pointer(stage, 'pointerdown', 580, 300, 2)
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: -20, y: 0, zoom: 2 })
    pointer(stage, 'pointermove', 780, 300, 2) // distance 200 -> 400
    await nextTick()
    // the content under the old midpoint (480) is now under the new one (580)
    const s = transformOf(frameOf(w))
    expect(s.zoom).toBe(4)
    expect(s.x + 4 * ((80 + 20) / 2)).toBeCloseTo(180, 6)
  })

  it('swipes navigate at fit only; a drag while zoomed pans', async () => {
    fakeLayout()
    const w = await zoomable()
    const stage = w.get('.bl-lightbox__stage').element
    api(w).zoomTo(2)
    await nextTick()
    swipe(stage, -200)
    await nextTick()
    expect(indexes(w)).toEqual([])
    expect(transformOf(frameOf(w))).toEqual({ x: -200, y: 0, zoom: 2 })
    api(w).resetZoom()
    await nextTick()
    swipe(stage, -200)
    expect(indexes(w)).toEqual([1])
  })

  it('a drag suppresses the click that ends it: no slotted link, no close', async () => {
    fakeLayout()
    const onLink = vi.fn()
    const w = await zoomable(
      {},
      { default: () => h('a', { class: 'link', href: '#x', onClick: onLink }, 'Map') }
    )
    api(w).zoomTo(2)
    await nextTick()
    const link = w.get('.link').element
    const stage = w.get('.bl-lightbox__stage').element
    mouse(link, 'pointerdown', 400)
    mouse(link, 'pointermove', 350)
    mouse(link, 'pointerup', 350)
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })
    link.dispatchEvent(click)
    expect(onLink).not.toHaveBeenCalled()
    expect(click.defaultPrevented).toBe(true)
    // pressed on the frame around the media, dragged, released and clicked on the stage
    mouse(frameOf(w), 'pointerdown', 50)
    mouse(stage, 'pointermove', 100)
    mouse(stage, 'pointerup', 100)
    stage.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }))
    expect(dialogEl(w).open).toBe(true)
    // a plain click still works, and a plain press on the frame around the media still closes
    mouse(link, 'pointerdown', 400)
    mouse(link, 'pointerup', 400)
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(onLink).toHaveBeenCalledTimes(1)
    mouse(frameOf(w), 'pointerdown', 50)
    mouse(frameOf(w), 'pointerup', 50)
    frameOf(w).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(dialogEl(w).open).toBe(false)
  })

  it('double-click or double-tap toggles fit and 1:1, or 2.5x when 1:1 is near fit', async () => {
    fakeLayout()
    vi.useFakeTimers()
    try {
      const w = await zoomable()
      const tap = (x: number, y = 300) => {
        const media = w.get('.bl-lightbox__media').element
        pointer(media, 'pointerdown', x, y)
        pointer(media, 'pointerup', x, y)
      }
      tap(600)
      vi.advanceTimersByTime(200)
      tap(610, 310)
      await nextTick()
      const s = transformOf(frameOf(w))
      expect(s.zoom).toBe(4) // 1:1 of a 1600px image shown at a quarter
      // the content under the second tap (210, 10 from the centre) stays under it
      expect(s.x + 4 * 210).toBeCloseTo(210, 6)
      expect(s.y + 4 * 10).toBeCloseTo(10, 6)
      tap(500)
      vi.advanceTimersByTime(100)
      tap(500)
      await nextTick()
      expect(frameOf(w).style.transform).toBe('')
      // too slow, then too far apart
      tap(500)
      vi.advanceTimersByTime(301)
      tap(500)
      vi.advanceTimersByTime(400)
      tap(500)
      tap(530)
      await nextTick()
      expect(frameOf(w).style.transform).toBe('')
      api(w).next()
      await nextTick()
      tap(400)
      tap(400)
      await nextTick()
      expect(transformOf(frameOf(w)).zoom).toBe(2.5)
    } finally {
      vi.useRealTimers()
    }
  })

  it('controls: out and in disabled at the limits, the readout names and resets the zoom', async () => {
    fakeLayout()
    const w = await zoomable({ labels: { zoomIn: 'Größer' } })
    const [out, readout, inn] = w.findAll<HTMLButtonElement>('.bl-lightbox__zoom button')
    expect(w.find('.bl-lightbox__bar .bl-lightbox__zoom').exists()).toBe(true)
    expect(out!.attributes('aria-label')).toBe('Zoom out')
    expect(inn!.attributes('aria-label')).toBe('Größer')
    expect(out!.element.disabled).toBe(true)
    expect(readout!.text()).toBe('100%')
    expect(readout!.attributes('aria-label')).toBe('Reset zoom, 100%')
    await inn!.trigger('click')
    expect(zooms(w)).toEqual([1.25])
    expect(readout!.text()).toBe('125%')
    expect(out!.element.disabled).toBe(false)
    api(w).zoomTo(14)
    await nextTick()
    inn!.element.focus()
    await inn!.trigger('click')
    await nextTick()
    expect(zooms(w)).toEqual([1.25, 14, 16])
    expect(inn!.element.disabled).toBe(true)
    expect(document.activeElement).toBe(out!.element) // not dropped to <body>
    await readout!.trigger('click')
    expect(zooms(w)).toEqual([1.25, 14, 16, 1])
    const hidden = await zoomable({ zoomControls: false })
    expect(hidden.find('.bl-lightbox__zoom').exists()).toBe(false)
  })

  it('takes the natural size from loaded(size) and re-fits later without resetting', async () => {
    fakeLayout()
    let scope: Media | undefined
    const w = await zoomable(
      { items: [{ alt: 'Drawing' }] },
      {
        default: (p: Scope) => {
          scope = p as Media
          return h('svg', { class: 'drawing' })
        }
      }
    )
    api(w).zoomTo(100)
    await nextTick()
    expect(zooms(w)).toEqual([8]) // no natural size known
    scope!.loaded({ width: 4000, height: 3000 }) // fit 0.2: max 20
    await nextTick()
    api(w).zoomTo(100)
    await nextTick()
    expect(zooms(w)).toEqual([8, 20])
    scope!.loaded({ width: 1600, height: 1200 }) // fit 0.5: max 8, so 20 is clamped
    await nextTick()
    expect(zooms(w)).toEqual([8, 20, 8])
    api(w).zoomTo(3)
    scope!.loaded({ width: 1600, height: 1200 })
    await nextTick()
    expect(zooms(w)).toEqual([8, 20, 8, 3])
  })

  it('reads the natural size from a slotted svg viewBox', async () => {
    fakeLayout()
    const w = await zoomable(
      { items: [{ alt: 'Drawing' }] },
      { default: () => h('svg', { viewBox: '0 0 4000 3000' }) }
    )
    api(w).zoomTo(100)
    await nextTick()
    expect(zooms(w)).toEqual([20])
  })

  it("zooms on Safari's trackpad gesture events, leaving touch pinches to the pointers", async () => {
    fakeLayout()
    const w = await zoomable()
    const stage = w.get('.bl-lightbox__stage').element
    const gesture = (type: string, scale = 1) => {
      const ev = Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
        scale,
        clientX: 600,
        clientY: 300
      })
      stage.dispatchEvent(ev)
      return ev
    }
    expect(gesture('gesturestart').defaultPrevented).toBe(true)
    gesture('gesturechange', 2)
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: -200, y: 0, zoom: 2 })
    gesture('gesturechange', 3)
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: -400, y: 0, zoom: 3 })
    gesture('gestureend')
    api(w).resetZoom()
    pointer(stage, 'pointerdown', 300, 300, 1)
    pointer(stage, 'pointerdown', 500, 300, 2)
    expect(gesture('gesturestart').defaultPrevented).toBe(false)
    gesture('gesturechange', 2)
    await nextTick()
    expect(frameOf(w).style.transform).toBe('')
  })

  it('measures layout, not a painted rect a running transition still holds', async () => {
    fakeLayout()
    const w = await zoomable()
    api(w).zoomTo(4) // 3200 wide: 1200 each way
    await nextTick()
    wheel(w.get('.bl-lightbox__stage').element, { dx: -5000, dy: 0 })
    await nextTick()
    expect(transformOf(frameOf(w)).x).toBe(1200)
    paint.lag = transformOf(frameOf(w)) // the eased steps below have not painted yet
    press(dialogEl(w), '-')
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: 880, y: 0, zoom: 3.2 })
    press(dialogEl(w), '-')
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: 624, y: 0, zoom: 2.56 })
    // a wheel mid-transition anchors on the layout, not on the stale paint
    wheel(w.get('.bl-lightbox__stage').element, { dy: -100, ctrl: true, x: 500 })
    await nextTick()
    const s = transformOf(frameOf(w))
    expect(s.zoom).toBeCloseTo(5.12, 6)
    expect(s.x).toBeCloseTo(100 - 2 * (100 - 624), 6)
  })

  it('reports the clamped zoom back when a bound value clamps to the current one', async () => {
    fakeLayout()
    const w = await zoomable({ zoom: 1 })
    await w.setProps({ zoom: 0.5 })
    await nextTick()
    expect(zooms(w)).toEqual([1])
    await w.setProps({ zoom: 16 })
    await w.setProps({ zoom: 100 })
    await nextTick()
    expect(zooms(w)).toEqual([1, 16])
    await w.setProps({ zoom: Number.NaN })
    await nextTick()
    expect(zooms(w)).toEqual([1, 16, 16])
    const off = await opened({ items: [BIG], zoom: 1 })
    await off.setProps({ zoom: 3 })
    await nextTick()
    expect(zooms(off)).toEqual([1])
  })

  it('never drops a keyboard click, or a click a task after a drag', async () => {
    fakeLayout()
    const onLink = vi.fn()
    const w = await zoomable(
      {},
      { default: () => h('a', { class: 'link', href: '#x', onClick: onLink }, 'Map') }
    )
    api(w).zoomTo(2)
    await nextTick()
    const link = w.get('.link').element
    // a touch drag: no click follows it
    pointer(link, 'pointerdown', 400)
    pointer(link, 'pointermove', 350)
    pointer(link, 'pointerup', 350)
    // Enter on the focused link (detail 0) right away still activates it
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }))
    expect(onLink).toHaveBeenCalledTimes(1)
    // a mouse drag, then a click a task later, also gets through
    mouse(link, 'pointerdown', 400)
    mouse(link, 'pointermove', 350)
    mouse(link, 'pointerup', 350)
    await new Promise((resolve) => setTimeout(resolve)) // the next task
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }))
    expect(onLink).toHaveBeenCalledTimes(2)
  })

  it('leaves Safari gestures over interactive content alone, and ctrl+wheel during one', async () => {
    fakeLayout()
    const w = await zoomable(
      {},
      { default: () => h('div', { class: 'map', 'data-bl-no-swipe': '' }) }
    )
    const gesture = (target: EventTarget, type: string, scale = 1) => {
      const ev = Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
        scale,
        clientX: 400,
        clientY: 300
      })
      target.dispatchEvent(ev)
      return ev
    }
    const map = w.get('.map').element
    expect(gesture(map, 'gesturestart').defaultPrevented).toBe(false)
    gesture(map, 'gesturechange', 2)
    await nextTick()
    expect(zooms(w)).toEqual([])
    const stage = w.get('.bl-lightbox__stage').element
    gesture(stage, 'gesturestart')
    gesture(stage, 'gesturechange', 2)
    // WebKit may also send ctrl+wheel for the same pinch: it must not zoom twice
    expect(wheel(stage, { dy: -50, ctrl: true }).defaultPrevented).toBe(true)
    await nextTick()
    expect(zooms(w)).toEqual([2])
    gesture(stage, 'gestureend')
    wheel(stage, { dy: -10, ctrl: true })
    await nextTick()
    expect(zooms(w)).toHaveLength(2)
  })

  it('does not zoom a failed item: keys pass, controls are disabled at 100%', async () => {
    fakeLayout()
    const w = await zoomable()
    api(w).zoomTo(2)
    await nextTick()
    img(w).element.dispatchEvent(new Event('error'))
    await nextTick()
    expect(zooms(w)).toEqual([2, 1])
    expect(press(dialogEl(w), '+').defaultPrevented).toBe(false)
    api(w).zoomTo(3)
    await nextTick()
    expect(zooms(w)).toEqual([2, 1])
    const buttons = w.findAll<HTMLButtonElement>('.bl-lightbox__zoom button')
    expect(buttons.map((b) => b.element.disabled)).toEqual([true, true, true])
    expect(w.get('.bl-lightbox__readout').text()).toBe('100%')
  })

  it("drops a touch double-tap's click that arrives in a later task, but not after 350ms", async () => {
    fakeLayout()
    const onLink = vi.fn()
    const w = await zoomable(
      {},
      { default: () => h('a', { class: 'link', href: '#x', onClick: onLink }, 'Map') }
    )
    const link = w.get('.link').element
    const later = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    const doubleTap = () => {
      for (let i = 0; i < 2; i++) {
        pointer(link, 'pointerdown', 400)
        pointer(link, 'pointerup', 400)
      }
    }
    doubleTap()
    await nextTick()
    expect(zooms(w)).toEqual([4])
    await later(20) // Chromium sends a tap's click as its own task (GestureTap)
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }))
    expect(onLink).not.toHaveBeenCalled()
    doubleTap()
    await later(20)
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }))
    expect(onLink).toHaveBeenCalledTimes(1) // never a keyboard or AT activation
    doubleTap()
    await later(400) // no click came: the flag has expired
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }))
    expect(onLink).toHaveBeenCalledTimes(2)
  })

  it('moves focus to the dialog when a focused zoom control is disabled with no enabled partner', async () => {
    fakeLayout()
    const w = await zoomable()
    api(w).next()
    await nextTick()
    const readout = w.get<HTMLButtonElement>('.bl-lightbox__readout').element
    readout.focus()
    img(w).element.dispatchEvent(new Event('error')) // the item shown fails: no zoom control left
    await nextTick()
    await nextTick()
    expect(readout.disabled).toBe(true)
    expect(document.activeElement).toBe(dialogEl(w))
  })

  it('leaves pointers on the caption alone: no double-click zoom, no pan', async () => {
    fakeLayout()
    const w = await zoomable({ items: [{ ...BIG, caption: 'Big' }, SMALL] })
    const caption = w.get('.bl-lightbox__caption').element
    for (let i = 0; i < 2; i++) {
      pointer(caption, 'pointerdown', 400, 580)
      pointer(caption, 'pointerup', 400, 580)
    }
    await nextTick()
    expect(zooms(w)).toEqual([])
    api(w).zoomTo(2)
    await nextTick()
    pointer(caption, 'pointerdown', 400, 580)
    pointer(caption, 'pointermove', 300, 580)
    await nextTick()
    expect(transformOf(frameOf(w))).toEqual({ x: 0, y: 0, zoom: 2 })
  })

  it('adds or removes its blur listener when zoomable changes while open', async () => {
    fakeLayout()
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const blurs = (spy: typeof add) => spy.mock.calls.filter((c) => c[0] === 'blur')
    const w = await opened({ items: [BIG] })
    expect(blurs(add)).toHaveLength(0)
    await w.setProps({ zoomable: true })
    expect(blurs(add)).toHaveLength(1)
    await w.setProps({ zoomable: false })
    expect(blurs(remove).map((c) => c[1])).toContain(blurs(add)[0]![1])
  })

  it('cancel, lost capture and window blur end a gesture', async () => {
    fakeLayout()
    const w = await zoomable()
    api(w).zoomTo(2)
    await nextTick()
    const stage = w.get('.bl-lightbox__stage').element
    const at = () => transformOf(frameOf(w))
    for (const end of [
      () => pointer(stage, 'pointercancel', 380),
      () => pointer(stage, 'lostpointercapture', 380),
      () => window.dispatchEvent(new Event('blur'))
    ]) {
      api(w).zoomTo(2)
      pointer(stage, 'pointerdown', 400)
      pointer(stage, 'pointermove', 380)
      await nextTick()
      const before = at()
      end()
      pointer(stage, 'pointermove', 300)
      await nextTick()
      expect(at()).toEqual(before)
      pointer(stage, 'pointerup', 300)
    }
  })

  it('adds its window listener only while open and removes it on close and unmount', async () => {
    fakeLayout()
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const blurs = (spy: typeof add) => spy.mock.calls.filter((c) => c[0] === 'blur')
    const w = lightbox({ zoomable: true, items: [BIG] })
    expect(blurs(add)).toHaveLength(0)
    await w.setProps({ open: true })
    expect(blurs(add)).toHaveLength(1)
    await w.setProps({ open: false })
    expect(blurs(remove)).toHaveLength(1)
    expect(blurs(remove)[0]![1]).toBe(blurs(add)[0]![1])
    await w.setProps({ open: true })
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(blurs(remove)).toHaveLength(2)
  })
})
