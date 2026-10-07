import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import BlMedia from '../../vue/components/BlMedia.vue'

describe('BlMedia', () => {
  it('renders figure, body and aside', () => {
    const w = mount(BlMedia, {
      slots: { figure: () => h('img', { alt: '' }), default: () => 'Body', aside: () => '3m' }
    })
    expect(w.classes()).toEqual(['bl-media'])
    expect(w.find('.bl-media__figure img').exists()).toBe(true)
    expect(w.get('.bl-media__body').text()).toBe('Body')
    expect(w.get('.bl-media__aside').text()).toBe('3m')
  })

  it('omits empty figure and aside wrappers, including v-if placeholders', () => {
    const w = mount(BlMedia, {
      slots: { default: () => 'Body', figure: () => [], aside: () => '   ' }
    })
    expect(w.find('.bl-media__figure').exists()).toBe(false)
    expect(w.find('.bl-media__aside').exists()).toBe(false)
  })

  it('omits a figure whose content is v-if-ed away', () => {
    const w = mount({
      components: { BlMedia },
      template: '<BlMedia><template #figure><img v-if="false" alt="" /></template>Body</BlMedia>'
    })
    expect(w.find('.bl-media__figure').exists()).toBe(false)
  })

  it('renders as li or article and aligns to centre', () => {
    expect(mount(BlMedia, { props: { as: 'li' } }).element.tagName).toBe('LI')
    const w = mount(BlMedia, { props: { as: 'article', align: 'center' } })
    expect(w.element.tagName).toBe('ARTICLE')
    expect(w.classes()).toContain('bl-media--center')
  })
})
