import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, ref, type Component } from 'vue'
import BlField from '../../vue/components/BlField.vue'
import BlInput from '../../vue/components/BlInput.vue'
import BlSelect from '../../vue/components/BlSelect.vue'
import BlRange from '../../vue/components/BlRange.vue'
import { FIELD_CONTEXT } from '../../vue/types'

const controls: Array<[string, Component, Record<string, unknown>, string]> = [
  ['BlInput', BlInput, {}, 'input'],
  ['BlSelect', BlSelect, { options: [{ value: 'a', label: 'A' }] }, 'select'],
  ['BlRange', BlRange, {}, 'input']
]

function mountField(
  control: Component,
  controlProps: Record<string, unknown>,
  fieldProps: Record<string, unknown>,
  controlAttrs: Record<string, unknown> = {}
) {
  return mount(BlField, {
    props: { label: 'Label', id: 'x', ...fieldProps },
    slots: { default: () => h(control, { ...controlProps, ...controlAttrs }) }
  })
}

describe.each(controls)('%s inside an invalid BlField', (_name, control, props, tag) => {
  it('marks the control invalid and describes it by hint then error', () => {
    const w = mountField(control, props, { hint: 'Hint', error: 'Required' })
    const el = w.get(tag)
    expect(el.attributes('aria-invalid')).toBe('true')
    expect(el.attributes('aria-describedby')).toBe('x-hint x-error')
    expect(w.classes()).toContain('bl-field--invalid')
    const error = w.get('p.bl-field__error')
    expect(error.text()).toBe('Required')
    expect(error.attributes('id')).toBe('x-error')
  })

  it('keeps a consumer aria-describedby after the hint and error ids', () => {
    const w = mountField(
      control,
      props,
      { hint: 'Hint', error: 'Required' },
      { 'aria-describedby': 'mine' }
    )
    expect(w.get(tag).attributes('aria-describedby')).toBe('x-hint x-error mine')
  })

  it('describes by the error alone when there is no hint', () => {
    const w = mountField(control, props, { error: 'Required' })
    expect(w.get(tag).attributes('aria-describedby')).toBe('x-error')
  })

  it('adds nothing without an error', () => {
    const w = mountField(control, props, { hint: 'Hint' })
    expect(w.get(tag).attributes('aria-invalid')).toBeUndefined()
    expect(w.get(tag).attributes('aria-describedby')).toBe('x-hint')
    expect(w.classes()).not.toContain('bl-field--invalid')
    expect(w.find('.bl-field__error').exists()).toBe(false)
  })

  it('treats an empty error as valid', () => {
    const w = mountField(control, props, { error: '' })
    expect(w.find('.bl-field__error').exists()).toBe(false)
    expect(w.get(tag).attributes('aria-invalid')).toBeUndefined()
    expect(w.classes()).not.toContain('bl-field--invalid')
  })

  it('lets a consumer aria-invalid win', () => {
    const w = mountField(control, props, { error: 'Required' }, { 'aria-invalid': 'false' })
    expect(w.get(tag).attributes('aria-invalid')).toBe('false')
  })
})

describe('BlField slot props', () => {
  it('passes id, describedBy and invalid to the default slot', () => {
    let seen: Record<string, unknown> = {}
    mount(BlField, {
      props: { label: 'L', id: 'x', hint: 'H', error: 'E' },
      slots: {
        default: (p: Record<string, unknown>) => {
          seen = p
          return h('span')
        }
      }
    })
    expect(seen).toMatchObject({ id: 'x', describedBy: 'x-hint x-error', invalid: true })
  })
})

describe('a field context written before `invalid` existed', () => {
  it('does not throw and adds no aria-invalid', () => {
    const w = mount(BlInput, {
      global: {
        provide: { [FIELD_CONTEXT as symbol]: { id: ref('x'), describedBy: ref(undefined) } }
      }
    })
    expect(w.get('input').attributes('aria-invalid')).toBeUndefined()
  })
})
