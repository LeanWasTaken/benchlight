import { mount } from '@vue/test-utils'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import BlField from '../../vue/components/BlField.vue'
import BlTextarea from '../../vue/components/BlTextarea.vue'

describe('BlTextarea', () => {
  it('round-trips v-model', async () => {
    const w = mount(BlTextarea, {
      props: {
        modelValue: 'a',
        'onUpdate:modelValue': (v: string) => w.setProps({ modelValue: v })
      }
    })
    const el = w.get('textarea')
    expect((el.element as HTMLTextAreaElement).value).toBe('a')
    await el.setValue('hello')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['hello'])
    expect((el.element as HTMLTextAreaElement).value).toBe('hello')
  })

  it('defaults rows to 4 and honours the prop', () => {
    expect(mount(BlTextarea).get('textarea').attributes('rows')).toBe('4')
    expect(
      mount(BlTextarea, { props: { rows: 8 } })
        .get('textarea')
        .attributes('rows')
    ).toBe('8')
  })

  it('puts class, style, aria-label and disabled on the textarea', () => {
    const w = mount(BlTextarea, {
      attrs: { class: 'extra', style: 'width: 50%', 'aria-label': 'Notes', disabled: '' }
    })
    expect(w.element.tagName).toBe('TEXTAREA')
    const el = w.get('textarea')
    expect(el.classes()).toEqual(expect.arrayContaining(['bl-textarea', 'extra']))
    expect(el.attributes('style')).toContain('width: 50%')
    expect(el.attributes('aria-label')).toBe('Notes')
    expect((el.element as HTMLTextAreaElement).disabled).toBe(true)
  })

  it('takes the field id and describes itself by hint then error', () => {
    const w = mount(BlField, {
      props: { label: 'Notes', id: 'n', hint: 'Hint', error: 'Required' },
      slots: { default: () => h(BlTextarea) }
    })
    const el = w.get('textarea')
    expect(el.attributes('id')).toBe('n')
    expect(el.attributes('aria-describedby')).toBe('n-hint n-error')
    expect(el.attributes('aria-invalid')).toBe('true')
  })

  it('is not invalid inside a healthy field', () => {
    const w = mount(BlField, {
      props: { label: 'Notes', id: 'n' },
      slots: { default: () => h(BlTextarea) }
    })
    expect(w.get('textarea').attributes('aria-invalid')).toBeUndefined()
  })

  it('renders on the server', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(BlTextarea) }))
    expect(html).toContain('<textarea')
  })
})
