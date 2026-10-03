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

  it('BlReadout renders value and unit', () => {
    const wrapper = mount(BlReadout, { props: { value: 94.2, unit: 'Mbps' } })
    expect(wrapper.find('.bl-readout__value').text()).toBe('94.2')
    expect(wrapper.find('.bl-readout__unit').text()).toBe('Mbps')
  })

  it('BlMsg sets tone and an alert role for errors', () => {
    expect(mount(BlMsg, { props: { tone: 'ok' } }).attributes('role')).toBe('status')
    const err = mount(BlMsg, { props: { tone: 'err' } })
    expect(err.classes()).toContain('bl-msg--err')
    expect(err.attributes('role')).toBe('alert')
  })
})

describe('BlMeter', () => {
  const meter = (value: number) => mount(BlMeter, { props: { value, label: 'Download' } })

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
    const wrapper = mount(BlMeter, { props: { value: null, label: 'Scanning' } })
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
    expect(wrapper.attributes('data-indeterminate')).toBe('')
    expect(wrapper.find('.bl-meter__fill').attributes('style')).toBeUndefined()
  })

  it('switches between indeterminate and determinate reactively', async () => {
    const wrapper = mount(BlMeter, { props: { value: null as number | null, label: 'Upload' } })
    await wrapper.setProps({ value: 0.5 })
    expect(wrapper.attributes('aria-valuenow')).toBe('50')
    expect(wrapper.attributes('data-indeterminate')).toBeUndefined()
    expect(wrapper.find('.bl-meter__fill').attributes('style')).toContain('--bl-meter-value: 0.5')
    await wrapper.setProps({ value: null })
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
    expect(wrapper.attributes('data-indeterminate')).toBe('')
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

  it('is a focusable, labelled log without a redundant live region', () => {
    const wrapper = mount(BlLog, { props: { lines: ['a'] } })
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.attributes('aria-label')).toBe('Log')
    expect(wrapper.attributes('aria-live')).toBeUndefined()
    expect(
      mount(BlLog, { props: { lines: [], label: 'Device log' } }).attributes('aria-label')
    ).toBe('Device log')
  })

  it('does not pull a reader scrolled up back to the bottom', async () => {
    const wrapper = mount(BlLog, { props: { lines: ['a', 'b'] }, attachTo: document.body })
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
