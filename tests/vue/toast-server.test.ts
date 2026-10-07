// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { useToast } from '../../vue/composables/useToast'
import { toastState } from '../../vue/internal/toastStore'

describe('useToast on the server', () => {
  it('does nothing and returns an empty id', () => {
    expect(useToast().toast('Hi')).toBe('')
    expect(toastState.items).toHaveLength(0)
  })
})
