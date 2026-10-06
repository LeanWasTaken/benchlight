import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, markRaw, nextTick, ref } from 'vue'
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

  it('lifts when lift changes after mount', async () => {
    scrollTo(100)
    const wrapper = mount(BlSiteBar, { props: { lift: false } })
    expect(wrapper.attributes('data-lifted')).toBeUndefined()
    await wrapper.setProps({ lift: 10 })
    expect(wrapper.attributes('data-lifted')).toBe('')
    await wrapper.setProps({ lift: false })
    expect(wrapper.attributes('data-lifted')).toBeUndefined()
    wrapper.unmount()
  })

  it('wraps the nav list in a labelled landmark', () => {
    const slots = { nav: '<li>n</li>' }
    const wrapper = mount(BlSiteBar, { slots })
    expect(wrapper.find('nav[aria-label="Primary"] > ul.bl-site-bar__nav').exists()).toBe(true)
    const custom = mount(BlSiteBar, { props: { navLabel: 'Galvenā' }, slots })
    expect(custom.find('nav.bl-site-bar__navwrap').attributes('aria-label')).toBe('Galvenā')
  })

  it('scrolls only the nav scroller to reveal a focused link, never the window', async () => {
    const original = Element.prototype.scrollIntoView
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const windowScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    try {
      const wrapper = mount(BlSiteBar, {
        slots: { nav: '<li><a class="bl-site-bar__link" href="#a">A</a></li>' },
        attachTo: document.body
      })
      const nav = wrapper.find('nav').element
      const link = wrapper.find('a').element
      nav.getBoundingClientRect = () => ({ left: 100, right: 200 }) as DOMRect
      Object.defineProperty(nav, 'scrollWidth', { value: 400, configurable: true })
      Object.defineProperty(nav, 'clientWidth', { value: 100, configurable: true })
      link.getBoundingClientRect = () => ({ left: 170, right: 260 }) as DOMRect
      const navScroll = vi.fn()
      nav.scrollTo = navScroll as unknown as typeof nav.scrollTo
      await wrapper.find('a').trigger('focusin')
      // link overshoots the clear region (right edge 184) by 76 but only 54 fits; left stays visible
      expect(navScroll).toHaveBeenCalledWith({ left: 54, behavior: 'auto' })
      expect(scrollIntoView).not.toHaveBeenCalled()
      expect(windowScroll).not.toHaveBeenCalled()
      wrapper.unmount()
    } finally {
      Element.prototype.scrollIntoView = original
    }
  })

  it('leaves a nav that fits alone when a link is focused', async () => {
    const wrapper = mount(BlSiteBar, {
      slots: { nav: '<li><a class="bl-site-bar__link" href="#a">A</a></li>' },
      attachTo: document.body
    })
    const nav = wrapper.find('nav').element
    Object.defineProperty(nav, 'scrollWidth', { value: 300, configurable: true })
    Object.defineProperty(nav, 'clientWidth', { value: 300, configurable: true })
    nav.getBoundingClientRect = () => ({ left: 100, right: 200 }) as DOMRect
    wrapper.find('a').element.getBoundingClientRect = () => ({ left: 170, right: 260 }) as DOMRect
    const navScroll = vi.fn()
    nav.scrollTo = navScroll as unknown as typeof nav.scrollTo
    await wrapper.find('a').trigger('focusin')
    expect(navScroll).not.toHaveBeenCalled()
    wrapper.unmount()
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

  it('renders a labelled nav of links with aria-current="page" in links mode', () => {
    const wrapper = mount(BlSegmented, {
      props: {
        as: 'a',
        compact: true,
        label: 'Language',
        options: [
          { value: 'en', label: 'en', href: '/en', current: true },
          { value: 'lv', label: 'lv', href: '/lv' }
        ]
      }
    })
    expect(wrapper.element.tagName).toBe('NAV')
    expect(wrapper.attributes('aria-label')).toBe('Language')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.classes()).toContain('bl-segmented--compact')
    const links = wrapper.findAll('a.bl-segmented__item')
    expect(links.map((l) => l.attributes('href'))).toEqual(['/en', '/lv'])
    expect(links[0]!.attributes('aria-current')).toBe('page')
    expect(links[1]!.attributes('aria-current')).toBeUndefined()
  })
})

describe('BlButton', () => {
  afterEach(() => vi.restoreAllMocks())

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
    const wrapper = mount(BlButton, { props: { href: '/x' } })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/x')
    expect(wrapper.attributes('type')).toBeUndefined()
    expect(wrapper.attributes('aria-disabled')).toBeUndefined()
  })

  it('makes a disabled link inert: no href, not tabbable, clicks cancelled', async () => {
    const wrapper = mount(BlButton, {
      props: { href: '/x', disabled: true },
      attachTo: document.body
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBeUndefined()
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.attributes('tabindex')).toBe('-1')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    wrapper.element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    wrapper.unmount()
  })

  it('renders a disabled router-component button as a plain anchor without to', () => {
    const wrapper = mount(BlButton, {
      props: { as: RouterLinkLike, to: '/projects', disabled: true },
      slots: { default: 'Projects' }
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('data-router')).toBeUndefined()
    expect(wrapper.attributes('href')).toBeUndefined()
    expect(wrapper.text()).toBe('Projects')
  })

  it('disables a button natively and wraps the icon', () => {
    const wrapper = mount(BlButton, { props: { disabled: true }, slots: { icon: '<svg />' } })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.bl-btn__icon').attributes('aria-hidden')).toBe('true')
  })

  it('warns when as="button" is given a link target', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(BlButton, { props: { as: 'button', href: '/x' } })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[benchlight]'))
    warn.mockRestore()
  })

  it('does not warn for ordinary buttons and links', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(BlButton, { slots: { default: 'Save' } })
    mount(BlButton, { props: { href: '/x' } })
    mount(BlNavLink, { props: { href: '/about' } })
    mount(BlNavLink, { props: { as: markRaw(RouterLinkLike), to: '/projects' } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  describe('icon-only', () => {
    const icon = '<svg />'
    it('adds bl-btn--icon when only the icon slot is filled', () => {
      const wrapper = mount(BlButton, { props: { label: 'Close' }, slots: { icon } })
      expect(wrapper.classes()).toContain('bl-btn--icon')
    })

    it('treats a whitespace-only or comment-only default slot as empty', () => {
      const blank = mount(BlButton, { props: { label: 'x' }, slots: { icon, default: '  \n ' } })
      expect(blank.classes()).toContain('bl-btn--icon')
      const comment = mount(BlButton, {
        props: { label: 'x' },
        slots: { icon, default: '<!-- note -->' }
      })
      expect(comment.classes()).toContain('bl-btn--icon')
    })

    it('treats a v-if=false default slot as empty', () => {
      const Host = defineComponent({
        components: { BlButton },
        props: { show: Boolean },
        template: `<BlButton label="x"><template #icon><svg /></template><template v-if="show">Save</template></BlButton>`
      })
      const wrapper = mount(Host)
      expect(wrapper.classes()).toContain('bl-btn--icon')
      return wrapper.setProps({ show: true }).then(() => {
        expect(wrapper.classes()).not.toContain('bl-btn--icon')
        expect(wrapper.text()).toBe('Save')
      })
    })

    it('does not add the class with text, or without an icon', () => {
      const text = mount(BlButton, { slots: { icon, default: 'Save' } })
      expect(text.classes()).not.toContain('bl-btn--icon')
      expect(mount(BlButton).classes()).not.toContain('bl-btn--icon')
    })

    it('keeps the pill modifier alongside the icon one', () => {
      const wrapper = mount(BlButton, { props: { pill: true, label: 'x' }, slots: { icon } })
      expect(wrapper.classes()).toEqual(['bl-btn', 'bl-btn--pill', 'bl-btn--icon'])
    })
  })

  describe('label', () => {
    const icon = '<svg />'
    it('sets aria-label on a button, a link and a router link', () => {
      expect(mount(BlButton, { props: { label: 'Copy' } }).attributes('aria-label')).toBe('Copy')
      expect(
        mount(BlButton, { props: { label: 'Copy', href: '/x' } }).attributes('aria-label')
      ).toBe('Copy')
      const router = mount(BlButton, { props: { label: 'Copy', as: RouterLinkLike, to: '/x' } })
      expect(router.attributes('aria-label')).toBe('Copy')
    })

    it('warns once when a button becomes icon-only and unnamed after mount', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const Host = defineComponent({
        components: { BlButton },
        props: { text: Boolean },
        template: `<BlButton><template #icon><svg /></template><template v-if="text">Save</template></BlButton>`
      })
      const wrapper = mount(Host, { props: { text: true } })
      expect(warn).not.toHaveBeenCalled()
      await wrapper.setProps({ text: false })
      await nextTick()
      expect(warn).toHaveBeenCalledTimes(1)
      await wrapper.setProps({ text: true })
      await wrapper.setProps({ text: false })
      expect(warn).toHaveBeenCalledTimes(1)
    })

    it('warns when label is set on a button with visible text', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mount(BlButton, { props: { label: 'Submit form' }, slots: { default: 'Send' } })
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`label`'))
    })

    it('does not warn about label when the button has no visible text', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mount(BlButton, { props: { label: 'Close' } })
      mount(BlButton, { props: { label: 'Close' }, slots: { default: '  ' } })
      expect(warn).not.toHaveBeenCalled()
    })

    it('warns only when icon-only and unnamed', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mount(BlButton, { slots: { icon } })
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[benchlight] BlButton'))
      warn.mockClear()
      mount(BlButton, { props: { label: 'Close' }, slots: { icon } })
      mount(BlButton, { attrs: { 'aria-label': 'Close' }, slots: { icon } })
      mount(BlButton, { attrs: { 'aria-labelledby': 'x' }, slots: { icon } })
      mount(BlButton, { slots: { icon, default: 'Save' } })
      expect(warn).not.toHaveBeenCalled()
    })
  })

  describe('pressed', () => {
    it('renders aria-pressed true and false on a button', () => {
      expect(mount(BlButton, { props: { pressed: true } }).attributes('aria-pressed')).toBe('true')
      expect(mount(BlButton, { props: { pressed: false } }).attributes('aria-pressed')).toBe(
        'false'
      )
    })

    it('omits aria-pressed when undefined', () => {
      expect(mount(BlButton).attributes('aria-pressed')).toBeUndefined()
    })

    it('ignores pressed on a link and warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = mount(BlButton, { props: { href: '/x', pressed: true } })
      expect(wrapper.attributes('aria-pressed')).toBeUndefined()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[benchlight] BlButton'))
    })
  })

  it('maps the ghost variant to bl-btn--ghost', () => {
    expect(mount(BlButton, { props: { variant: 'ghost' } }).classes()).toEqual([
      'bl-btn',
      'bl-btn--ghost'
    ])
  })
})

describe('BlLinkArrow', () => {
  it('puts a right arrow icon after the text by default', () => {
    const wrapper = mount(BlLinkArrow, { props: { href: '/p' }, slots: { default: 'All' } })
    expect(wrapper.text()).toBe('All')
    const children = wrapper.element.children
    expect(children[children.length - 1].matches('.bl-link-arrow__icon')).toBe(true)
    const svg = wrapper.find('.bl-link-arrow__icon > svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('stroke')).toBe('currentColor')
  })

  it('draws a distinct icon per direction, with no text-glyph arrows', () => {
    const path = (direction?: string) =>
      mount(BlLinkArrow, { props: { href: '/p', direction: direction as 'left' } }).html()
    const [right, left, upRight] = [path(), path('left'), path('up-right')]
    expect(new Set([right, left, upRight]).size).toBe(3)
    for (const html of [right, left, upRight]) expect(html).not.toMatch(/[←→↗]/)
  })

  it('lets the icon slot replace the drawn icon', () => {
    const wrapper = mount(BlLinkArrow, {
      props: { href: '/p' },
      slots: { default: 'All', icon: '+' }
    })
    expect(wrapper.find('.bl-link-arrow__icon').text()).toBe('+')
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('puts a left arrow first and supports quiet', () => {
    const wrapper = mount(BlLinkArrow, {
      props: { href: '/p', direction: 'left', quiet: true },
      slots: { default: 'Back' }
    })
    expect(wrapper.text()).toBe('Back')
    expect(wrapper.element.firstElementChild?.matches('.bl-link-arrow__icon')).toBe(true)
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

  it('BlRange sends aria-label, disabled and name to the slider, not the wrapper', () => {
    const wrapper = mount(BlRange, {
      attrs: { 'aria-label': 'Volume', disabled: true, name: 'volume', 'data-test': 'x' }
    })
    const input = wrapper.find('input[type="range"]')
    expect(input.attributes('aria-label')).toBe('Volume')
    expect(input.attributes('name')).toBe('volume')
    expect((input.element as HTMLInputElement).disabled).toBe(true)
    expect(input.attributes('data-test')).toBe('x')
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(wrapper.attributes('disabled')).toBeUndefined()
    expect(wrapper.attributes('name')).toBeUndefined()
  })

  it('BlRange picks up attrs that arrive after mount', async () => {
    const extra = ref<Record<string, unknown>>({})
    const Host = defineComponent({ setup: () => () => h(BlRange, extra.value) })
    const wrapper = mount(Host)
    expect(wrapper.find('input').attributes('aria-label')).toBeUndefined()
    extra.value = { disabled: true, 'aria-label': 'Volume' }
    await nextTick()
    const input = wrapper.find('input')
    expect(input.attributes('aria-label')).toBe('Volume')
    expect((input.element as HTMLInputElement).disabled).toBe(true)
  })

  it('BlRange keeps class and style on the wrapper', () => {
    const wrapper = mount(BlRange, { attrs: { class: 'mine', style: 'width: 10px' } })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['bl-range', 'mine']))
    expect(wrapper.attributes('style')).toContain('width: 10px')
    expect(wrapper.find('input').attributes('class')).toBeUndefined()
    expect(wrapper.find('input').attributes('style')).toBeUndefined()
  })

  it('BlRange forwards listeners to the slider', async () => {
    const onChange = vi.fn()
    const wrapper = mount(BlRange, { attrs: { onChange } })
    await wrapper.find('input').trigger('change')
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('BlField wires a nested BlInput without slot props', () => {
    const wrapper = mount(BlField, {
      props: { label: 'SSID', hint: 'Network name' },
      slots: { default: () => h(BlInput) }
    })
    const input = wrapper.find('input')
    const id = wrapper.find('label').attributes('for')
    expect(input.attributes('id')).toBe(id)
    expect(wrapper.find('.bl-field__hint').attributes('id')).toBe(`${id}-hint`)
    expect(input.attributes('aria-describedby')).toBe(`${id}-hint`)
  })

  it('BlField leaves aria-describedby off without a hint', () => {
    const wrapper = mount(BlField, {
      props: { label: 'SSID' },
      slots: { default: () => h(BlInput) }
    })
    expect(wrapper.find('input').attributes('aria-describedby')).toBeUndefined()
  })

  it('explicit id and aria-describedby on the control win over the field', () => {
    const wrapper = mount(BlField, {
      props: { label: 'SSID', hint: 'Network name' },
      slots: { default: () => h(BlInput, { id: 'own', 'aria-describedby': 'mine' }) }
    })
    const input = wrapper.find('input')
    expect(input.attributes('id')).toBe('own')
    expect(input.attributes('aria-describedby')).toBe('mine')
  })

  it('BlField wires BlSelect and BlRange too', () => {
    const select = mount(BlField, {
      props: { label: 'Mode', hint: 'h' },
      slots: { default: () => h(BlSelect, { options: [{ value: 'a', label: 'A' }] }) }
    })
    const selectId = select.find('label').attributes('for')
    expect(select.find('select').attributes('id')).toBe(selectId)
    expect(select.find('select').attributes('aria-describedby')).toBe(`${selectId}-hint`)
    const range = mount(BlField, {
      props: { label: 'Volume', hint: 'h' },
      slots: { default: () => h(BlRange) }
    })
    const rangeId = range.find('label').attributes('for')
    expect(range.find('input[type="range"]').attributes('id')).toBe(rangeId)
    expect(range.find('input[type="range"]').attributes('aria-describedby')).toBe(`${rangeId}-hint`)
  })

  it('exposes id and describedby as slot props for third-party controls', () => {
    const wrapper = mount(BlField, {
      props: { label: 'L', hint: 'H', id: 'f' },
      slots: {
        default: (p: { id: string; describedby?: string }) =>
          h('textarea', { id: p.id, 'aria-describedby': p.describedby })
      }
    })
    expect(wrapper.find('textarea').attributes()).toMatchObject({
      id: 'f',
      'aria-describedby': 'f-hint'
    })
  })

  it('controls outside a field render no id', () => {
    expect(mount(BlInput).find('input').attributes('id')).toBeUndefined()
  })

  it('BlRange id prop and explicit attrs win over the field', () => {
    const wrapper = mount(BlField, {
      props: { label: 'Volume', hint: 'h' },
      slots: { default: () => h(BlRange, { id: 'own', 'aria-describedby': 'mine' }) }
    })
    const input = wrapper.find('input[type="range"]')
    expect(input.attributes('id')).toBe('own')
    expect(input.attributes('aria-describedby')).toBe('mine')
  })
})
