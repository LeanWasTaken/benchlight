import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import BlToggle from '../../vue/components/BlToggle.vue'

describe('BlToggle', () => {
  it('renders a switch with v-model', async () => {
    const w = mount(BlToggle, { props: { modelValue: false, label: 'Wi-Fi' } })
    const input = w.get('input')
    expect(input.attributes('type')).toBe('checkbox')
    expect(input.attributes('role')).toBe('switch')
    expect((input.element as HTMLInputElement).checked).toBe(false)
    await input.setValue(true)
    expect(w.emitted('update:modelValue')).toEqual([[true]])
  })

  it('keeps the hint out of the accessible name and describes the input with it', () => {
    const w = mount(BlToggle, {
      props: { modelValue: false, label: 'Wi-Fi', hint: 'Joins known networks' }
    })
    const label = w.get('label.bl-toggle__control')
    expect(label.text()).toBe('Wi-Fi')
    const hint = w.get('.bl-toggle__hint')
    expect(w.get('input').attributes('aria-describedby')).toBe(hint.attributes('id'))
    expect(label.element.contains(hint.element)).toBe(false)
  })

  it('merges a consumer aria-describedby with the hint id', () => {
    const w = mount(BlToggle, {
      props: { modelValue: false, label: 'Wi-Fi', hint: 'Hint' },
      attrs: { 'aria-describedby': 'err' }
    })
    const hintId = w.get('.bl-toggle__hint').attributes('id')
    expect(w.get('input').attributes('aria-describedby')).toBe(`${hintId} err`)
  })

  it('omits aria-describedby without a hint', () => {
    const w = mount(BlToggle, { props: { modelValue: false, label: 'Wi-Fi' } })
    expect(w.get('input').attributes('aria-describedby')).toBeUndefined()
    expect(w.find('.bl-toggle__hint').exists()).toBe(false)
  })

  it('puts class and style on the root and other attrs on the input', () => {
    const w = mount(BlToggle, {
      props: { modelValue: false, label: 'Wi-Fi' },
      attrs: {
        class: 'extra',
        style: 'color: red',
        id: 'wifi',
        'data-x': '1',
        'aria-invalid': 'true'
      }
    })
    expect(w.classes()).toEqual(['bl-toggle', 'extra'])
    expect(w.attributes('style')).toContain('color: red')
    const input = w.get('input')
    expect(input.attributes('id')).toBe('wifi')
    expect(input.attributes('data-x')).toBe('1')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(w.attributes('id')).toBeUndefined()
  })

  it('posts name=value only when checked', async () => {
    const Host = defineComponent({
      setup() {
        const on = ref(false)
        return () =>
          h('form', [
            h(BlToggle, {
              modelValue: on.value,
              'onUpdate:modelValue': (v: boolean) => (on.value = v),
              label: 'Wi-Fi',
              name: 'wifi',
              value: 'on'
            })
          ])
      }
    })
    const w = mount(Host, { attachTo: document.body })
    const form = w.get('form').element as HTMLFormElement
    expect(new FormData(form).get('wifi')).toBeNull()
    await w.get('input').setValue(true)
    expect(new FormData(form).get('wifi')).toBe('on')
    w.unmount()
  })

  it('re-emits the native value after a form reset', async () => {
    const Host = defineComponent({
      setup() {
        return () => h('form', [h(BlToggle, { modelValue: true, label: 'Wi-Fi' })])
      }
    })
    const w = mount(Host, { attachTo: document.body })
    const input = w.get('input').element as HTMLInputElement
    input.checked = false // what the reset algorithm does after the event
    w.get('form').element.dispatchEvent(new Event('reset'))
    await new Promise((r) => setTimeout(r, 0))
    expect(w.findComponent(BlToggle).emitted('update:modelValue')?.at(-1)).toEqual([false])
    w.unmount()
  })

  it('sets defaultChecked from the initial value so a reset restores it', () => {
    const w = mount(BlToggle, { props: { modelValue: true, label: 'Wi-Fi' } })
    expect((w.get('input').element as HTMLInputElement).defaultChecked).toBe(true)
  })

  it('disables the input', () => {
    const w = mount(BlToggle, { props: { modelValue: false, label: 'Wi-Fi', disabled: true } })
    expect(w.get('input').attributes('disabled')).toBeDefined()
  })
})
