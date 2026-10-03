import { describe, expect, it } from 'vitest'
import * as kdesign from '../../vue'

const COMPONENTS = [
  'KdAppearanceSwitch',
  'KdButton',
  'KdColophon',
  'KdEqBars',
  'KdField',
  'KdIndex',
  'KdIndexRow',
  'KdInput',
  'KdLed',
  'KdLinkArrow',
  'KdLog',
  'KdMarquee',
  'KdMeta',
  'KdMeter',
  'KdMsg',
  'KdNavLink',
  'KdPrevNext',
  'KdProse',
  'KdRange',
  'KdReadout',
  'KdSectionHead',
  'KdSegmented',
  'KdSelect',
  'KdSiteBar',
  'KdSkipLink',
  'KdSpecPanel',
  'KdSpecRow',
  'KdTabBar',
  'KdTabBarItem',
  'KdTelemetry',
  'KdTelemetryCell'
]

const HELPERS = [
  'useAppearance',
  'useScrollLifted',
  'useReducedMotion',
  'useMarquee',
  'riseDelay',
  'ansiToSegments',
  'APPEARANCE_ATTRIBUTE',
  'APPEARANCE_STORAGE_KEY'
]

describe('kdesign/vue', () => {
  it('exports every component', () => {
    for (const name of COMPONENTS) expect(kdesign, name).toHaveProperty(name)
  })

  it('exports every composable and helper', () => {
    for (const name of HELPERS) expect(kdesign, name).toHaveProperty(name)
  })

  it('exports nothing unexpected', () => {
    expect(Object.keys(kdesign).sort()).toEqual([...COMPONENTS, ...HELPERS].sort())
  })
})
