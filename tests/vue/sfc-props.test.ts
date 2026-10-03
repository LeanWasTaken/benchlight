// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const DIR = join(process.cwd(), 'vue/components')
const files = readdirSync(DIR).filter((file) => file.endsWith('.vue'))

// Consumers compile these SFCs from source. @vue/compiler-sfc can only expand an imported or
// intersected props type when TypeScript is installed in the consuming app, so every component
// declares its props as a literal type.
describe('component props', () => {
  it.each(files)('%s declares defineProps with an inline literal type', (file) => {
    const source = readFileSync(join(DIR, file), 'utf8')
    const match = /defineProps<\s*([\s\S]*?)>\(/.exec(source)
    if (!match) return
    expect(match[1]!.trimStart().startsWith('{'), match[1]!.slice(0, 60)).toBe(true)
    expect(match[1]!.trimEnd().endsWith('}'), match[1]!.slice(-60)).toBe(true)
  })
})
