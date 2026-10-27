import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import BlEqBars from '../../vue/components/BlEqBars.vue'
import BlLed from '../../vue/components/BlLed.vue'
import BlLog from '../../vue/components/BlLog.vue'
import BlMarquee from '../../vue/components/BlMarquee.vue'
import BlMeter from '../../vue/components/BlMeter.vue'
import BlMsg from '../../vue/components/BlMsg.vue'
import BlReadout from '../../vue/components/BlReadout.vue'
import BlSpecRow from '../../vue/components/BlSpecRow.vue'
import BlSpecPanel from '../../vue/components/BlSpecPanel.vue'
import BlTelemetry from '../../vue/components/BlTelemetry.vue'
import BlTelemetryCell from '../../vue/components/BlTelemetryCell.vue'
import { mockMatchMedia } from '../helpers/vue'

afterEach(() => vi.restoreAllMocks())

describe('BlSpecPanel', () => {
  it('renders rows as dt/dd pairs with external links', () => {
    const wrapper = mount(BlSpecPanel, {
      props: {
        rows: [
          { label: 'Refdes', value: 'SW-01' },
          { label: 'Source', value: 'github.com/x', href: 'https://github.com/x' }
        ]
      }
    })
    expect(wrapper.element.tagName).toBe('DL')
    expect(wrapper.findAll('.bl-spec-row dt').map((d) => d.text())).toEqual(['Refdes', 'Source'])
    const link = wrapper.find('.bl-spec-row__value a')
    expect(link.attributes()).toMatchObject({
      href: 'https://github.com/x',
      target: '_blank',
      rel: 'noopener noreferrer'
    })
  })

  it.each([
    ['https://github.com/x', true],
    ['//cdn.example.com/x', true],
    ['/projects/x', false],
    ['#section', false],
    ['mailto:hi@example.com', false]
  ])('treats %s as external: %s', (href, external) => {
    const link = mount(BlSpecRow, { props: { label: 'L', value: 'v', href } }).find('a')
    expect(link.attributes('target')).toBe(external ? '_blank' : undefined)
    expect(link.attributes('rel')).toBe(external ? 'noopener noreferrer' : undefined)
  })

  it('lets external override the URL guess, also from row data', () => {
    expect(
      mount(BlSpecRow, { props: { label: 'L', value: 'v', href: '/x', external: true } })
        .find('a')
        .attributes('target')
    ).toBe('_blank')
    const panel = mount(BlSpecPanel, {
      props: {
        rows: [{ label: 'Site', value: 'docs', href: 'https://example.com', external: false }]
      }
    })
    expect(panel.find('a').attributes('target')).toBeUndefined()
  })

  it('renders rows with duplicate labels without key collisions', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(BlSpecPanel, {
      props: {
        rows: [
          { label: 'A', value: '1' },
          { label: 'A', value: '2' }
        ]
      }
    })
    expect(wrapper.findAll('.bl-spec-row__value').map((d) => d.text())).toEqual(['1', '2'])
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('BlTelemetry', () => {
  it('draws the ruler and passes custom columns', () => {
    const wrapper = mount(BlTelemetry, {
      props: { columns: '1.4fr 1fr 1fr' },
      slots: { default: () => h(BlTelemetryCell, { label: 'Status' }, () => 'Available') }
    })
    expect(wrapper.find('.bl-ruler').attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('style')).toContain('--bl-telemetry-columns: 1.4fr 1fr 1fr')
    expect(wrapper.find('.bl-telemetry__cells .bl-telemetry__label').text()).toBe('Status')
    expect(wrapper.find('.bl-telemetry__value').text()).toBe('Available')
  })
})

describe('small readouts', () => {
  it('BlLed is aria-hidden without a label and an img with one', () => {
    const hidden = mount(BlLed)
    expect(hidden.attributes('aria-hidden')).toBe('true')
    expect(hidden.attributes('role')).toBeUndefined()
    expect(hidden.attributes('aria-label')).toBeUndefined()
    const named = mount(BlLed, { props: { state: 'danger', ariaLabel: 'Link down' } })
    expect(named.attributes('role')).toBe('img')
    expect(named.attributes('aria-label')).toBe('Link down')
    expect(named.attributes('aria-hidden')).toBeUndefined()
  })

  it('BlSpecRow renders a router component from as/to, also from row data', () => {
    const Router = defineComponent({
      props: { to: String },
      setup:
        (props, { slots }) =>
        () =>
          h('a', { href: props.to, 'data-router': '' }, slots['default']?.())
    })
    const row = mount(BlSpecRow, { props: { label: 'L', value: 'v', as: Router, to: '/x' } })
    expect(row.find('a[data-router]').attributes('href')).toBe('/x')
    expect(row.find('a').attributes('target')).toBeUndefined()
    const toOnly = mount(BlSpecRow, { props: { label: 'L', value: 'v', to: '/y' } })
    expect(toOnly.find('a').attributes('href')).toBe('/y')
    const panel = mount(BlSpecPanel, {
      props: { rows: [{ label: 'L', value: 'v', as: Router, to: '/z' }] }
    })
    expect(panel.find('a[data-router]').attributes('href')).toBe('/z')
  })

  it('BlLed maps state to modifiers', () => {
    expect(mount(BlLed).classes()).toEqual(['bl-led'])
    expect(mount(BlLed, { props: { state: 'on' } }).classes()).toContain('bl-led--on')
    expect(mount(BlLed, { props: { state: 'danger' } }).classes()).toContain('bl-led--danger')
  })

  it('BlEqBars renders four bars and an active modifier', () => {
    const wrapper = mount(BlEqBars, { props: { active: true } })
    expect(wrapper.findAll('.bl-eq__bar')).toHaveLength(4)
    expect(wrapper.classes()).toContain('bl-eq--active')
  })

  it('BlEqBars glides each bar home from where the loop was when it stops', async () => {
    const animate = vi.fn()
    const wrapper = mount(BlEqBars, { props: { active: true }, attachTo: document.body })
    for (const bar of wrapper.findAll('.bl-eq__bar')) (bar.element as HTMLElement).animate = animate
    const computed = vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
      transform: 'matrix(1, 0, 0, 0.6, 0, 0)',
      getPropertyValue: () => '.15s'
    } as unknown as CSSStyleDeclaration)
    await wrapper.setProps({ active: false })
    expect(animate).toHaveBeenCalledTimes(4)
    expect(animate).toHaveBeenCalledWith(
      [{ transform: 'matrix(1, 0, 0, 0.6, 0, 0)' }, { transform: 'none' }],
      { duration: expect.closeTo(150), easing: 'ease' }
    )
    computed.mockRestore()
    wrapper.unmount()
  })

  it('BlReadout renders value and unit', () => {
    const wrapper = mount(BlReadout, { props: { value: 94.2, unit: 'Mbps' } })
    expect(wrapper.find('.bl-readout__value').text()).toBe('94.2')
    expect(wrapper.find('.bl-readout__unit').text()).toBe('Mbps')
  })

  it('BlMsg renders the status tones and an alert role for danger', () => {
    const neutral = mount(BlMsg)
    expect(neutral.classes()).toEqual(['bl-msg'])
    expect(neutral.attributes('role')).toBe('status')
    const success = mount(BlMsg, { props: { tone: 'success' } })
    expect(success.classes()).toContain('bl-msg--success')
    expect(success.attributes('role')).toBe('status')
    const danger = mount(BlMsg, { props: { tone: 'danger' } })
    expect(danger.classes()).toContain('bl-msg--danger')
    expect(danger.attributes('role')).toBe('alert')
  })

  it('BlMsg maps the old info/ok/err tones with one dev warning each', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const map = { info: 'neutral', ok: 'success', err: 'danger' } as const
    for (const [old, now] of Object.entries(map)) {
      const wrapper = mount(BlMsg, { props: { tone: old as never } })
      expect(wrapper.classes().join(' ')).not.toContain(`bl-msg--${old}`)
      if (now !== 'neutral') expect(wrapper.classes()).toContain(`bl-msg--${now}`)
      expect(wrapper.attributes('role')).toBe(now === 'danger' ? 'alert' : 'status')
      mount(BlMsg, { props: { tone: old as never } })
    }
    const messages = warn.mock.calls.map((call) => String(call[0]))
    expect(messages).toHaveLength(3)
    expect(messages.join('\n')).toMatch(/"info".*"neutral"/)
    expect(messages.join('\n')).toMatch(/"ok".*"success"/)
    expect(messages.join('\n')).toMatch(/"err".*"danger"/)
  })

  it('BlMsg wraps the slot in one text box so runs and links share a column', () => {
    const wrapper = mount(BlMsg, {
      slots: { default: 'Saved. Visit <a href="#">the settings page</a> to continue' }
    })
    const kids = [...wrapper.element.children]
    expect(kids).toHaveLength(1)
    expect(kids[0]!.className).toBe('bl-msg__text')
    expect(kids[0]!.querySelector('a')).not.toBeNull()
  })
})

describe('BlMeter', () => {
  const meter = (value: number) => mount(BlMeter, { props: { value, ariaLabel: 'Download' } })

  it('exposes a progressbar with an integer percentage', () => {
    const wrapper = meter(0.426)
    expect(wrapper.attributes()).toMatchObject({
      role: 'progressbar',
      'aria-label': 'Download',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '43'
    })
    expect(wrapper.find('.bl-meter__fill').attributes('style')).toContain('--bl-meter-value: 0.426')
  })

  it.each([
    [1.5, '100', '1'],
    [-1, '0', '0'],
    [Number.POSITIVE_INFINITY, '100', '1'],
    [Number.NaN, '0', '0']
  ])('clamps %s to %s%%', (value, now, fill) => {
    const wrapper = meter(value)
    expect(wrapper.attributes('aria-valuenow')).toBe(now)
    expect(wrapper.find('.bl-meter__fill').attributes('style')).toContain(
      `--bl-meter-value: ${fill}`
    )
  })

  it('renders null as indeterminate', () => {
    const wrapper = mount(BlMeter, { props: { value: null, ariaLabel: 'Scanning' } })
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
    expect(wrapper.attributes('data-indeterminate')).toBe('')
    expect(wrapper.find('.bl-meter__fill').attributes('style')).toBeUndefined()
  })

  it('switches between indeterminate and determinate reactively', async () => {
    const wrapper = mount(BlMeter, { props: { value: null as number | null, ariaLabel: 'Upload' } })
    await wrapper.setProps({ value: 0.5 })
    expect(wrapper.attributes('aria-valuenow')).toBe('50')
    expect(wrapper.attributes('data-indeterminate')).toBeUndefined()
    expect(wrapper.find('.bl-meter__fill').attributes('style')).toContain('--bl-meter-value: 0.5')
    await wrapper.setProps({ value: null })
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
    expect(wrapper.attributes('data-indeterminate')).toBe('')
  })
})

describe('BlMeter label and value', () => {
  const field = (props: Record<string, unknown>) =>
    mount(BlMeter, { props: { value: 0.426, ariaLabel: 'Download', ...props } })

  it('renders the bare progressbar with neither label nor value', () => {
    const wrapper = field({})
    expect(wrapper.classes()).toEqual(['bl-meter'])
    expect(wrapper.attributes('aria-valuetext')).toBeUndefined()
    expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
    expect(wrapper.find('.bl-meter-field').exists()).toBe(false)
  })

  it('renders a bare bar named by ariaLabel', () => {
    expect(field({}).html()).toBe(
      [
        '<div class="bl-meter" role="progressbar" aria-label="Download" aria-valuemin="0" aria-valuemax="100" aria-valuenow="43">',
        '  <div class="bl-meter__fill" style="--bl-meter-value: 0.426;"></div>',
        '</div>'
      ].join('\n')
    )
  })

  it('puts every fallthrough attribute on the bar when unwrapped', () => {
    const wrapper = field({}).vm.$el as HTMLElement
    expect(wrapper.matches('.bl-meter[role=progressbar]')).toBe(true)
    const attrs = mount(BlMeter, {
      props: { value: 0.5, ariaLabel: 'Download' },
      attrs: { id: 'disk', class: 'x', style: 'color: red', 'aria-describedby': 'hint' }
    })
    expect(attrs.element.matches('[role=progressbar].bl-meter.x#disk')).toBe(true)
    expect(attrs.attributes('aria-describedby')).toBe('hint')
    expect(attrs.attributes('style')).toContain('color: red')
  })

  it('puts class and style on the wrapper and other attributes on the bar when wrapped', () => {
    const wrapper = mount(BlMeter, {
      props: { value: 0.5, ariaLabel: 'Download', showValue: true },
      attrs: { id: 'disk', class: 'x', style: 'color: red', 'aria-describedby': 'hint' }
    })
    expect(wrapper.classes()).toEqual(['bl-meter-field', 'x'])
    expect(wrapper.attributes('style')).toContain('color: red')
    expect(wrapper.attributes('id')).toBeUndefined()
    const bar = wrapper.find('[role=progressbar]')
    expect(bar.attributes('id')).toBe('disk')
    expect(bar.attributes('aria-describedby')).toBe('hint')
    expect(bar.classes()).toEqual(['bl-meter'])
    expect(bar.attributes('style')).toBeUndefined()
  })

  it('renders no head while a value-only meter is indeterminate', () => {
    expect(field({ value: null, showValue: true }).find('.bl-meter-field__head').exists()).toBe(
      false
    )
  })

  it('wraps the bar and labels it by the visible label', () => {
    const wrapper = field({ label: 'Download', ariaLabel: undefined })
    expect(wrapper.classes()).toEqual(['bl-meter-field'])
    const label = wrapper.find('.bl-meter-field__head .bl-meter-field__label')
    expect(label.text()).toBe('Download')
    const bar = wrapper.find('.bl-meter')
    expect(bar.attributes('role')).toBe('progressbar')
    expect(bar.attributes('aria-labelledby')).toBe(label.attributes('id'))
    expect(bar.attributes('aria-label')).toBeUndefined()
    expect(wrapper.find('.bl-meter-field__value').exists()).toBe(false)
  })

  it('names the bar by ariaLabel when only the value is shown', () => {
    const wrapper = field({ showValue: true })
    expect(wrapper.find('.bl-meter').attributes('aria-label')).toBe('Download')
    expect(wrapper.find('.bl-meter-field__label').exists()).toBe(false)
  })

  it('shows a percentage, or valueText, as an aria-hidden value', () => {
    const percent = field({ showValue: true }).find('.bl-meter-field__value')
    expect(percent.text()).toBe('43%')
    expect(percent.attributes('aria-hidden')).toBe('true')
    const text = field({ showValue: true, valueText: '2.1 of 4 GB' })
    expect(text.find('.bl-meter-field__value').text()).toBe('2.1 of 4 GB')
  })

  it('shows no value while indeterminate', () => {
    const wrapper = field({ value: null, label: 'Download', ariaLabel: undefined, showValue: true })
    expect(wrapper.find('.bl-meter-field__label').exists()).toBe(true)
    expect(wrapper.find('.bl-meter-field__value').exists()).toBe(false)
  })

  it('renders no visible label for ariaLabel alone, and a visible one for label', () => {
    const hidden = mount(BlMeter, { props: { value: 0.5, ariaLabel: 'Disk' } })
    expect(hidden.find('.bl-meter-field__label').exists()).toBe(false)
    expect(hidden.text()).toBe('')
    expect(hidden.attributes('aria-label')).toBe('Disk')
    const visible = mount(BlMeter, { props: { value: 0.5, label: 'Disk' } })
    expect(visible.find('.bl-meter-field__label').text()).toBe('Disk')
    expect(visible.find('.bl-meter').attributes('aria-label')).toBeUndefined()
  })

  it('warns when neither label nor ariaLabel names it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(BlMeter, { props: { value: 0.5 } })
    expect(warn.mock.calls.flat().join(' ')).toContain('BlMeter')
    warn.mockClear()
    mount(BlMeter, { props: { value: 0.5, ariaLabel: 'Disk' } })
    mount(BlMeter, { props: { value: 0.5, label: 'Disk' } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('treats an empty label as no label and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(BlMeter, { props: { value: 0.5, label: '' } })
    expect(wrapper.find('.bl-meter-field__label').exists()).toBe(false)
    expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
    expect(warn.mock.calls.flat().join(' ')).toContain('BlMeter')
    warn.mockRestore()
  })

  it('sets aria-valuetext on the progressbar', () => {
    expect(field({ valueText: '2.1 of 4 GB' }).attributes('aria-valuetext')).toBe('2.1 of 4 GB')
    const wrapped = field({ valueText: '2.1 of 4 GB', showValue: true })
    expect(wrapped.find('.bl-meter').attributes('aria-valuetext')).toBe('2.1 of 4 GB')
  })
})

describe('BlLog', () => {
  it('renders coloured spans line by line', () => {
    const wrapper = mount(BlLog, { props: { lines: ['\x1b[0;31mE oops\x1b[0m', 'plain'] } })
    expect(wrapper.element.tagName).toBe('PRE')
    expect(wrapper.attributes('role')).toBe('log')
    expect(wrapper.find('span.bl-ansi-31').text()).toBe('E oops')
    expect(wrapper.text()).toBe('E oops\nplain')
  })

  it('follows new lines to the bottom', async () => {
    const wrapper = mount(BlLog, { props: { lines: ['a'] }, attachTo: document.body })
    Object.defineProperty(wrapper.element, 'scrollHeight', { value: 500, configurable: true })
    await wrapper.setProps({ lines: ['a', 'b'] })
    await nextTick()
    expect(wrapper.element.scrollTop).toBe(500)
    wrapper.unmount()
  })

  it('follows lines pushed onto the same array', async () => {
    const lines = ref(['a'])
    const Host = defineComponent({ setup: () => () => h(BlLog, { lines: lines.value }) })
    const wrapper = mount(Host, { attachTo: document.body })
    const log = wrapper.find('pre').element
    Object.defineProperty(log, 'scrollHeight', { value: 500, configurable: true })
    lines.value.push('b')
    await nextTick()
    await nextTick()
    expect(log.scrollTop).toBe(500)
    wrapper.unmount()
  })

  it('follows when a same-length array replaces the lines', async () => {
    const wrapper = mount(BlLog, { props: { lines: ['a', 'b'] }, attachTo: document.body })
    Object.defineProperty(wrapper.element, 'scrollHeight', { value: 700, configurable: true })
    await wrapper.setProps({ lines: ['b', 'c'] })
    await nextTick()
    expect(wrapper.element.scrollTop).toBe(700)
    wrapper.unmount()
  })

  it('reuses row elements for surviving lines when offset tracks a shifted buffer', async () => {
    const wrapper = mount(BlLog, { props: { lines: ['a', 'b', 'c'], offset: 0 } })
    const before = wrapper.findAll('span').map((span) => span.element)
    await wrapper.setProps({ lines: ['b', 'c', 'd'], offset: 1 })
    const after = wrapper.findAll('span').map((span) => span.element)
    expect(wrapper.text()).toBe('b\nc\nd')
    expect(after[0]).toBe(before[1])
    expect(after[1]).toBe(before[2])
  })

  it('keys rows by position when no offset is given', async () => {
    const wrapper = mount(BlLog, { props: { lines: ['a', 'b'] } })
    const first = wrapper.find('span').element
    await wrapper.setProps({ lines: ['b', 'c'] })
    expect(wrapper.find('span').element).toBe(first)
  })

  it('renders uncoloured segments without an empty class attribute', () => {
    const wrapper = mount(BlLog, { props: { lines: ['plain', '\x1b[0;31mred\x1b[0m'] } })
    const [plain, red] = wrapper.findAll('span')
    expect(plain!.attributes('class')).toBeUndefined()
    expect(red!.classes()).toContain('bl-ansi-31')
  })

  it('is a focusable, labelled log without a redundant live region', () => {
    const wrapper = mount(BlLog, { props: { lines: ['a'] } })
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.attributes('aria-label')).toBe('Log')
    expect(wrapper.attributes('aria-live')).toBeUndefined()
    expect(
      mount(BlLog, { props: { lines: [], ariaLabel: 'Device log' } }).attributes('aria-label')
    ).toBe('Device log')
  })

  it('leaves an overflowing log with follow off where it is', async () => {
    const wrapper = mount(BlLog, {
      props: { lines: ['a', 'b'], follow: false },
      attachTo: document.body
    })
    const log = wrapper.element as HTMLElement
    Object.defineProperty(log, 'scrollHeight', { value: 600, configurable: true })
    Object.defineProperty(log, 'clientHeight', { value: 100, configurable: true })
    await wrapper.setProps({ lines: ['a', 'b', 'c'] })
    await nextTick()
    expect(log.scrollTop).toBe(0)
    wrapper.unmount()
  })

  it('does not pull a reader scrolled up back to the bottom', async () => {
    const wrapper = mount(BlLog, { props: { lines: ['a', 'b'] }, attachTo: document.body })
    await nextTick() // the post-flush watcher binds the scroll listener
    const log = wrapper.element as HTMLElement
    Object.defineProperty(log, 'scrollHeight', { value: 600, configurable: true })
    Object.defineProperty(log, 'clientHeight', { value: 100, configurable: true })
    log.scrollTop = 50
    log.dispatchEvent(new Event('scroll'))
    await wrapper.setProps({ lines: ['a', 'b', 'c'] })
    await nextTick()
    expect(log.scrollTop).toBe(50)
    log.scrollTop = 500
    log.dispatchEvent(new Event('scroll'))
    await wrapper.setProps({ lines: ['a', 'b', 'c', 'd'] })
    await nextTick()
    expect(log.scrollTop).toBe(600)
    wrapper.unmount()
  })
})

describe('BlMarquee', () => {
  // happy-dom reports 0 for layout metrics; stub them on Element.prototype and restore after.
  const restores: Array<() => void> = []
  function stubLayout(name: 'scrollWidth' | 'clientWidth', get: (el: Element) => number): void {
    const original = Object.getOwnPropertyDescriptor(Element.prototype, name)
    Object.defineProperty(Element.prototype, name, {
      configurable: true,
      get() {
        return get(this as Element)
      }
    })
    restores.push(() => {
      if (original) Object.defineProperty(Element.prototype, name, original)
    })
  }
  afterEach(() => restores.splice(0).forEach((restore) => restore()))

  it('flags overflow and shows the full title', async () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    stubLayout('scrollWidth', (el) => (el.classList.contains('bl-marquee__content') ? 300 : 0))
    stubLayout('clientWidth', (el) => (el.classList.contains('bl-marquee') ? 100 : 0))
    const wrapper = mount(BlMarquee, {
      props: { title: 'Xtal · Aphex Twin' },
      slots: { default: 'Xtal · Aphex Twin' }
    })
    await nextTick()
    expect(wrapper.attributes('data-overflowing')).toBe('')
    expect(wrapper.attributes('title')).toBe('Xtal · Aphex Twin')
    expect(wrapper.find('.bl-marquee__content').text()).toBe('Xtal · Aphex Twin')
  })

  it('stays unmasked and untitled when the text fits', async () => {
    const wrapper = mount(BlMarquee, { props: { title: 'Short' }, slots: { default: 'Short' } })
    await nextTick()
    expect(wrapper.attributes('data-overflowing')).toBeUndefined()
    expect(wrapper.attributes('title')).toBeUndefined()
  })
})
