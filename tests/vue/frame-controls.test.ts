import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import BlAppearanceSwitch from '../../vue/components/BlAppearanceSwitch.vue'
import BlButton from '../../vue/components/BlButton.vue'
import BlColophon from '../../vue/components/BlColophon.vue'
import BlField from '../../vue/components/BlField.vue'
import BlInput from '../../vue/components/BlInput.vue'
import BlLinkArrow from '../../vue/components/BlLinkArrow.vue'
import BlNavLink from '../../vue/components/BlNavLink.vue'
import BlRange from '../../vue/components/BlRange.vue'
import BlSegmented from '../../vue/components/BlSegmented.vue'
import BlSelect from '../../vue/components/BlSelect.vue'
import BlSiteBar from '../../vue/components/BlSiteBar.vue'
import BlSkipLink from '../../vue/components/BlSkipLink.vue'
import BlTabBar from '../../vue/components/BlTabBar.vue'
import BlTabBarItem from '../../vue/components/BlTabBarItem.vue'
import { resetAppearanceState } from '../../vue/composables/useAppearance'
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
  resetAppearanceState()
  localStorage.clear()
  document.documentElement.removeAttribute('data-bl-appearance')
  mockMatchMedia()
  scrollTo(0)
})

describe('BlSiteBar', () => {
  it('renders the bar, a column and a nav list', () => {
    const wrapper = mount(BlSiteBar, {
      slots: {
        brand: '<a class="bl-site-bar__brand">B</a>',
        nav: '<li>n</li>',
        actions: '<span>a</span>'
      }
    })
    expect(wrapper.find('header.bl-site-bar > .bl-col.bl-site-bar__inner').exists()).toBe(true)
    expect(wrapper.find('ul.bl-site-bar__nav > li').exists()).toBe(true)
    expect(wrapper.find('.bl-site-bar__actions span').exists()).toBe(true)
  })

  it('wraps the nav list in a labelled landmark', () => {
    const slots = { nav: '<li>n</li>' }
    const wrapper = mount(BlSiteBar, { slots })
    expect(wrapper.find('nav[aria-label="Primary"] > ul.bl-site-bar__nav').exists()).toBe(true)
    const custom = mount(BlSiteBar, { props: { navLabel: 'Galvenā' }, slots })
    expect(custom.find('nav.bl-site-bar__navwrap').attributes('aria-label')).toBe('Galvenā')
  })

  it('lifts after scrolling past the threshold', async () => {
    const wrapper = mount(BlSiteBar)
    expect(wrapper.attributes('data-lifted')).toBeUndefined()
    scrollTo(30)
    await nextTick()
    expect(wrapper.attributes('data-lifted')).toBe('')
  })

  it('never lifts with lift=false', async () => {
    const wrapper = mount(BlSiteBar, { props: { lift: false } })
    scrollTo(500)
    await nextTick()
    expect(wrapper.attributes('data-lifted')).toBeUndefined()
  })
})

describe('BlNavLink', () => {
  it('renders an anchor in a list item with aria-current for the current page', () => {
    const wrapper = mount(BlNavLink, {
      props: { href: '/about', current: true },
      slots: { default: 'About' }
    })
    const link = wrapper.find('li > a.bl-site-bar__link')
    expect(link.attributes('href')).toBe('/about')
    expect(link.attributes('aria-current')).toBe('page')
  })

  it('hands to to a router component', () => {
    const wrapper = mount(BlNavLink, { props: { as: RouterLinkLike, to: '/projects' } })
    expect(wrapper.find('a[data-router]').attributes('href')).toBe('/projects')
  })
})

describe('BlTabBar', () => {
  it('labels the nav and marks the current tab', () => {
    const wrapper = mount(BlTabBar, {
      slots: {
        default: () =>
          h(
            BlTabBarItem,
            { href: '/', current: true },
            { icon: () => h('svg'), default: () => 'Home' }
          )
      }
    })
    expect(wrapper.find('nav.bl-tabbar').attributes('aria-label')).toBe('Primary')
    const item = wrapper.find('a.bl-tabbar__item')
    expect(item.attributes('aria-current')).toBe('page')
    expect(item.find('.bl-tabbar__icon').attributes('aria-hidden')).toBe('true')
    expect(item.find('.bl-tabbar__label').text()).toBe('Home')
  })
})

describe('BlColophon and BlSkipLink', () => {
  it('renders colophon items and actions', () => {
    const wrapper = mount(BlColophon, {
      props: { items: ['© 2026 Krists', 'Rev abc'] },
      slots: { actions: '<span class="act">EN</span>' }
    })
    expect(wrapper.find('.bl-colophon__items').element.tagName).toBe('DIV')
    expect(wrapper.findAll('.bl-colophon__items > span').map((s) => s.text())).toEqual([
      '© 2026 Krists',
      'Rev abc'
    ])
    expect(wrapper.find('.bl-colophon__inner .act').exists()).toBe(true)
  })

  it('skips to #main-content by default', () => {
    const wrapper = mount(BlSkipLink)
    expect(wrapper.attributes('href')).toBe('#main-content')
    expect(wrapper.text()).toBe('Skip to content')
  })
})

describe('BlAppearanceSwitch', () => {
  it('renders three labelled radios in one bl-appearance group', () => {
    const wrapper = mount(BlAppearanceSwitch)
    const radios = wrapper.findAll('input[type="radio"][name^="bl-appearance"]')
    expect(radios.map((r) => r.attributes('aria-label'))).toEqual(['Auto', 'Light', 'Dark'])
    expect(wrapper.findAll('.bl-switch__option').map((o) => o.text())).toEqual(['A', 'L', 'D'])
    expect(wrapper.find('legend.bl-sr-only').text()).toBe('Appearance')
  })

  it('applies a choice', async () => {
    const wrapper = mount(BlAppearanceSwitch)
    await wrapper.find('input[value="dark"]').setValue(true)
    await nextTick()
    expect(document.documentElement.getAttribute('data-bl-appearance')).toBe('dark')
  })

  it('keeps separate switches in sync', async () => {
    const first = mount(BlAppearanceSwitch)
    const second = mount(BlAppearanceSwitch)
    await first.find('input[value="dark"]').setValue(true)
    await nextTick()
    const checked = second
      .findAll('input')
      .find((input) => (input.element as HTMLInputElement).checked)
    expect(checked?.attributes('value')).toBe('dark')
  })

  it('gives each switch its own radio group and keeps them in sync', async () => {
    // One app, as in real use: useId() is unique per app, not across separate mounts.
    const Pair = defineComponent({
      render: () => h('div', [h(BlAppearanceSwitch), h(BlAppearanceSwitch)])
    })
    const wrapper = mount(Pair, { attachTo: document.body })
    const [first, second] = wrapper.findAllComponents(BlAppearanceSwitch)
    await first!.find('input[value="dark"]').setValue(true)
    await nextTick()
    const dark = (w: typeof first) => w!.find('input[value="dark"]').element as HTMLInputElement
    expect(dark(first).checked).toBe(true)
    expect(dark(second).checked).toBe(true)
    expect(first!.find('input').attributes('name')).not.toBe(
      second!.find('input').attributes('name')
    )
    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it('accepts translated labels', () => {
    const wrapper = mount(BlAppearanceSwitch, {
      props: { labels: { legend: 'Izskats', dark: 'Tumšs' } }
    })
    expect(wrapper.find('legend').text()).toBe('Izskats')
    expect(wrapper.find('input[value="dark"]').attributes('aria-label')).toBe('Tumšs')
  })

  it('renders auto checked on the server', async () => {
    const html = await renderToString(createSSRApp(BlAppearanceSwitch))
    expect(html).toMatch(/value="auto"[^>]*checked/)
  })
})

describe('BlSegmented', () => {
  const options = [
    { value: null, label: 'All' },
    { value: 'hardware', label: 'Hardware' }
  ]

  it('renders pressed buttons and emits the chosen value', async () => {
    const wrapper = mount(BlSegmented, { props: { options, modelValue: null, label: 'Category' } })
    const buttons = wrapper.findAll('button.bl-segmented__item')
    expect(buttons.map((b) => b.attributes('aria-pressed'))).toEqual(['true', 'false'])
    expect(wrapper.attributes('role')).toBe('group')
    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['hardware']])
  })

  it('renders links with aria-current in links mode', () => {
    const wrapper = mount(BlSegmented, {
      props: {
        as: 'a',
        compact: true,
        options: [
          { value: 'en', label: 'en', href: '/en', current: true },
          { value: 'lv', label: 'lv', href: '/lv' }
        ]
      }
    })
    expect(wrapper.classes()).toContain('bl-segmented--compact')
    const links = wrapper.findAll('a.bl-segmented__item')
    expect(links.map((l) => l.attributes('href'))).toEqual(['/en', '/lv'])
    expect(links[0]!.attributes('aria-current')).toBe('true')
    expect(links[1]!.attributes('aria-current')).toBeUndefined()
  })
})

describe('BlButton', () => {
  it('defaults to a primary type=button', () => {
    const wrapper = mount(BlButton, { slots: { default: 'Save' } })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.classes()).toEqual(['bl-btn'])
  })

  it('maps variant and pill to modifiers', () => {
    const wrapper = mount(BlButton, { props: { variant: 'secondary', pill: true } })
    expect(wrapper.classes()).toEqual(['bl-btn', 'bl-btn--secondary', 'bl-btn--pill'])
  })

  it('becomes a link when given href', () => {
    const wrapper = mount(BlButton, { props: { href: '/x', disabled: true } })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/x')
    expect(wrapper.attributes('type')).toBeUndefined()
    expect(wrapper.attributes('aria-disabled')).toBe('true')
  })

  it('disables a button natively and wraps the icon', () => {
    const wrapper = mount(BlButton, { props: { disabled: true }, slots: { icon: '<svg />' } })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.bl-btn__icon').attributes('aria-hidden')).toBe('true')
  })
})

describe('BlLinkArrow', () => {
  it('puts a right arrow after the text by default', () => {
    const wrapper = mount(BlLinkArrow, { props: { href: '/p' }, slots: { default: 'All' } })
    expect(wrapper.text()).toBe('All→')
  })

  it('puts a left arrow first and supports quiet', () => {
    const wrapper = mount(BlLinkArrow, {
      props: { href: '/p', direction: 'left', quiet: true },
      slots: { default: 'Back' }
    })
    expect(wrapper.text()).toBe('←Back')
    expect(wrapper.classes()).toContain('bl-link-arrow--quiet')
  })
})

describe('form controls', () => {
  it('BlField ties its label to the slotted control', () => {
    const wrapper = mount(BlField, {
      props: { label: 'SSID', hint: 'Network name' },
      slots: { default: (props: { id: string }) => h(BlInput, { id: props.id }) }
    })
    const id = wrapper.find('input').attributes('id')
    expect(id).toBeTruthy()
    expect(wrapper.find('label.bl-field__label').attributes('for')).toBe(id)
    expect(wrapper.find('.bl-field__hint').text()).toBe('Network name')
  })

  it('BlInput updates its model', async () => {
    const wrapper = mount(BlInput, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('home')
    expect(wrapper.emitted('update:modelValue')).toEqual([['home']])
  })

  it('BlSelect renders options and updates its model', async () => {
    const wrapper = mount(BlSelect, {
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

  it('BlRange shows the formatted value and exposes it to screen readers', () => {
    const wrapper = mount(BlRange, {
      props: { modelValue: -12, min: -60, max: 0, format: (v: number) => `${v} dB` }
    })
    expect(wrapper.find('.bl-range__value').text()).toBe('-12 dB')
    expect(wrapper.find('input').attributes('aria-valuetext')).toBe('-12 dB')
    expect(wrapper.find('input').attributes('min')).toBe('-60')
  })
})
