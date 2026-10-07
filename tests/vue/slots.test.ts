import { describe, expect, it } from 'vitest'
import { Comment, Fragment, Text, createVNode, h } from 'vue'
import { hasContent } from '../../vue/internal/slots'

describe('hasContent', () => {
  it('is false for nothing, comments and whitespace', () => {
    expect(hasContent(undefined)).toBe(false)
    expect(hasContent([])).toBe(false)
    expect(hasContent([createVNode(Comment, null, 'v-if')])).toBe(false)
    expect(hasContent([createVNode(Text, null, '  \n ')])).toBe(false)
    expect(hasContent([createVNode(Fragment, null, [createVNode(Comment, null, '')])])).toBe(false)
  })
  it('is true for text and elements, also inside fragments', () => {
    expect(hasContent([createVNode(Text, null, 'Hi')])).toBe(true)
    expect(hasContent([h('img')])).toBe(true)
    expect(hasContent([createVNode(Fragment, null, [h('span')])])).toBe(true)
  })
})
