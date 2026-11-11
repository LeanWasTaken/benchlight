import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import BlCheckbox from '../../vue/components/BlCheckbox.vue'
import BlField from '../../vue/components/BlField.vue'
import BlRadioGroup from '../../vue/components/BlRadioGroup.vue'
import BlToggle from '../../vue/components/BlToggle.vue'

const cases = [
  ['BlField', BlField, { label: 'Name' }, '.bl-field__error'],
  ['BlCheckbox', BlCheckbox, { label: 'Agree' }, '.bl-checkbox__error'],
  ['BlToggle', BlToggle, { label: 'Notify' }, '.bl-toggle__error'],
  ['BlRadioGroup', BlRadioGroup, { legend: 'Pick' }, '.bl-fieldset__error']
] as const

describe.each(cases)('%s announce', (_name, Comp, base, sel) => {
  it('has no role by default', () => {
    const w = mount(Comp, { props: { ...base, error: 'Required' } })
    expect(w.get(sel).attributes('role')).toBeUndefined()
  })

  it('renders role=alert when announce is set and keeps the element on text change', async () => {
    const w = mount(Comp, { props: { ...base, error: 'Required', announce: true } })
    const el = w.get(sel)
    expect(el.attributes('role')).toBe('alert')
    await w.setProps({ error: 'Too short' })
    await nextTick()
    expect(w.get(sel).element).toBe(el.element)
    expect(el.text()).toBe('Too short')
  })
})
