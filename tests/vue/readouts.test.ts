import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import KdEqBars from '../../vue/components/KdEqBars.vue'
import KdLed from '../../vue/components/KdLed.vue'
import KdLog from '../../vue/components/KdLog.vue'
import KdMarquee from '../../vue/components/KdMarquee.vue'
import KdMeter from '../../vue/components/KdMeter.vue'
import KdMsg from '../../vue/components/KdMsg.vue'
import KdReadout from '../../vue/components/KdReadout.vue'
import KdSpecPanel from '../../vue/components/KdSpecPanel.vue'
import KdTelemetry from '../../vue/components/KdTelemetry.vue'
import KdTelemetryCell from '../../vue/components/KdTelemetryCell.vue'
import { mockMatchMedia } from '../helpers/vue'

afterEach(() => vi.restoreAllMocks())

describe('KdSpecPanel', () => {
  it('renders rows as dt/dd pairs with external links', () => {
    const wrapper = mount(KdSpecPanel, {
      props: {
        rows: [
          { label: 'Refdes', value: 'SW-01' },
          { label: 'Source', value: 'github.com/x', href: 'https://github.com/x' }
        ]
      }
    })
    expect(wrapper.element.tagName).toBe('DL')
    expect(wrapper.findAll('.kd-spec-row dt').map((d) => d.text())).toEqual(['Refdes', 'Source'])
    const link = wrapper.find('.kd-spec-row__value a')
    expect(link.attributes()).toMatchObject({
      href: 'https://github.com/x',
      target: '_blank',
      rel: 'noopener noreferrer'
    })
  })
})

describe('KdTelemetry', () => {
  it('draws the ruler and passes custom columns', () => {
    const wrapper = mount(KdTelemetry, {
      props: { columns: '1.4fr 1fr 1fr' },
      slots: { default: () => h(KdTelemetryCell, { label: 'Status' }, () => 'Available') }
    })
    expect(wrapper.find('.kd-ruler').attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('style')).toContain('--kd-telemetry-columns: 1.4fr 1fr 1fr')
    expect(wrapper.find('.kd-telemetry__cells .kd-telemetry__label').text()).toBe('Status')
    expect(wrapper.find('.kd-telemetry__value').text()).toBe('Available')
  })
})

describe('small readouts', () => {
  it('KdLed maps state to modifiers', () => {
    expect(mount(KdLed).classes()).toEqual(['kd-led'])
    expect(mount(KdLed, { props: { state: 'on' } }).classes()).toContain('kd-led--on')
    expect(mount(KdLed, { props: { state: 'danger' } }).classes()).toContain('kd-led--danger')
  })

  it('KdEqBars renders four bars and an active modifier', () => {
    const wrapper = mount(KdEqBars, { props: { active: true } })
    expect(wrapper.findAll('.kd-eq__bar')).toHaveLength(4)
    expect(wrapper.classes()).toContain('kd-eq--active')
  })

  it('KdReadout renders value and unit', () => {
    const wrapper = mount(KdReadout, { props: { value: 94.2, unit: 'Mbps' } })
    expect(wrapper.find('.kd-readout__value').text()).toBe('94.2')
    expect(wrapper.find('.kd-readout__unit').text()).toBe('Mbps')
  })

  it('KdMsg sets tone and an alert role for errors', () => {
    expect(mount(KdMsg, { props: { tone: 'ok' } }).attributes('role')).toBe('status')
    const err = mount(KdMsg, { props: { tone: 'err' } })
    expect(err.classes()).toContain('kd-msg--err')
    expect(err.attributes('role')).toBe('alert')
  })
})

describe('KdMeter', () => {
  const meter = (value: number) => mount(KdMeter, { props: { value, label: 'Download' } })

  it('exposes a progressbar with an integer percentage', () => {
    const wrapper = meter(0.426)
    expect(wrapper.attributes()).toMatchObject({
      role: 'progressbar',
      'aria-label': 'Download',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '43'
    })
    expect(wrapper.find('.kd-meter__fill').attributes('style')).toContain('--kd-meter-value: 0.426')
  })

  it.each([
    [1.5, '100', '1'],
    [-1, '0', '0'],
    [Number.NaN, '0', '0']
  ])('clamps %s to %s%%', (value, now, fill) => {
    const wrapper = meter(value)
    expect(wrapper.attributes('aria-valuenow')).toBe(now)
    expect(wrapper.find('.kd-meter__fill').attributes('style')).toContain(
      `--kd-meter-value: ${fill}`
    )
  })
})

describe('KdLog', () => {
  it('renders coloured spans line by line', () => {
    const wrapper = mount(KdLog, { props: { lines: ['\x1b[0;31mE oops\x1b[0m', 'plain'] } })
    expect(wrapper.element.tagName).toBe('PRE')
    expect(wrapper.attributes('role')).toBe('log')
    expect(wrapper.find('span.kd-ansi-31').text()).toBe('E oops')
    expect(wrapper.text()).toBe('E oops\nplain')
  })

  it('follows new lines to the bottom', async () => {
    const wrapper = mount(KdLog, { props: { lines: ['a'] }, attachTo: document.body })
    Object.defineProperty(wrapper.element, 'scrollHeight', { value: 500, configurable: true })
    await wrapper.setProps({ lines: ['a', 'b'] })
    await nextTick()
    expect(wrapper.element.scrollTop).toBe(500)
    wrapper.unmount()
  })
})

describe('KdMarquee', () => {
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
    stubLayout('scrollWidth', (el) => (el.classList.contains('kd-marquee__content') ? 300 : 0))
    stubLayout('clientWidth', (el) => (el.classList.contains('kd-marquee') ? 100 : 0))
    const wrapper = mount(KdMarquee, {
      props: { title: 'Xtal · Aphex Twin' },
      slots: { default: 'Xtal · Aphex Twin' }
    })
    await nextTick()
    expect(wrapper.attributes('data-overflowing')).toBe('')
    expect(wrapper.attributes('title')).toBe('Xtal · Aphex Twin')
    expect(wrapper.find('.kd-marquee__content').text()).toBe('Xtal · Aphex Twin')
  })

  it('stays unmasked and untitled when the text fits', () => {
    const wrapper = mount(KdMarquee, { props: { title: 'Short' }, slots: { default: 'Short' } })
    expect(wrapper.attributes('data-overflowing')).toBeUndefined()
    expect(wrapper.attributes('title')).toBeUndefined()
  })
})
