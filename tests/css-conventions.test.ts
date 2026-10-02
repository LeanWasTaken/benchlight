// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'
import { describe, expect, it } from 'vitest'
import { MODULES } from '../scripts/lib/modules'
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

  it('prefixes every class with kd-', () => {
    for (const name of classNames(css)) expect(name).toMatch(/^kd-/)
  })

  it('prefixes every custom property, keyframe and @property with kd', () => {
    for (const name of customPropertyDeclarations(css)) expect(name).toMatch(/^--kd-/)
    for (const name of keyframeNames(css)) expect(name).toMatch(/^kd-/)
    for (const name of propertyNames(css)) expect(name).toMatch(/^--kd-/)
  })

  it('keeps every rule inside a cascade layer', () => {
    for (const prelude of topLevelPreludes(css))
      expect(prelude).toMatch(/^@(layer|property|import)\b/)
  })
})
