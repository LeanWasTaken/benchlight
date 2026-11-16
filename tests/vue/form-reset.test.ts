import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, ref, type Component } from 'vue'
import BlInput from '../../vue/components/BlInput.vue'
import BlNumberField from '../../vue/components/BlNumberField.vue'
import BlRadio from '../../vue/components/BlRadio.vue'
import BlRadioGroup from '../../vue/components/BlRadioGroup.vue'
import BlRange from '../../vue/components/BlRange.vue'
import BlSegmented from '../../vue/components/BlSegmented.vue'
import BlSelect from '../../vue/components/BlSelect.vue'
import BlTextarea from '../../vue/components/BlTextarea.vue'

// A browser fires `reset` BEFORE it resets the controls; happy-dom fires it after. Fire it first
// too, so the handlers see the browser's order, then let happy-dom reset.
function nativeReset(form: HTMLFormElement): void {
  form.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }))
  form.reset()
}
const macrotask = () => new Promise((resolve) => setTimeout(resolve, 5))
const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' }
]

interface Case {
  name: string
  component: Component
  props: Record<string, unknown>
  tag: string
  // The model at mount: a reset restores it.
  initial: unknown
  // Puts a user edit on the element and returns the model value it should produce.
  edit(el: HTMLElement): unknown
}

const cases: Case[] = [
  {
    name: 'BlInput',
    component: BlInput,
    props: {},
    tag: 'input',
    initial: 'start',
    edit(el) {
      ;(el as HTMLInputElement).value = 'typed'
      el.dispatchEvent(new Event('input', { bubbles: true }))
      return 'typed'
    }
  },
  {
    name: 'BlTextarea',
    component: BlTextarea,
    props: {},
    tag: 'textarea',
    initial: 'start',
    edit(el) {
      ;(el as HTMLTextAreaElement).value = 'typed'
      el.dispatchEvent(new Event('input', { bubbles: true }))
      return 'typed'
    }
  },
  {
    name: 'BlSelect',
    component: BlSelect,
    props: { options },
    tag: 'select',
    initial: 'c',
    edit(el) {
      ;(el as HTMLSelectElement).value = 'b'
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return 'b'
    }
  },
  {
    name: 'BlRange',
    component: BlRange,
    props: { min: 0, max: 100 },
    tag: 'input',
    initial: 70,
    edit(el) {
      ;(el as HTMLInputElement).value = '20'
      el.dispatchEvent(new Event('input', { bubbles: true }))
      return 20
    }
  },
  {
    name: 'BlNumberField',
    component: BlNumberField,
    props: {},
    tag: 'input',
    initial: 7,
    edit(el) {
      ;(el as HTMLInputElement).value = '9'
      el.dispatchEvent(new Event('input', { bubbles: true }))
      return 9
    }
  }
]

const wrappers: VueWrapper[] = []
afterEach(() => {
  while (wrappers.length) wrappers.pop()!.unmount()
})

// A host with a v-model ref; `inForm` places the control inside the form or outside it, tied to
// the form by `form="id"`.
function host(c: Case, inForm: boolean) {
  const model = ref<unknown>(c.initial)
  const updates: unknown[] = []
  const control = () =>
    h(c.component, {
      ...c.props,
      modelValue: model.value,
      'onUpdate:modelValue': (v: unknown) => {
        updates.push(v)
        model.value = v
      },
      ...(inForm ? {} : { form: 'f1' })
    })
  const Host = defineComponent({
    setup: () => () =>
      inForm ? h('form', { id: 'f1' }, [control()]) : h('div', [h('form', { id: 'f1' }), control()])
  })
  const wrapper = mount(Host, { attachTo: document.body })
  wrappers.push(wrapper)
  const el = wrapper.find(c.tag).element as HTMLElement
  const form = wrapper.find('form').element as HTMLFormElement
  return { wrapper, el, form, model, updates }
}

describe.each(cases)('$name form reset', (c) => {
  for (const inForm of [true, false]) {
    it(`restores the mount-time value (${inForm ? 'inside' : 'form="id" outside'} the form)`, async () => {
      const { el, form, model } = host(c, inForm)
      model.value = c.edit(el)
      await nextTick()
      nativeReset(form)
      await macrotask()
      expect(model.value).toBe(c.initial)
    })
  }

  it('does not emit when the reset leaves the model unchanged', async () => {
    const { form, updates } = host(c, true)
    nativeReset(form)
    await macrotask()
    expect(updates).toEqual([])
  })

  it('does not write after unmount', async () => {
    const { wrapper, el, form, model } = host(c, true)
    model.value = c.edit(el)
    await nextTick()
    const edited = model.value
    nativeReset(form)
    wrapper.unmount()
    wrappers.pop()
    await macrotask()
    expect(model.value).toBe(edited)
  })
})

describe('group form reset with form="id" outside the form', () => {
  const radioOptions = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' }
  ]
  function groupHost(kind: 'segmented' | 'radiogroup') {
    const model = ref<string | undefined>('b')
    const bind = () => ({
      form: 'f2',
      modelValue: model.value,
      'onUpdate:modelValue': (v: string | undefined) => (model.value = v)
    })
    const Host = defineComponent({
      setup: () => () =>
        h('div', [
          h('form', { id: 'f2' }),
          kind === 'segmented'
            ? h(BlSegmented as Component, { ...bind(), options: radioOptions })
            : h(BlRadioGroup as Component, { ...bind(), legend: 'L' }, () =>
                radioOptions.map((o) => h(BlRadio as Component, { value: o.value }, () => o.label))
              )
        ])
    })
    const wrapper = mount(Host, { attachTo: document.body })
    wrappers.push(wrapper)
    return { wrapper, model, form: wrapper.find('form').element as HTMLFormElement }
  }

  for (const kind of ['segmented', 'radiogroup'] as const) {
    it(`${kind} restores the mount-time value on a reset of the form it names`, async () => {
      const { wrapper, model, form } = groupHost(kind)
      const inputs = wrapper.findAll('input[type="radio"]')
      expect(inputs.every((i) => i.attributes('form') === 'f2')).toBe(true)
      await inputs[2]!.setValue(true)
      expect(model.value).toBe('c')
      nativeReset(form)
      await macrotask()
      expect(model.value).toBe('b')
      expect(inputs.map((i) => (i.element as HTMLInputElement).checked)).toEqual([
        false,
        true,
        false
      ])
    })
  }
})

describe('form reset edge cases', () => {
  const input = BlInput as Component

  it('skips the sync when a later listener cancels the reset', async () => {
    const model = ref('start')
    const Host = defineComponent({
      setup: () => () =>
        h('form', [
          h(input, {
            modelValue: model.value,
            'onUpdate:modelValue': (v: string) => (model.value = v)
          })
        ])
    })
    const wrapper = mount(Host, { attachTo: document.body })
    wrappers.push(wrapper)
    const form = wrapper.find('form').element as HTMLFormElement
    const el = wrapper.find('input').element as HTMLInputElement
    form.addEventListener('reset', (e) => e.preventDefault())
    el.value = 'typed'
    el.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    // A cancelled reset leaves the model alone even if the element differs from it.
    el.value = 'changed-without-event'
    form.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }))
    await macrotask()
    expect(model.value).toBe('typed')
  })

  it('resetting one form leaves a control in another form untouched', async () => {
    const a = ref('a0')
    const b = ref('b0')
    const Host = defineComponent({
      setup: () => () =>
        h('div', [
          h('form', { id: 'fa' }, [
            h(input, { modelValue: a.value, 'onUpdate:modelValue': (v: string) => (a.value = v) })
          ]),
          h('form', { id: 'fb' }, [
            h(input, { modelValue: b.value, 'onUpdate:modelValue': (v: string) => (b.value = v) })
          ])
        ])
    })
    const wrapper = mount(Host, { attachTo: document.body })
    wrappers.push(wrapper)
    const inputs = wrapper.findAll('input')
    for (const [i, v] of [
      [0, 'a1'],
      [1, 'b1']
    ] as const) {
      ;(inputs[i]!.element as HTMLInputElement).value = v
      inputs[i]!.element.dispatchEvent(new Event('input', { bubbles: true }))
    }
    await nextTick()
    nativeReset(wrapper.findAll('form')[0]!.element as HTMLFormElement)
    await macrotask()
    expect(a.value).toBe('a0')
    expect(b.value).toBe('b1')
  })

  it('still resets after a KeepAlive deactivate and reactivate', async () => {
    const model = ref('start')
    const show = ref(true)
    const Panel = defineComponent({
      setup: () => () =>
        h(input, {
          modelValue: model.value,
          'onUpdate:modelValue': (v: string) => (model.value = v)
        })
    })
    const Host = defineComponent({
      setup: () => () =>
        h('form', [h(KeepAlive, null, { default: () => (show.value ? h(Panel) : h('i')) })])
    })
    const wrapper = mount(Host, { attachTo: document.body })
    wrappers.push(wrapper)
    show.value = false
    await nextTick()
    show.value = true
    await nextTick()
    const el = wrapper.find('input').element as HTMLInputElement
    el.value = 'typed'
    el.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    nativeReset(wrapper.find('form').element as HTMLFormElement)
    await macrotask()
    expect(model.value).toBe('start')
  })
})
