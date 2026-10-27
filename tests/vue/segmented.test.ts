import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type Component } from 'vue'
import BlSegmented from '../../vue/components/BlSegmented.vue'
import BlSegmentedNav from '../../vue/components/BlSegmentedNav.vue'

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true }
]

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('BlSegmented', () => {
  it('is a radiogroup of native radios sharing a name', () => {
    const wrapper = mount(BlSegmented, { props: { options, ariaLabel: 'Pick' } })
    expect(wrapper.attributes('role')).toBe('radiogroup')
    expect(wrapper.attributes('aria-label')).toBe('Pick')
    const inputs = wrapper.findAll('label.bl-segmented__item input[type=radio]')
    expect(inputs).toHaveLength(3)
    const names = new Set(inputs.map((i) => i.attributes('name')))
    expect(names.size).toBe(1)
    expect([...names][0]).toBeTruthy()
    expect(inputs[2]!.attributes('disabled')).toBeDefined()
  })

  it('uses a given name', () => {
    const wrapper = mount(BlSegmented, { props: { options, name: 'size' } })
    expect(wrapper.find('input').attributes('name')).toBe('size')
  })

  it('maps a plain aria-label attribute to the name', () => {
    const wrapper = mount(BlSegmented, { props: { options }, attrs: { 'aria-label': 'Plain' } })
    expect(wrapper.attributes('aria-label')).toBe('Plain')
  })

  it('works uncontrolled', async () => {
    const wrapper = mount(BlSegmented, { props: { options }, attachTo: document.body })
    const inputs = wrapper.findAll('input')
    await inputs[1]!.setValue(true)
    // Drop `b` and add it back: the new input is checked only if the component kept the model
    // locally (with a bare modelValue prop it would come back unchecked).
    await wrapper.setProps({ options: options.filter((o) => o.value !== 'b') })
    await wrapper.setProps({ options: [...options] })
    const after = wrapper.findAll('input').map((i) => (i.element as HTMLInputElement).checked)
    expect(after).toEqual([false, true, false])
    wrapper.unmount()
  })

  it('keeps the model and the DOM in agreement across a form reset', async () => {
    vi.useFakeTimers()
    const Host = defineComponent({
      setup() {
        const model = ref<string | undefined>('a')
        return () =>
          h('form', [
            h(BlSegmented as Component, {
              options,
              modelValue: model.value,
              'onUpdate:modelValue': (v: string | undefined) => (model.value = v)
            }),
            h('output', model.value ?? 'none')
          ])
      }
    })
    const wrapper = mount(Host, { attachTo: document.body })
    const radios = () =>
      wrapper.findAll('input').map((i) => (i.element as HTMLInputElement).checked)
    await wrapper.findAll('input')[1]!.setValue(true)
    expect(wrapper.find('output').text()).toBe('b')
    ;(wrapper.find('form').element as HTMLFormElement).reset()
    await vi.runAllTimersAsync()
    await nextTick()
    expect(radios()).toEqual([true, false, false])
    expect(wrapper.find('output').text()).toBe('a')
    wrapper.unmount()
  })

  it('emits on a user change', async () => {
    const wrapper = mount(BlSegmented, { props: { options, modelValue: 'a' } })
    await wrapper.findAll('input')[1]!.setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
  })

  it('checks nothing and emits nothing for a model matching no option', () => {
    const wrapper = mount(BlSegmented, { props: { options, modelValue: 'x' } })
    expect(wrapper.findAll('input').some((i) => (i.element as HTMLInputElement).checked)).toBe(
      false
    )
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('checks the option matching the model, including null', () => {
    const wrapper = mount(BlSegmented, {
      props: {
        options: [
          { value: null, label: 'All' },
          { value: 'a', label: 'A' }
        ],
        modelValue: null
      }
    })
    const inputs = wrapper.findAll('input')
    expect((inputs[0]!.element as HTMLInputElement).checked).toBe(true)
    expect((inputs[1]!.element as HTMLInputElement).checked).toBe(false)
  })

  it('never uses aria-pressed', () => {
    const wrapper = mount(BlSegmented, { props: { options, modelValue: 'a' } })
    expect(wrapper.html()).not.toContain('aria-pressed')
  })
})

describe('BlSegmentedNav', () => {
  const items = [
    { label: 'en', href: '/en', current: true },
    { label: 'lv', href: '/lv' }
  ]

  it('renders a nav of links and marks the current one', () => {
    const wrapper = mount(BlSegmentedNav, { props: { items, ariaLabel: 'Language' } })
    expect(wrapper.element.tagName).toBe('NAV')
    expect(wrapper.attributes('aria-label')).toBe('Language')
    const links = wrapper.findAll('a.bl-segmented__item')
    expect(links.map((l) => l.attributes('href'))).toEqual(['/en', '/lv'])
    expect(links[0]!.attributes('aria-current')).toBe('page')
    expect(links[1]!.attributes('aria-current')).toBeUndefined()
  })

  it('maps a plain aria-label attribute to the nav name', () => {
    const wrapper = mount(BlSegmentedNav, { props: { items }, attrs: { 'aria-label': 'Language' } })
    expect(wrapper.element.tagName).toBe('NAV')
    expect(wrapper.attributes('aria-label')).toBe('Language')
  })

  it('passes a string current through', () => {
    const wrapper = mount(BlSegmentedNav, {
      props: { items: [{ label: 'one', href: '#', current: 'step' as const }] }
    })
    expect(wrapper.find('a').attributes('aria-current')).toBe('step')
  })

  it('warns for an item without to or href, even with linkAs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(BlSegmentedNav, { props: { items: [{ label: 'Nowhere' }], linkAs: 'a' } })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('BlSegmentedNav'))).toBe(true)
  })
})
