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
import BlSiteBarLink from '../../vue/components/BlSiteBarLink.vue'
import BlRange from '../../vue/components/BlRange.vue'
import BlSelect from '../../vue/components/BlSelect.vue'
import BlSiteBar from '../../vue/components/BlSiteBar.vue'
import BlTextarea from '../../vue/components/BlTextarea.vue'
import BlSkipLink from '../../vue/components/BlSkipLink.vue'
import BlTabBar from '../../vue/components/BlTabBar.vue'
import BlTabBarItem from '../../vue/components/BlTabBarItem.vue'
import { resetAppearanceState } from '../../vue/composables/useAppearance'
import { mockMatchMedia } from '../helpers/vue'

const RouterLinkLike = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  setup(props, { slots }) {
    return () => h('a', { href: String(props.to), 'data-router': '' }, slots['default']?.())
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
    const custom = mount(BlSiteBar, { props: { ariaLabel: 'Galvenā' }, slots })
    expect(custom.find('nav.bl-site-bar__navwrap').attributes('aria-label')).toBe('Galvenā')
  })

  it('names the nav from a plain aria-label attribute, not the root', () => {
    const wrapper = mount(BlSiteBar, {
      attrs: { 'aria-label': 'Main' },
      slots: { nav: '<li>n</li>' }
    })
    expect(wrapper.find('nav[aria-label="Main"]').exists()).toBe(true)
    expect(wrapper.element.tagName).toBe('HEADER')
    expect(wrapper.attributes('aria-label')).toBeUndefined()
  })

  it('does not use the old navLabel as the name', () => {
    const wrapper = mount(BlSiteBar, { attrs: { navLabel: 'Old' }, slots: { nav: '<li>n</li>' } })
    expect(wrapper.find('nav').attributes('aria-label')).toBe('Primary')
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

describe('BlSiteBarLink', () => {
  it('renders an anchor in a list item with aria-current for the current page', () => {
    const wrapper = mount(BlSiteBarLink, {
      props: { href: '/about', current: true },
      slots: { default: 'About' }
    })
    const link = wrapper.find('li > a.bl-site-bar__link')
    expect(link.attributes('href')).toBe('/about')
    expect(link.attributes('aria-current')).toBe('page')
  })

  it('hands to to a router component', () => {
    const wrapper = mount(BlSiteBarLink, { props: { as: RouterLinkLike, to: '/projects' } })
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
    expect(wrapper.find('nav.bl-tab-bar').attributes('aria-label')).toBe('Primary')
    const item = wrapper.find('a.bl-tab-bar__item')
    expect(item.attributes('aria-current')).toBe('page')
    expect(item.find('.bl-tab-bar__icon').attributes('aria-hidden')).toBe('true')
    expect(item.find('.bl-tab-bar__label').text()).toBe('Home')
    // The old name is split so a repo-wide grep for it only finds CHANGELOG history.
    expect(wrapper.html()).not.toContain('bl-tab' + 'bar')
  })

  it('renders the icon span only when the icon slot has content', () => {
    const bare = mount(BlTabBarItem, { props: { href: '/' }, slots: { default: 'Home' } })
    expect(bare.find('.bl-tab-bar__icon').exists()).toBe(false)
    const empty = mount(BlTabBarItem, {
      props: { href: '/' },
      slots: { icon: () => [], default: 'Home' }
    })
    expect(empty.find('.bl-tab-bar__icon').exists()).toBe(false)
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
    expect(wrapper.findAll('.bl-appearance__option').map((o) => o.text())).toEqual(['A', 'L', 'D'])
    expect(wrapper.find('legend.bl-sr-only').text()).toBe('Appearance')
    expect(wrapper.find('fieldset.bl-appearance > .bl-appearance__track').exists()).toBe(true)
    // The old name is split so a repo-wide grep for it only finds CHANGELOG history.
    expect(wrapper.html()).not.toContain('bl-sw' + 'itch')
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
    mount(BlSiteBarLink, { props: { href: '/about' } })
    mount(BlSiteBarLink, { props: { as: markRaw(RouterLinkLike), to: '/projects' } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  describe('icon-only', () => {
    const icon = '<svg />'
    it('adds bl-btn--icon when only the icon slot is filled', () => {
      const wrapper = mount(BlButton, { props: { ariaLabel: 'Close' }, slots: { icon } })
      expect(wrapper.classes()).toContain('bl-btn--icon')
    })

    it('treats a whitespace-only or comment-only default slot as empty', () => {
      const blank = mount(BlButton, {
        props: { ariaLabel: 'x' },
        slots: { icon, default: '  \n ' }
      })
      expect(blank.classes()).toContain('bl-btn--icon')
      const comment = mount(BlButton, {
        props: { ariaLabel: 'x' },
        slots: { icon, default: '<!-- note -->' }
      })
      expect(comment.classes()).toContain('bl-btn--icon')
    })

    it('treats a v-if=false default slot as empty', () => {
      const Host = defineComponent({
        components: { BlButton },
        props: { show: Boolean },
        template: `<BlButton aria-label="x"><template #icon><svg /></template><template v-if="show">Save</template></BlButton>`
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
      const wrapper = mount(BlButton, { props: { pill: true, ariaLabel: 'x' }, slots: { icon } })
      expect(wrapper.classes()).toEqual(['bl-btn', 'bl-btn--pill', 'bl-btn--icon'])
    })
  })

  describe('ariaLabel', () => {
    const icon = '<svg />'
    it('sets aria-label on a button, a link and a router link', () => {
      expect(mount(BlButton, { props: { ariaLabel: 'Copy' } }).attributes('aria-label')).toBe(
        'Copy'
      )
      expect(
        mount(BlButton, { props: { ariaLabel: 'Copy', href: '/x' } }).attributes('aria-label')
      ).toBe('Copy')
      const router = mount(BlButton, { props: { ariaLabel: 'Copy', as: RouterLinkLike, to: '/x' } })
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

    it('warns when ariaLabel is set on a button with visible text', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mount(BlButton, { props: { ariaLabel: 'Submit form' }, slots: { default: 'Send' } })
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`ariaLabel`'))
    })

    it('does not warn about ariaLabel when the button has no visible text', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mount(BlButton, { props: { ariaLabel: 'Close' } })
      mount(BlButton, { props: { ariaLabel: 'Close' }, slots: { default: '  ' } })
      expect(warn).not.toHaveBeenCalled()
    })

    it('treats the old label prop as a plain attribute, not the name', () => {
      const wrapper = mount(BlButton, { attrs: { label: 'Copy' } })
      expect(wrapper.attributes('aria-label')).toBeUndefined()
      expect(wrapper.attributes('label')).toBe('Copy')
    })

    it('names the button from a plain aria-label attribute', () => {
      const wrapper = mount(BlButton, { attrs: { 'aria-label': 'Copy' } })
      expect(wrapper.attributes('aria-label')).toBe('Copy')
    })

    it('warns only when icon-only and unnamed', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mount(BlButton, { slots: { icon } })
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[benchlight] BlButton'))
      warn.mockClear()
      mount(BlButton, { props: { ariaLabel: 'Close' }, slots: { icon } })
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

  it('BlSelect wraps the select and splits attrs between them', () => {
    const wrapper = mount(BlSelect, {
      props: { options: [{ value: 'a', label: 'Alpha' }] },
      attrs: {
        class: 'extra',
        style: 'margin: 4px',
        id: 'net',
        'aria-label': 'Network',
        'data-test': 'x',
        name: 'net'
      }
    })
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toEqual(['bl-select-wrap', 'extra'])
    expect(wrapper.attributes('style')).toContain('margin')
    expect(wrapper.attributes('id')).toBeUndefined()
    expect(wrapper.attributes('data-test')).toBeUndefined()
    const select = wrapper.find('select')
    expect(select.classes()).toEqual(['bl-select'])
    expect(select.attributes('id')).toBe('net')
    expect(select.attributes('aria-label')).toBe('Network')
    expect(select.attributes('data-test')).toBe('x')
    expect(select.attributes('name')).toBe('net')
    expect(select.attributes('style')).toBeUndefined()
  })

  it('BlSelect wires to a BlField, and an own id wins and aria-describedby merges', async () => {
    const own = ref<Record<string, unknown>>({})
    const Host = defineComponent({
      setup: () => () =>
        h(BlField, { label: 'Network', hint: 'Pick one' }, () =>
          h(BlSelect, { options: [{ value: 'a', label: 'Alpha' }], ...own.value })
        )
    })
    const wrapper = mount(Host)
    const id = wrapper.find('label').attributes('for')
    expect(wrapper.find('select').attributes('id')).toBe(id)
    expect(wrapper.find('select').attributes('aria-describedby')).toBe(`${id}-hint`)
    own.value = { id: 'mine', 'aria-describedby': 'other' }
    await nextTick()
    expect(wrapper.find('select').attributes('id')).toBe('mine')
    expect(wrapper.find('select').attributes('aria-describedby')).toBe(`${id}-hint other`)
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
    expect(wrapper.find('input').attributes('class')).toBe('bl-range__input')
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

  it('explicit id wins and aria-describedby merges with the hint id', () => {
    const wrapper = mount(BlField, {
      props: { label: 'SSID', hint: 'Network name' },
      slots: { default: () => h(BlInput, { id: 'own', 'aria-describedby': 'mine' }) }
    })
    const input = wrapper.find('input')
    expect(input.attributes('id')).toBe('own')
    expect(input.attributes('aria-describedby')).toBe(
      `${wrapper.find('label').attributes('for')}-hint mine`
    )
  })

  it('BlInput merges consumer ids after the hint id without duplicates', () => {
    const wrapper = mount(BlField, {
      props: { label: 'SSID', hint: 'h', id: 'f' },
      slots: { default: () => h(BlInput, { 'aria-describedby': 'err f-hint note' }) }
    })
    expect(wrapper.find('input').attributes('aria-describedby')).toBe('f-hint err note')
  })

  it('BlSelect and BlInput keep a consumer aria-describedby outside a field', () => {
    const sel = mount(BlSelect, {
      props: { options: [{ value: 'a', label: 'A' }] },
      attrs: { 'aria-describedby': 'x' }
    })
    expect(sel.find('select').attributes('aria-describedby')).toBe('x')
    expect(
      mount(BlInput, { attrs: { 'aria-describedby': 'x' } })
        .find('input')
        .attributes('aria-describedby')
    ).toBe('x')
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

  it('exposes id and describedBy as slot props for third-party controls', () => {
    const wrapper = mount(BlField, {
      props: { label: 'L', hint: 'H', id: 'f' },
      slots: {
        default: (p: { id: string; describedBy: string | undefined }) =>
          h('textarea', { id: p.id, 'aria-describedby': p.describedBy })
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

  it('BlRange id attr wins and aria-describedby merges with the hint id', () => {
    const wrapper = mount(BlField, {
      props: { label: 'Volume', hint: 'h', id: 'f' },
      slots: { default: () => h(BlRange, { id: 'own', 'aria-describedby': 'mine f-hint' }) }
    })
    const input = wrapper.find('input[type="range"]')
    expect(input.attributes('id')).toBe('own')
    expect(input.attributes('aria-describedby')).toBe('f-hint mine')
  })

  it('BlRange has no id or ariaDescribedby props and its input carries bl-range__input', () => {
    const props = Object.keys((BlRange as { props?: Record<string, unknown> }).props ?? {})
    expect(props).not.toContain('id')
    expect(props).not.toContain('ariaDescribedby')
    const wrapper = mount(BlRange, { attrs: { id: 'r', 'aria-describedby': 'd' } })
    const input = wrapper.find('input')
    expect(input.classes()).toContain('bl-range__input')
    expect(input.attributes('id')).toBe('r')
    expect(input.attributes('aria-describedby')).toBe('d')
    expect(wrapper.attributes('id')).toBeUndefined()
  })

  it('BlRange without a model shows min and does not emit', () => {
    const wrapper = mount(BlRange, { props: { min: 10, max: 20 } })
    expect(wrapper.find('.bl-range__value').text()).toBe('10')
    expect(wrapper.find('input').attributes('aria-valuetext')).toBe('10')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('BlRange binds the slider to the corrected value and emits on input', async () => {
    const none = mount(BlRange, { props: { min: 10, max: 20 } })
    expect(none.find('input').element.value).toBe('10')
    const over = mount(BlRange, { props: { modelValue: 150, max: 100 } })
    expect(over.find('input').element.value).toBe('100')
    const input = none.find('input')
    input.element.value = '15'
    await input.trigger('input')
    expect(none.emitted('update:modelValue')).toEqual([[15]])
  })

  it('BlRange clamps and snaps the shown value without emitting', () => {
    const over = mount(BlRange, { props: { modelValue: 150, max: 100 } })
    expect(over.find('.bl-range__value').text()).toBe('100')
    expect(over.emitted('update:modelValue')).toBeUndefined()
    const stepped = mount(BlRange, { props: { modelValue: 12, step: 5 } })
    expect(stepped.find('.bl-range__value').text()).toBe('10')
  })

  it('BlRange snaps below an off-step max, as the native thumb does', () => {
    const wrapper = mount(BlRange, { props: { modelValue: 10, min: 0, max: 10, step: 4 } })
    expect(wrapper.find('.bl-range__value').text()).toBe('8')
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('8')
    const fine = mount(BlRange, { props: { modelValue: 1, min: 0, max: 1, step: 0.1 } })
    expect(fine.find('.bl-range__value').text()).toBe('1')
  })
})

describe('current on link components', () => {
  it.each([
    ['BlSiteBarLink', BlSiteBarLink],
    ['BlTabBarItem', BlTabBarItem]
  ] as const)('%s maps true to page and passes step and location', (_name, Component) => {
    const attr = (current?: boolean | 'page' | 'step' | 'location') =>
      mount(Component, { props: { href: '/x', ...(current === undefined ? {} : { current }) } })
        .find('a')
        .attributes('aria-current')
    expect(attr(true)).toBe('page')
    expect(attr('page')).toBe('page')
    expect(attr('step')).toBe('step')
    expect(attr('location')).toBe('location')
    expect(attr(false)).toBeUndefined()
    expect(attr()).toBeUndefined()
  })
})

describe('BlTabBar ariaLabel', () => {
  it('names the nav from ariaLabel or a plain aria-label, not twice', () => {
    expect(mount(BlTabBar, { props: { ariaLabel: 'Tabs' } }).attributes('aria-label')).toBe('Tabs')
    const wrapper = mount(BlTabBar, { attrs: { 'aria-label': 'Mine' } })
    expect(wrapper.element.tagName).toBe('NAV')
    expect(wrapper.attributes('aria-label')).toBe('Mine')
  })
})

describe('disabled on form controls', () => {
  const options = [{ value: 'a', label: 'A' }]
  const native = (wrapper: { element: Element }, selector: string): Element =>
    wrapper.element.matches(selector) ? wrapper.element : wrapper.element.querySelector(selector)!

  it.each([
    ['BlInput', () => mount(BlInput, { props: { disabled: true } }), BlInput, 'input.bl-input'],
    [
      'BlTextarea',
      () => mount(BlTextarea, { props: { disabled: true } }),
      BlTextarea,
      'textarea.bl-textarea'
    ],
    [
      'BlSelect',
      () => mount(BlSelect, { props: { options, disabled: true } }),
      BlSelect,
      'select.bl-select'
    ],
    [
      'BlRange',
      () => mount(BlRange, { props: { disabled: true } }),
      BlRange,
      'input.bl-range__input'
    ]
  ] as const)('%s declares disabled and renders it on the native control', (_n, make, C, sel) => {
    expect(Object.keys((C as unknown as { props: object }).props)).toContain('disabled')
    expect(native(make(), sel).hasAttribute('disabled')).toBe(true)
  })

  it('leaves the control enabled by default', () => {
    expect(native(mount(BlInput), 'input').hasAttribute('disabled')).toBe(false)
    expect(native(mount(BlRange), 'input').hasAttribute('disabled')).toBe(false)
  })
})
