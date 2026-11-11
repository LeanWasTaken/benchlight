import { mount, type VueWrapper } from '@vue/test-utils'
import { renderToString } from '@vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import BlField from '../../vue/components/BlField.vue'
import BlNumberField from '../../vue/components/BlNumberField.vue'

// happy-dom sanitises a number input's text the moment it is set ("-" becomes ""), so these tests
// give the element browser-like text: what was typed stays, and `valueAsNumber` parses it (NaN for
// empty or unparsable). Writes from the component go through the spied setter.
function typeable(el: HTMLInputElement) {
  let text = el.value
  const writes = vi.fn((v: string) => {
    text = v === 'NaN' || v === 'Infinity' || v === '-Infinity' ? '' : v
  })
  Object.defineProperty(el, 'value', { configurable: true, get: () => text, set: writes })
  Object.defineProperty(el, 'valueAsNumber', {
    configurable: true,
    get: () => (text.trim() === '' ? NaN : Number(text))
  })
  return {
    writes,
    type(v: string) {
      text = v
      el.dispatchEvent(new Event('input', { bubbles: true }))
    },
    commit() {
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }
}

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

function mountField(props: Record<string, unknown> = {}) {
  const w = mount(BlNumberField, {
    attachTo: document.body,
    props: {
      'onUpdate:modelValue': (v: number | null) => w.setProps({ modelValue: v }),
      ...props
    }
  })
  wrapper = w
  const el = w.get('input').element as HTMLInputElement
  return { w, el, ...typeable(el) }
}

const emitted = (w: VueWrapper) => w.emitted('update:modelValue') ?? []

describe('BlNumberField', () => {
  it('renders input.bl-input[type=number] with min, max, step and disabled', () => {
    const w = mount(BlNumberField, { props: { min: 0, max: 10, step: 0.5, disabled: true } })
    const el = w.get('input.bl-input[type="number"]')
    expect(w.element.tagName).toBe('INPUT')
    expect(el.attributes('min')).toBe('0')
    expect(el.attributes('max')).toBe('10')
    expect(el.attributes('step')).toBe('0.5')
    expect((el.element as HTMLInputElement).disabled).toBe(true)
  })

  it('leaves min, max and step off when unset', () => {
    const el = mount(BlNumberField).get('input')
    expect(el.attributes('min')).toBeUndefined()
    expect(el.attributes('max')).toBeUndefined()
    expect(el.attributes('step')).toBeUndefined()
  })

  it('shows the model and an empty field for null', () => {
    expect(
      (mount(BlNumberField, { props: { modelValue: 7 } }).get('input').element as HTMLInputElement)
        .value
    ).toBe('7')
    expect((mount(BlNumberField).get('input').element as HTMLInputElement).value).toBe('')
  })

  it('puts class, style, aria-label, name and listeners on the input', async () => {
    const onFocus = vi.fn()
    const w = mount(BlNumberField, {
      attrs: { class: 'extra', style: 'width: 50%', 'aria-label': 'Gain', name: 'gain', onFocus }
    })
    const el = w.get('input')
    expect(el.classes()).toEqual(expect.arrayContaining(['bl-input', 'extra']))
    expect(el.attributes('style')).toContain('width: 50%')
    expect(el.attributes('aria-label')).toBe('Gain')
    expect(el.attributes('name')).toBe('gain')
    await el.trigger('focus')
    expect(onFocus).toHaveBeenCalledOnce()
  })

  it('takes the field id and describes itself by hint then error', () => {
    const w = mount(BlField, {
      props: { label: 'Gain', id: 'g', hint: 'Hint', error: 'Too high' },
      slots: { default: () => h(BlNumberField) }
    })
    const el = w.get('input')
    expect(el.attributes('id')).toBe('g')
    expect(el.attributes('aria-describedby')).toBe('g-hint g-error')
    expect(el.attributes('aria-invalid')).toBe('true')
  })

  it('merges a consumer aria-describedby after the hint and keeps the field id over a consumer id', () => {
    const w = mount(BlField, {
      props: { label: 'Gain', id: 'g', hint: 'Hint' },
      slots: { default: () => h(BlNumberField, { id: 'mine', 'aria-describedby': 'extra g-hint' }) }
    })
    const el = w.get('input')
    expect(el.attributes('id')).toBe('g')
    expect(el.attributes('aria-describedby')).toBe('g-hint extra')
    expect(el.attributes('aria-invalid')).toBeUndefined()
  })

  it('follows valid numbers while typing', async () => {
    const { w, type } = mountField()
    type('3')
    await nextTick()
    expect(emitted(w).at(-1)).toEqual([3])
    type('-2.5')
    await nextTick()
    expect(emitted(w).at(-1)).toEqual([-2.5])
  })

  it('emits null for an emptied field', async () => {
    const { w, type } = mountField({ modelValue: 4 })
    type('')
    await nextTick()
    expect(emitted(w)).toEqual([[null]])
  })

  it.each(['-', '1e'])(
    'emits null for "%s" and leaves the text alone while focused',
    async (text) => {
      const { w, el, type, writes } = mountField({ modelValue: 4 })
      el.focus()
      type(text)
      await nextTick()
      await nextTick()
      expect(emitted(w)).toEqual([[null]])
      expect(w.props('modelValue')).toBeNull()
      expect(writes).not.toHaveBeenCalled()
      expect(el.value).toBe(text)
    }
  )

  it('does not rewrite a typed number while focused', async () => {
    const { w, el, type, writes } = mountField()
    el.focus()
    type('1.50')
    await nextTick()
    await nextTick()
    expect(w.props('modelValue')).toBe(1.5)
    expect(writes).not.toHaveBeenCalled()
    expect(el.value).toBe('1.50')
  })

  it('clamps to [min, max] on change and writes the value into the element and model', async () => {
    const { w, el, type, commit } = mountField({ min: 0, max: 10 })
    el.focus()
    type('-5')
    await nextTick()
    expect(emitted(w).at(-1)).toEqual([-5])
    commit()
    await nextTick()
    expect(emitted(w).at(-1)).toEqual([0])
    expect(el.value).toBe('0')
    type('42')
    commit()
    await nextTick()
    expect(emitted(w).at(-1)).toEqual([10])
    expect(el.value).toBe('10')
  })

  it('writes the clamped value even when the model already held it', async () => {
    const { w, el, type, commit } = mountField({ modelValue: 0, min: 0 })
    el.focus()
    type('-')
    type('-5')
    commit()
    await nextTick()
    expect(w.props('modelValue')).toBe(0)
    expect(el.value).toBe('0')
  })

  it('does not snap to step on change', async () => {
    const { w, el, type, commit } = mountField({ min: 0, max: 10, step: 2 })
    el.focus()
    type('3.3')
    commit()
    await nextTick()
    expect(w.props('modelValue')).toBe(3.3)
    expect(el.value).toBe('3.3')
  })

  it('clears unparsable text on change', async () => {
    const { w, el, type, commit } = mountField({ modelValue: 2 })
    el.focus()
    type('1e')
    commit()
    await nextTick()
    expect(w.props('modelValue')).toBeNull()
    expect(el.value).toBe('')
  })

  it.each([
    ['above max', { min: 0, max: 10 }, 50, '50'],
    ['below min', { min: 0, max: 10 }, -3, '-3'],
    ['with min > max', { min: 10, max: 0 }, 5, '5'],
    ['NaN', { min: 0, max: 10 }, NaN, '']
  ])('shows an outside value %s as given and emits nothing', async (_, range, value, text) => {
    const { w, el } = mountField(range)
    await w.setProps({ modelValue: value })
    expect(el.value).toBe(text)
    expect(emitted(w)).toEqual([])
    expect(w.props('modelValue')).toBe(value)
  })

  it('writes an outside value even while focused', async () => {
    const { w, el, type } = mountField({ modelValue: 1 })
    el.focus()
    type('-')
    await nextTick()
    await w.setProps({ modelValue: 8 })
    expect(el.value).toBe('8')
  })

  it('writes an outside value equal to stale typing after another outside write', async () => {
    const { w, el, type } = mountField()
    el.focus()
    type('5')
    await nextTick()
    expect(w.props('modelValue')).toBe(5)
    await w.setProps({ modelValue: null })
    expect(el.value).toBe('')
    await w.setProps({ modelValue: 5 })
    expect(el.value).toBe('5')
  })

  it('leaves a typed value unclamped on commit when min > max', async () => {
    const { w, el, type, commit } = mountField({ min: 10, max: 0 })
    el.focus()
    type('5')
    commit()
    await nextTick()
    expect(emitted(w).at(-1)).toEqual([5])
    expect(el.value).toBe('5')
  })

  it('clamps to max alone when only max is set', async () => {
    const { w, el, type, commit } = mountField({ max: 3 })
    el.focus()
    type('9')
    commit()
    await nextTick()
    expect(emitted(w).at(-1)).toEqual([3])
    expect(el.value).toBe('3')
  })

  it('works without a bound model', async () => {
    const w = mount(BlNumberField, { attachTo: document.body })
    wrapper = w
    const el = w.get('input').element as HTMLInputElement
    const { type, commit } = typeable(el)
    el.focus()
    type('12')
    commit()
    await nextTick()
    expect(w.emitted('update:modelValue')).toEqual([[12]])
    expect(el.value).toBe('12')
  })

  it('blurs a focused field on wheel without preventing the scroll', () => {
    const { el } = mountField({ modelValue: 3 })
    el.focus()
    expect(document.activeElement).toBe(el)
    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 })
    el.dispatchEvent(wheel)
    expect(wheel.defaultPrevented).toBe(false)
    expect(document.activeElement).not.toBe(el)
  })

  it('renders the value on the server', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(BlNumberField, { modelValue: 5, min: 0 }) })
    )
    expect(html).toContain('type="number"')
    expect(html).toContain('value="5"')
    expect(html).toContain('min="0"')
  })
})
