import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useModal } from '../../vue/internal/useModal'
import type { DialogCloseEvent } from '../../vue/types'

let wrappers: VueWrapper[] = []
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
})

const Host = defineComponent({
  emits: ['close'],
  setup(_, { emit }) {
    const el = ref<HTMLDialogElement>()
    const toasts = ref<HTMLElement>()
    const open = ref(false)
    const m = useModal({
      el,
      toasts,
      open,
      dismissible: () => true,
      emitClose: (payload: DialogCloseEvent) => emit('close', payload)
    })
    return { el, toasts, open, m }
  },
  render() {
    return h('dialog', { ref: 'el', onClose: this.m.onClose, onCancel: this.m.onCancel }, [
      h('button', 'Inside'),
      h('div', { ref: 'toasts' })
    ])
  }
})

function host() {
  const w = mount(Host, { attachTo: document.body })
  wrappers.push(w)
  return w
}

describe('useModal', () => {
  it('reports program when open turns false and restores focus to the opener', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const w = host()
    w.vm.open = true
    await w.vm.$nextTick()
    const d = w.element as HTMLDialogElement
    expect(d.open).toBe(true)
    expect(w.vm.m.isOpen()).toBe(true)
    w.get<HTMLElement>('button').element.focus()
    w.vm.open = false
    await w.vm.$nextTick()
    expect(d.open).toBe(false)
    expect(w.emitted('close')).toEqual([[{ reason: 'program', returnValue: '' }]])
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })

  it('releases the page lock on unmount while open', async () => {
    const w = host()
    w.vm.open = true
    await w.vm.$nextTick()
    expect(document.documentElement.style.getPropertyValue('--bl-dialog-gutter')).toMatch(/px$/)
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(document.documentElement.style.getPropertyValue('--bl-dialog-gutter')).toBe('')
    expect(w.emitted('close')).toBeUndefined()
  })
})
