// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ruleBody } from './css'

const sheet = `
@layer components {
  /* a { color: red } */
  .a, .b:has(input[value='x']) { color: red; background: url("a;b.png") }
  .a { color: blue }
  @media (min-width: 640px) {
    .a { display: none }
  }
  @media (max-width: 100px) {
    .a { display: block }
  }
  @keyframes k { from { color: red } }
}`

describe('ruleBody', () => {
  it('merges exact-selector rules outside any @media, last write wins', () => {
    expect(ruleBody(sheet, '.a')).toEqual({ color: 'blue', background: 'url("a;b.png")' })
  })
  it('matches one entry of a selector list, including attribute selectors', () => {
    expect(ruleBody(sheet, ".b:has(input[value='x'])")['color']).toBe('red')
  })
  it('scopes to @media and ignores other contexts', () => {
    expect(ruleBody(sheet, '.a', ['@media (min-width: 640px)'])).toEqual({ display: 'none' })
  })
  it('throws on a missing selector', () => {
    expect(() => ruleBody(sheet, '.missing')).toThrow(/no rule/)
    expect(() => ruleBody(sheet, '.b', ['@media (min-width: 640px)'])).toThrow(/no rule/)
  })
})
