import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import BlCheckbox from '../../vue/components/BlCheckbox.vue'

describe('BlCheckbox', () => {
  it('renders a checkbox with v-model', async () => {
    const w = mount(BlCheckbox, { props: { modelValue: false, label: 'Subscribe' } })
    const input = w.get('input')
    expect(input.attributes('type')).toBe('checkbox')
    expect((input.element as HTMLInputElement).checked).toBe(false)
    await input.setValue(true)
    expect(w.emitted('update:modelValue')).toEqual([[true]])
  })

  it('keeps the hint out of the label and describes the input with it', () => {
    const w = mount(BlCheckbox, {
      props: { modelValue: false, label: 'Subscribe', hint: 'Weekly' }
    })
    const label = w.get('label.bl-checkbox__control')
    expect(label.text()).toBe('Subscribe')
    const hint = w.get('.bl-checkbox__hint')
    expect(w.get('input').attributes('aria-describedby')).toBe(hint.attributes('id'))
    expect(label.element.contains(hint.element)).toBe(false)
  })

  it('marks the input invalid and orders aria-describedby hint, error, consumer', () => {
    const w = mount(BlCheckbox, {
      props: { modelValue: false, label: 'Terms', hint: 'Required', error: 'Accept to continue' },
      attrs: { 'aria-describedby': 'x' }
    })
    const input = w.get('input')
    const error = w.get('.bl-checkbox__error')
    expect(error.text()).toBe('Accept to continue')
    expect(w.get('label').element.contains(error.element)).toBe(false)
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(
      `${w.get('.bl-checkbox__hint').attributes('id')} ${error.attributes('id')} x`
    )
  })

  it("lets a consumer's aria-invalid win and treats an empty error as valid", () => {
    const wins = mount(BlCheckbox, {
      props: { modelValue: false, label: 'Terms', error: 'Bad' },
      attrs: { 'aria-invalid': 'false' }
    })
    expect(wins.get('input').attributes('aria-invalid')).toBe('false')
    const empty = mount(BlCheckbox, { props: { modelValue: false, label: 'Terms', error: '' } })
    expect(empty.find('.bl-checkbox__error').exists()).toBe(false)
    expect(empty.get('input').attributes('aria-invalid')).toBeUndefined()
    expect(empty.get('input').attributes('aria-describedby')).toBeUndefined()
  })

  it('puts class and style on the root and other attrs on the input', () => {
    const w = mount(BlCheckbox, {
      props: { modelValue: false, label: 'Terms' },
      attrs: { class: 'extra', style: 'color: red', id: 'terms', 'data-x': '1' }
    })
    expect(w.classes()).toEqual(['bl-checkbox', 'extra'])
    expect(w.attributes('style')).toContain('color: red')
    expect(w.get('input').attributes('id')).toBe('terms')
    expect(w.get('input').attributes('data-x')).toBe('1')
    expect(w.attributes('id')).toBeUndefined()
  })

  it('disables the input, and a disabled invalid checkbox still carries aria-invalid', () => {
    const w = mount(BlCheckbox, {
      props: { modelValue: false, label: 'Terms', disabled: true, error: 'Bad' }
    })
    const input = w.get('input')
    expect(input.attributes('disabled')).toBeDefined()
    // Styling ignores it through :not(:disabled); the attribute itself is still exposed.
    expect(input.attributes('aria-invalid')).toBe('true')
  })

  it('posts name=value only when checked', async () => {
    const Host = defineComponent({
      setup() {
        const on = ref(false)
        return () =>
          h('form', [
            h(BlCheckbox, {
              modelValue: on.value,
              'onUpdate:modelValue': (v: boolean) => (on.value = v),
              label: 'Subscribe',
              name: 'news',
              value: 'yes'
            })
          ])
      }
    })
    const w = mount(Host, { attachTo: document.body })
    const form = w.get('form').element as HTMLFormElement
    expect(new FormData(form).get('news')).toBeNull()
    await w.get('input').setValue(true)
    expect(new FormData(form).get('news')).toBe('yes')
    w.unmount()
  })

  it('restores the mount value on form reset and the model follows', async () => {
    const on = ref(true)
    const Host = defineComponent({
      setup: () => () =>
        h('form', [
          h(BlCheckbox, {
            modelValue: on.value,
            'onUpdate:modelValue': (v: boolean) => (on.value = v),
            label: 'Subscribe'
          })
        ])
    })
    const w = mount(Host, { attachTo: document.body })
    on.value = false
    await w.vm.$nextTick()
    const input = w.get('input').element as HTMLInputElement
    expect(input.checked).toBe(false)
    ;(w.get('form').element as HTMLFormElement).reset()
    await new Promise((r) => setTimeout(r, 0))
    expect(on.value).toBe(true)
    w.unmount()
  })

  it('works uncontrolled', async () => {
    const w = mount(BlCheckbox, { props: { label: 'Subscribe' } })
    const input = w.get('input').element as HTMLInputElement
    await w.get('input').setValue(true)
    expect(input.checked).toBe(true)
    expect(w.emitted('update:modelValue')).toEqual([[true]])
  })

  describe('indeterminate', () => {
    it('sets the DOM property on mount', () => {
      const w = mount(BlCheckbox, {
        props: { modelValue: false, indeterminate: true, label: 'All' }
      })
      expect((w.get('input').element as HTMLInputElement).indeterminate).toBe(true)
    })

    it('a click clears it natively, emits false, and setting true restores it', async () => {
      const w = mount(BlCheckbox, {
        props: { modelValue: false, indeterminate: true, label: 'All' }
      })
      const el = w.get('input').element as HTMLInputElement
      await w.get('input').setValue(true)
      expect(el.indeterminate).toBe(false)
      expect(w.emitted('update:indeterminate')).toEqual([[false]])
      // The prop is still true (the parent ignored the update), so re-setting it must re-apply.
      await w.setProps({ indeterminate: false })
      await w.setProps({ indeterminate: true })
      expect(el.indeterminate).toBe(true)
    })

    it('re-applies when the parent sets true again after a click it did not follow', async () => {
      const w = mount(BlCheckbox, {
        props: {
          modelValue: false,
          indeterminate: true,
          label: 'All',
          'onUpdate:indeterminate': (v: boolean) => w.setProps({ indeterminate: v })
        }
      })
      const el = w.get('input').element as HTMLInputElement
      await w.get('input').setValue(true)
      await w.vm.$nextTick()
      expect(el.indeterminate).toBe(false)
      await w.setProps({ indeterminate: true })
      expect(el.indeterminate).toBe(true)
    })

    it('does not emit update:indeterminate when it was not indeterminate', async () => {
      const w = mount(BlCheckbox, { props: { modelValue: false, label: 'All' } })
      await w.get('input').setValue(true)
      expect(w.emitted('update:indeterminate')).toBeUndefined()
    })

    it('renders no indeterminate attribute on the server', async () => {
      const html = await renderToString(
        createSSRApp({
          render: () => h(BlCheckbox, { modelValue: false, indeterminate: true, label: 'All' })
        })
      )
      expect(html).toContain('type="checkbox"')
      expect(html).not.toContain('indeterminate')
    })
  })
})
