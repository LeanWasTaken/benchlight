import { describe, expect, it } from 'vitest'
import * as benchlight from '../../vue'

const COMPONENTS = [
  'BlAppearanceSwitch',
  'BlButton',
  'BlColophon',
  'BlEqBars',
  'BlField',
  'BlIndex',
  'BlIndexRow',
  'BlInput',
  'BlLed',
  'BlLinkArrow',
  'BlLog',
  'BlMarquee',
  'BlMeta',
  'BlMeter',
  'BlMsg',
  'BlPagination',
  'BlNavLink',
  'BlPrevNext',
  'BlProse',
  'BlRange',
  'BlReadout',
  'BlSectionHead',
  'BlSegmented',
  'BlSelect',
  'BlSiteBar',
  'BlSkipLink',
  'BlSpecPanel',
  'BlSpecRow',
  'BlTabBar',
  'BlTabBarItem',
  'BlTable',
  'BlToggle',
  'BlMedia',
  'BlTelemetry',
  'BlTelemetryCell'
]

const HELPERS = [
  'useAppearance',
  'useScrollLifted',
  'useReducedMotion',
  'useMarquee',
  'useFollowScroll',
  'riseDelay',
  'ansiToSegments',
  'APPEARANCE_ATTRIBUTE',
  'APPEARANCE_STORAGE_KEY',
  'FIELD_CONTEXT'
]

describe('benchlight/vue', () => {
  it('exports every component', () => {
    for (const name of COMPONENTS) expect(benchlight, name).toHaveProperty(name)
  })

  it('exports every composable and helper', () => {
    for (const name of HELPERS) expect(benchlight, name).toHaveProperty(name)
  })

  it('exports nothing unexpected', () => {
    expect(Object.keys(benchlight).sort()).toEqual([...COMPONENTS, ...HELPERS].sort())
  })
})
