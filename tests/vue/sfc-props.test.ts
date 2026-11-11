// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const DIR = join(process.cwd(), 'vue/components')
const files = readdirSync(DIR).filter((file) => file.endsWith('.vue'))

// @vue/compiler-sfc can only expand an imported or intersected props type when TypeScript is
// installed, so every component declares its props as a literal type.
describe('component props', () => {
  it.each(files)('%s declares defineProps with an inline literal type', (file) => {
    const source = readFileSync(join(DIR, file), 'utf8')
    const match = /defineProps<\s*([\s\S]*?)>\(/.exec(source)
    if (!match) return
    expect(match[1]!.trimStart().startsWith('{'), match[1]!.slice(0, 60)).toBe(true)
    expect(match[1]!.trimEnd().endsWith('}'), match[1]!.slice(-60)).toBe(true)
  })
})

// defineModel/defineSlots generics follow the same rule: inline literal, primitive, the SFC's
// own generic parameter, or a union of those with null/undefined.
const SAFE_GENERIC =
  /^(\{[\s\S]*\}|string|number|boolean|[A-Z][A-Za-z0-9]?)(\s*\|\s*(null|undefined|string|number|boolean|\{[\s\S]*\}))*$/

describe('component models and slots', () => {
  it.each(files)('%s uses only inline or primitive defineModel/defineSlots generics', (file) => {
    const source = readFileSync(join(DIR, file), 'utf8')
    for (const match of source.matchAll(/define(?:Model|Slots)<([\s\S]*?)>\(/g)) {
      expect(match[1]!.trim(), `${file}: ${match[1]}`).toMatch(SAFE_GENERIC)
    }
  })
})
