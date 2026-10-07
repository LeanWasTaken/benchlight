import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import BlDisclosure from '../../vue/components/BlDisclosure.vue'

afterEach(() => vi.restoreAllMocks())

describe('BlDisclosure', () => {
  it('renders details/summary with the summary text and a hidden chevron', () => {
    const w = mount(BlDisclosure, { props: { summary: 'Advanced' }, slots: { default: 'Body' } })
    expect(w.element.tagName).toBe('DETAILS')
    expect(w.get('summary .bl-disclosure__title').text()).toBe('Advanced')
    expect(w.get('.bl-disclosure__chevron').attributes('aria-hidden')).toBe('true')
    expect(w.get('.bl-disclosure__body').text()).toBe('Body')
  })

  it('passes name through for exclusive groups', () => {
    const w = mount(BlDisclosure, { props: { summary: 'A', name: 'faq' } })
    expect(w.attributes('name')).toBe('faq')
  })

  it('emits update:open from the native toggle, reading el.open', async () => {
    const w = mount(BlDisclosure, { props: { summary: 'A' }, attachTo: document.body })
    const el = w.element as HTMLDetailsElement
    el.open = true
    el.dispatchEvent(new Event('toggle'))
    expect(w.emitted('update:open')?.at(-1)).toEqual([true])
    w.unmount()
  })

  it('does not echo a prop-driven change', async () => {
    const w = mount(BlDisclosure, { props: { summary: 'A', open: false }, attachTo: document.body })
    await w.setProps({ open: true })
    await nextTick()
    w.element.dispatchEvent(new Event('toggle'))
    expect(w.emitted('update:open')).toBeUndefined()
    w.unmount()
  })

  it('emits false when the browser closes it as a group sibling', () => {
    const w = mount(BlDisclosure, { props: { summary: 'A', open: true, name: 'g' } })
    const el = w.element as HTMLDetailsElement
    el.open = false // what the browser does to the sibling
    el.dispatchEvent(new Event('toggle'))
    expect(w.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('warns without a summary prop or slot', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(BlDisclosure)
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('BlDisclosure'))
  })

  it('accepts a summary slot', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(BlDisclosure, { slots: { summary: '<em>Rich</em>' } })
    expect(w.get('.bl-disclosure__title em').text()).toBe('Rich')
    expect(spy).not.toHaveBeenCalled()
  })
})
