// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'
import { describe, expect, it } from 'vitest'
import { stripNoise } from '../scripts/lib/css-scan'
import { MODULES } from '../scripts/lib/modules'
import { tokens } from '../tokens/tokens'
import {
  classNames,
  customPropertyDeclarations,
  keyframeNames,
  listCssFiles,
  propertyNames,
  topLevelPreludes
} from './helpers/css'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')
const layered = listCssFiles(ROOT).filter((file) => file !== 'css/fonts.css')

describe('module registry', () => {
  it.each(Object.entries(MODULES))('%s exists at %s', (_name, path) => {
    expect(existsSync(join(ROOT, path))).toBe(true)
  })

  it('css/index.css imports exactly the registered modules, in order', () => {
    const imports = [...read('css/index.css').matchAll(/@import '\.\/(.+?)';/g)].map(
      (m) => `css/${m[1]}`
    )
    expect(imports).toEqual(Object.values(MODULES))
  })
})

describe.each(layered)('%s', (file) => {
  const css = read(file)

  it('parses as valid CSS', () => {
    expect(() =>
      transform({ filename: file, code: Buffer.from(css), errorRecovery: false })
    ).not.toThrow()
  })

  it('prefixes every class with bl-', () => {
    for (const name of classNames(css)) expect(name).toMatch(/^bl-/)
  })

  it('prefixes every custom property, keyframe and @property with bl', () => {
    for (const name of customPropertyDeclarations(css)) expect(name).toMatch(/^--bl-/)
    for (const name of keyframeNames(css)) expect(name).toMatch(/^bl-/)
    for (const name of propertyNames(css)) expect(name).toMatch(/^--bl-/)
  })

  it('keeps every rule inside a cascade layer', () => {
    for (const prelude of topLevelPreludes(css))
      expect(prelude).toMatch(/^@(layer|property|import)\b/)
  })
})

describe('media query units', () => {
  const tokenEm = new Set(
    Object.values(tokens.breakpoint).flatMap((px) => {
      const em = parseFloat(px) / 16
      return [`${em}em`, `${+(em - 0.01).toFixed(2)}em`]
    })
  )

  it('tokenises the xs breakpoint at 480px', () => {
    expect(tokens.breakpoint.xs).toBe('480px')
  })

  it.each(layered)('%s uses no px width in media or container queries', (file) => {
    const queries = [...stripNoise(read(file)).matchAll(/@(?:media|container)[^{]*/g)].map(
      (m) => m[0]
    )
    for (const query of queries) expect(query).not.toMatch(/\d\s*px/)
  })

  it.each(layered)('%s width media queries match a breakpoint token', (file) => {
    const widths = [
      ...stripNoise(read(file)).matchAll(
        /@(?:media|container)[^{]*?\((?:min|max)-width:\s*([\d.]+em)\)/g
      )
    ].map((m) => m[1])
    for (const width of widths) expect(tokenEm.has(width!), `${file}: ${width}`).toBe(true)
  })
})
