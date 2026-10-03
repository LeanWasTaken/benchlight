import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import KdAppearanceSwitch from '../../vue/components/KdAppearanceSwitch.vue'
import KdButton from '../../vue/components/KdButton.vue'
import KdColophon from '../../vue/components/KdColophon.vue'
import KdField from '../../vue/components/KdField.vue'
import KdInput from '../../vue/components/KdInput.vue'
import KdLinkArrow from '../../vue/components/KdLinkArrow.vue'
import KdNavLink from '../../vue/components/KdNavLink.vue'
import KdRange from '../../vue/components/KdRange.vue'
import KdSegmented from '../../vue/components/KdSegmented.vue'
import KdSelect from '../../vue/components/KdSelect.vue'
import KdSiteBar from '../../vue/components/KdSiteBar.vue'
import KdSkipLink from '../../vue/components/KdSkipLink.vue'
import KdTabBar from '../../vue/components/KdTabBar.vue'
import KdTabBarItem from '../../vue/components/KdTabBarItem.vue'
import { mockMatchMedia } from '../helpers/vue'

const RouterLinkLike = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  setup(props, { slots }) {
    return () => h('a', { href: String(props.to), 'data-router': '' }, slots.default?.())
  }
})

const scrollTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-kd-appearance')
  mockMatchMedia()
  scrollTo(0)
})

describe('KdSiteBar', () => {
  it('renders the bar, a column and a nav list', () => {
    const wrapper = mount(KdSiteBar, {
      slots: {
        brand: '<a class="kd-site-bar__brand">B</a>',
        nav: '<li>n</li>',
        actions: '<span>a</span>'
      }
    })
    expect(wrapper.find('header.kd-site-bar > .kd-col.kd-site-bar__inner').exists()).toBe(true)
    expect(wrapper.find('ul.kd-site-bar__nav > li').exists()).toBe(true)
    expect(wrapper.find('.kd-site-bar__actions span').exists()).toBe(true)
  })

  it('lifts after scrolling past the threshold', async () => {
    const wrapper = mount(KdSiteBar)
    expect(wrapper.attributes('data-lifted')).toBeUndefined()
    scrollTo(30)
    await nextTick()
    expect(wrapper.attributes('data-lifted')).toBe('')
  })

  it('never lifts with lift=false', async () => {
    const wrapper = mount(KdSiteBar, { props: { lift: false } })
    scrollTo(500)
    await nextTick()
    expect(wrapper.attributes('data-lifted')).toBeUndefined()
  })
})

describe('KdNavLink', () => {
  it('renders an anchor in a list item with aria-current for the current page', () => {
    const wrapper = mount(KdNavLink, {
      props: { href: '/about', current: true },
      slots: { default: 'About' }
    })
    const link = wrapper.find('li > a.kd-site-bar__link')
    expect(link.attributes('href')).toBe('/about')
    expect(link.attributes('aria-current')).toBe('page')
  })

  it('hands to to a router component', () => {
    const wrapper = mount(KdNavLink, { props: { as: RouterLinkLike, to: '/projects' } })
    expect(wrapper.find('a[data-router]').attributes('href')).toBe('/projects')
  })
})

describe('KdTabBar', () => {
  it('labels the nav and marks the current tab', () => {
    const wrapper = mount(KdTabBar, {
      slots: {
        default: () =>
          h(
            KdTabBarItem,
            { href: '/', current: true },
            { icon: () => h('svg'), default: () => 'Home' }
          )
      }
    })
    expect(wrapper.find('nav.kd-tabbar').attributes('aria-label')).toBe('Primary')
    const item = wrapper.find('a.kd-tabbar__item')
    expect(item.attributes('aria-current')).toBe('page')
    expect(item.find('.kd-tabbar__icon').attributes('aria-hidden')).toBe('true')
    expect(item.find('.kd-tabbar__label').text()).toBe('Home')
  })
})

describe('KdColophon and KdSkipLink', () => {
  it('renders colophon items and actions', () => {
    const wrapper = mount(KdColophon, {
      props: { items: ['© 2026 Krists', 'Rev abc'] },
      slots: { actions: '<span class="act">EN</span>' }
    })
    expect(wrapper.findAll('.kd-colophon__items > span').map((s) => s.text())).toEqual([
      '© 2026 Krists',
      'Rev abc'
    ])
    expect(wrapper.find('.kd-colophon__inner .act').exists()).toBe(true)
  })

  it('skips to #main-content by default', () => {
    const wrapper = mount(KdSkipLink)
    expect(wrapper.attributes('href')).toBe('#main-content')
    expect(wrapper.text()).toBe('Skip to content')
  })
})

describe('KdAppearanceSwitch', () => {
  it('renders three labelled radios in the kd-appearance group', () => {
    const wrapper = mount(KdAppearanceSwitch)
    const radios = wrapper.findAll('input[type="radio"][name="kd-appearance"]')
    expect(radios.map((r) => r.attributes('aria-label'))).toEqual(['Auto', 'Light', 'Dark'])
    expect(wrapper.findAll('.kd-switch__option').map((o) => o.text())).toEqual(['A', 'L', 'D'])
    expect(wrapper.find('legend.kd-sr-only').text()).toBe('Appearance')
  })

  it('applies a choice', async () => {
    const wrapper = mount(KdAppearanceSwitch)
    await wrapper.find('input[value="dark"]').setValue(true)
    await nextTick()
    expect(document.documentElement.getAttribute('data-kd-appearance')).toBe('dark')
  })

  it('accepts translated labels', () => {
    const wrapper = mount(KdAppearanceSwitch, {
      props: { labels: { legend: 'Izskats', dark: 'Tumšs' } }
    })
    expect(wrapper.find('legend').text()).toBe('Izskats')
    expect(wrapper.find('input[value="dark"]').attributes('aria-label')).toBe('Tumšs')
  })

  it('renders auto checked on the server', async () => {
    const html = await renderToString(createSSRApp(KdAppearanceSwitch))
    expect(html).toMatch(/value="auto"[^>]*checked/)
  })
})

describe('KdSegmented', () => {
  const options = [
    { value: null, label: 'All' },
    { value: 'hardware', label: 'Hardware' }
  ]

  it('renders pressed buttons and emits the chosen value', async () => {
    const wrapper = mount(KdSegmented, { props: { options, modelValue: null, label: 'Category' } })
    const buttons = wrapper.findAll('button.kd-segmented__item')
    expect(buttons.map((b) => b.attributes('aria-pressed'))).toEqual(['true', 'false'])
    expect(wrapper.attributes('role')).toBe('group')
    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['hardware']])
  })

  it('renders links with aria-current in links mode', () => {
    const wrapper = mount(KdSegmented, {
      props: {
        as: 'a',
        compact: true,
        options: [
          { value: 'en', label: 'en', href: '/en', current: true },
          { value: 'lv', label: 'lv', href: '/lv' }
        ]
      }
    })
    expect(wrapper.classes()).toContain('kd-segmented--compact')
    const links = wrapper.findAll('a.kd-segmented__item')
    expect(links.map((l) => l.attributes('href'))).toEqual(['/en', '/lv'])
    expect(links[0]!.attributes('aria-current')).toBe('true')
    expect(links[1]!.attributes('aria-current')).toBeUndefined()
  })
})

describe('KdButton', () => {
  it('defaults to a primary type=button', () => {
    const wrapper = mount(KdButton, { slots: { default: 'Save' } })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.classes()).toEqual(['kd-btn'])
  })

  it('maps variant and pill to modifiers', () => {
    const wrapper = mount(KdButton, { props: { variant: 'secondary', pill: true } })
    expect(wrapper.classes()).toEqual(['kd-btn', 'kd-btn--secondary', 'kd-btn--pill'])
  })

  it('becomes a link when given href', () => {
    const wrapper = mount(KdButton, { props: { href: '/x', disabled: true } })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/x')
    expect(wrapper.attributes('type')).toBeUndefined()
    expect(wrapper.attributes('aria-disabled')).toBe('true')
  })

  it('disables a button natively and wraps the icon', () => {
    const wrapper = mount(KdButton, { props: { disabled: true }, slots: { icon: '<svg />' } })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.kd-btn__icon').attributes('aria-hidden')).toBe('true')
  })
})

describe('KdLinkArrow', () => {
  it('puts a right arrow after the text by default', () => {
    const wrapper = mount(KdLinkArrow, { props: { href: '/p' }, slots: { default: 'All' } })
    expect(wrapper.text()).toBe('All→')
  })

  it('puts a left arrow first and supports quiet', () => {
    const wrapper = mount(KdLinkArrow, {
      props: { href: '/p', direction: 'left', quiet: true },
      slots: { default: 'Back' }
    })
    expect(wrapper.text()).toBe('←Back')
    expect(wrapper.classes()).toContain('kd-link-arrow--quiet')
  })
})

describe('form controls', () => {
  it('KdField ties its label to the slotted control', () => {
    const wrapper = mount(KdField, {
      props: { label: 'SSID', hint: 'Network name' },
      slots: { default: (props: { id: string }) => h(KdInput, { id: props.id }) }
    })
    const id = wrapper.find('input').attributes('id')
    expect(id).toBeTruthy()
    expect(wrapper.find('label.kd-field__label').attributes('for')).toBe(id)
    expect(wrapper.find('.kd-field__hint').text()).toBe('Network name')
  })

  it('KdInput updates its model', async () => {
    const wrapper = mount(KdInput, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('home')
    expect(wrapper.emitted('update:modelValue')).toEqual([['home']])
  })

  it('KdSelect renders options and updates its model', async () => {
    const wrapper = mount(KdSelect, {
      props: {
        modelValue: 'a',
        options: [
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' }
        ]
      }
    })
    expect(wrapper.findAll('option').map((o) => o.text())).toEqual(['Alpha', 'Beta'])
    await wrapper.find('select').setValue('b')
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
  })

  it('KdRange shows the formatted value and exposes it to screen readers', () => {
    const wrapper = mount(KdRange, {
      props: { modelValue: -12, min: -60, max: 0, format: (v: number) => `${v} dB` }
    })
    expect(wrapper.find('.kd-range__value').text()).toBe('-12 dB')
    expect(wrapper.find('input').attributes('aria-valuetext')).toBe('-12 dB')
    expect(wrapper.find('input').attributes('min')).toBe('-60')
  })
})
