import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, ref, type Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import BlRadio from '../../vue/components/BlRadio.vue'
import BlRadioGroup from '../../vue/components/BlRadioGroup.vue'

type Value = string | number | undefined
// Loosely typed so the tests can pass an optional model and option objects.
const Group = BlRadioGroup as Component
const Radio = BlRadio as Component

// A group with three options whose model lives in `model`.
function group(
  model: { value: Value },
  groupProps: Record<string, unknown> = {},
  options: Array<Record<string, unknown>> = [
    { label: 'Low', value: 'low' },
    { label: 'Mid', value: 'mid', hint: 'Default' },
    { label: 'High', value: 'high' }
  ]
) {
  return defineComponent({
    setup: () => () =>
      h(
        Group,
        {
          legend: 'Level',
          modelValue: model.value,
          'onUpdate:modelValue': (v: Value) => (model.value = v),
          ...groupProps
        },
        () => options.map((o) => h(Radio, o))
      )
  })
}

const inputs = (w: ReturnType<typeof mount>) =>
  w.findAll('input').map((i) => i.element as HTMLInputElement)
const benchlightWarnings = (spy: ReturnType<typeof vi.spyOn>) =>
  spy.mock.calls.filter((c: unknown[]) => String(c[0]).startsWith('[benchlight]'))

describe('BlRadio outside a group', () => {
  // First in the file: the dev warning fires once per page load.
  it('warns once and renders a plain radio from its attrs with no model', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onChange = vi.fn()
    const a = mount(BlRadio, {
      props: { label: 'Alone', value: 'a' },
      attrs: {
        name: 'solo',
        checked: true,
        onChange,
        modelValue: 'a',
        'onUpdate:modelValue': vi.fn()
      }
    })
    mount(BlRadio, { props: { label: 'Again', value: 'b' } })
    expect(benchlightWarnings(spy)).toHaveLength(1)
    const input = a.get('input')
    expect(input.attributes('type')).toBe('radio')
    expect(input.attributes('name')).toBe('solo')
    expect(input.attributes('value')).toBe('a')
    expect((input.element as HTMLInputElement).checked).toBe(true)
    expect(Object.keys(input.attributes()).filter((k) => /modelvalue/i.test(k))).toEqual([])
    await input.trigger('change')
    expect(onChange).toHaveBeenCalledOnce()
    spy.mockRestore()
  })
})

describe('BlRadioGroup', () => {
  it('renders a radiogroup fieldset named by its legend', () => {
    const w = mount(group({ value: 'mid' }))
    const fieldset = w.get('fieldset')
    expect(fieldset.attributes('role')).toBe('radiogroup')
    expect(fieldset.classes()).toEqual(['bl-fieldset', 'bl-radio-group'])
    expect(fieldset.element.firstElementChild?.tagName).toBe('LEGEND')
    expect(w.get('legend').classes()).toContain('bl-fieldset__legend')
    expect(w.get('legend').text()).toBe('Level')
    expect(inputs(w).map((i) => i.checked)).toEqual([false, true, false])
  })

  it('emits the selected radio value', async () => {
    const model = { value: 'mid' as Value }
    const w = mount(group(model))
    await w.findAll('input')[2]!.setValue(true)
    expect(model.value).toBe('high')
    expect(w.getComponent(BlRadioGroup).emitted('update:modelValue')).toEqual([['high']])
  })

  it('keeps numeric values numeric', async () => {
    const model = { value: 1 as Value }
    const w = mount(
      group(model, {}, [
        { label: 'One', value: 1 },
        { label: 'Two', value: 2 }
      ])
    )
    expect(inputs(w).map((i) => i.checked)).toEqual([true, false])
    await w.findAll('input')[1]!.setValue(true)
    expect(model.value).toBe(2)
  })

  it('shares a generated name across its radios, or uses the given one', () => {
    const Two = group({ value: undefined })
    const w = mount(defineComponent({ setup: () => () => [h(Two), h(Two)] }))
    const names = inputs(w).map((i) => i.name)
    expect(names[0]).toBeTruthy()
    expect(new Set(names.slice(0, 3)).size).toBe(1)
    expect(new Set(names.slice(3)).size).toBe(1)
    expect(names[3]).not.toBe(names[0])
    const named = inputs(mount(group({ value: undefined }, { name: 'level' }))).map((i) => i.name)
    expect(named).toEqual(['level', 'level', 'level'])
  })

  it('marks the fieldset invalid and keeps the group message off the radios', () => {
    const w = mount(group({ value: undefined }, { hint: 'Pick one', error: 'Required' }))
    const fieldset = w.get('fieldset')
    const hint = w.get('p.bl-fieldset__hint')
    const error = w.get('p.bl-fieldset__error')
    expect(error.text()).toBe('Required')
    expect(fieldset.classes()).toContain('bl-fieldset--invalid')
    expect(fieldset.attributes('aria-invalid')).toBe('true')
    expect(fieldset.attributes('aria-describedby')).toBe(
      `${hint.attributes('id')} ${error.attributes('id')}`
    )
    const radios = w.findAll('input')
    for (const radio of radios) expect(radio.attributes('aria-invalid')).toBeUndefined()
    expect(radios[0]!.attributes('aria-describedby')).toBeUndefined()
    expect(radios[1]!.attributes('aria-describedby')).toBe(
      w.get('.bl-radio__hint').attributes('id')
    )
    expect(w.get('label').element.contains(w.get('.bl-radio__hint').element)).toBe(false)
  })

  it('treats an empty error as valid and lets a consumer aria-invalid win', () => {
    const empty = mount(group({ value: undefined }, { error: '' }))
    const fieldset = empty.get('fieldset')
    expect(empty.find('.bl-fieldset__error').exists()).toBe(false)
    expect(fieldset.classes()).not.toContain('bl-fieldset--invalid')
    expect(fieldset.attributes('aria-invalid')).toBeUndefined()
    expect(fieldset.attributes('aria-describedby')).toBeUndefined()
    const wins = mount(group({ value: undefined }, { error: 'Bad', 'aria-invalid': 'false' }))
    expect(wins.get('fieldset').attributes('aria-invalid')).toBe('false')
  })

  it('renders required on every radio and aria-required on the fieldset', () => {
    const w = mount(group({ value: undefined }, { required: true }))
    expect(w.get('fieldset').attributes('aria-required')).toBe('true')
    expect(inputs(w).map((i) => i.required)).toEqual([true, true, true])
    const plain = mount(group({ value: undefined }))
    expect(plain.get('fieldset').attributes('aria-required')).toBeUndefined()
    expect(inputs(plain).map((i) => i.required)).toEqual([false, false, false])
  })

  it('disables every radio from the group, or a single radio', () => {
    const all = mount(group({ value: undefined }, { disabled: true }))
    expect(inputs(all).map((i) => i.disabled)).toEqual([true, true, true])
    const one = mount(
      group({ value: undefined }, {}, [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b', disabled: true }
      ])
    )
    expect(inputs(one).map((i) => i.disabled)).toEqual([false, true])
  })

  it('puts every group attr on the fieldset, class and style included', () => {
    const w = mount(
      group(
        { value: undefined },
        {
          class: 'extra',
          style: 'color: red',
          id: 'lvl',
          'data-x': '1',
          'aria-describedby': 'outside'
        }
      )
    )
    const fieldset = w.get('fieldset')
    expect(fieldset.classes()).toEqual(['bl-fieldset', 'bl-radio-group', 'extra'])
    expect(fieldset.attributes('style')).toContain('color: red')
    expect(fieldset.attributes('id')).toBe('lvl')
    expect(fieldset.attributes('data-x')).toBe('1')
    expect(fieldset.attributes('aria-describedby')).toBe('outside')
  })

  it('puts radio class and style on its root and other attrs on its input', () => {
    const w = mount(
      group({ value: undefined }, {}, [
        { label: 'A', value: 'a', class: 'extra', id: 'ra', 'data-x': '1', 'aria-describedby': 'x' }
      ])
    )
    const root = w.get('.bl-radio')
    expect(root.classes()).toEqual(['bl-radio', 'extra'])
    expect(root.attributes('id')).toBeUndefined()
    const input = w.get('input')
    expect(input.attributes('id')).toBe('ra')
    expect(input.attributes('data-x')).toBe('1')
    expect(input.attributes('aria-describedby')).toBe('x')
  })

  it('ignores a v-model on a radio inside a group and keeps it off the DOM', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const stray = vi.fn()
    const model = { value: 'a' as Value }
    const w = mount(
      group(model, {}, [
        { label: 'A', value: 'a', modelValue: 'zzz', 'onUpdate:modelValue': stray },
        { label: 'B', value: 'b' }
      ])
    )
    for (const input of w.findAll('input')) {
      expect(Object.keys(input.attributes()).filter((k) => /modelvalue/i.test(k))).toEqual([])
    }
    await w.findAll('input')[1]!.setValue(true)
    expect(model.value).toBe('b')
    expect(stray).not.toHaveBeenCalled()
    expect(benchlightWarnings(spy)).toEqual([])
    spy.mockRestore()
  })

  it('posts the checked value under the group name', async () => {
    const model = ref<Value>('low')
    const Host = defineComponent({
      setup: () => () =>
        h('form', [
          h(
            Group,
            {
              legend: 'Level',
              name: 'level',
              modelValue: model.value,
              'onUpdate:modelValue': (v: Value) => (model.value = v)
            },
            () => [
              h(BlRadio, { label: 'Low', value: 'low' }),
              h(BlRadio, { label: 'High', value: 'high' })
            ]
          )
        ])
    })
    const w = mount(Host, { attachTo: document.body })
    const form = w.get('form').element as HTMLFormElement
    expect(new FormData(form).get('level')).toBe('low')
    await w.findAll('input')[1]!.setValue(true)
    expect(new FormData(form).get('level')).toBe('high')
    w.unmount()
  })

  it.each([
    [
      'string',
      'mid',
      'high',
      [
        { label: 'Low', value: 'low' },
        { label: 'Mid', value: 'mid' },
        { label: 'High', value: 'high' }
      ]
    ],
    [
      'number',
      2,
      3,
      [
        { label: 'One', value: 1 },
        { label: 'Two', value: 2 },
        { label: 'Three', value: 3 }
      ]
    ]
  ])(
    'restores the mount value on form reset (%s values)',
    async (_kind, initial, next, options) => {
      const model = ref<Value>(initial)
      const Host = defineComponent({
        setup: () => () =>
          h('form', [
            h(
              Group,
              {
                legend: 'Level',
                modelValue: model.value,
                'onUpdate:modelValue': (v: Value) => (model.value = v)
              },
              () => options.map((o) => h(Radio, o))
            )
          ])
      })
      const w = mount(Host, { attachTo: document.body })
      await w.findAll('input')[2]!.setValue(true)
      expect(model.value).toBe(next)
      ;(w.get('form').element as HTMLFormElement).reset()
      await new Promise((r) => setTimeout(r, 0))
      expect(inputs(w).map((i) => i.checked)).toEqual([false, true, false])
      expect(model.value).toBe(initial)
      w.unmount()
    }
  )

  it('resets to nothing checked when it mounted with no value', async () => {
    const model = ref<Value>(undefined)
    const Host = defineComponent({
      setup: () => () =>
        h('form', [
          h(
            Group,
            {
              legend: 'Level',
              modelValue: model.value,
              'onUpdate:modelValue': (v: Value) => (model.value = v)
            },
            () => [h(BlRadio, { label: 'A', value: 'a' }), h(BlRadio, { label: 'B', value: 'b' })]
          )
        ])
    })
    const w = mount(Host, { attachTo: document.body })
    await w.findAll('input')[0]!.setValue(true)
    expect(model.value).toBe('a')
    ;(w.get('form').element as HTMLFormElement).reset()
    await new Promise((r) => setTimeout(r, 0))
    expect(inputs(w).map((i) => i.checked)).toEqual([false, false])
    expect(model.value).toBeUndefined()
    w.unmount()
  })

  it('renders on the server', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(BlRadioGroup, { legend: 'Level', modelValue: 'b', name: 'lvl', required: true }, () => [
            h(BlRadio, { label: 'A', value: 'a' }),
            h(BlRadio, { label: 'B', value: 'b' })
          ])
      })
    )
    expect(html).toContain('role="radiogroup"')
    expect(html).toContain('aria-required="true"')
    expect(html.match(/type="radio"/g)).toHaveLength(2)
    expect(html.match(/name="lvl"/g)).toHaveLength(2)
    expect(html.match(/ checked/g)).toHaveLength(1)
  })
})
