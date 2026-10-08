// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOOK_ONLY_CLASSES, barrelExports, autoImports, renderApi } from '../scripts/lib/api'

const ROOT = process.cwd()

describe('API.md', () => {
  it('is fresh: run `bun run gen:api` and review the diff as the breaking-change checklist', () => {
    expect(readFileSync(join(ROOT, 'API.md'), 'utf8')).toBe(renderApi(ROOT))
  }, 120_000)
})

const api = () => readFileSync(join(ROOT, 'API.md'), 'utf8')
const slotsOf = (component: string) =>
  new RegExp(`### ${component}\\n[\\s\\S]*?\\nSlots: (.*)`).exec(api())?.[1] ?? ''

describe('API.md slots', () => {
  it('lists the BlMedia figure and aside slots', () => {
    expect(slotsOf('BlMedia')).toBe('`aside`, `default`, `figure`')
  })
  it('lists the BlDialog footer slot', () => {
    expect(slotsOf('BlDialog')).toBe('`default`, `footer`')
  })
})

describe('API.md CSS hooks', () => {
  it('leaves out properties the components set internally', () => {
    expect(api()).not.toContain('`--bl-dialog-gutter`')
  })
})

describe('Nuxt auto-imports', () => {
  it('cover every runtime helper the barrel exports', () => {
    const helpers = barrelExports(ROOT).filter(
      (name) => !name.startsWith('Bl') && name !== name.toUpperCase()
    )
    expect(autoImports(ROOT).sort()).toEqual(helpers.sort())
  })
})

const section = (heading: string) => {
  const m = new RegExp(`\\n## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`).exec(api())
  return m?.[1] ?? ''
}

describe('API.md exported types', () => {
  it('lists the types behind `export type *` and the named type exports with their shapes', () => {
    const types = section('Exported types')
    for (const name of ['TableColumn', 'ToastOptions', 'AppearanceMode', 'MarqueeOptions']) {
      expect(types).toContain(`### \`${name}\``)
    }
    expect(types).toContain("align?: 'start' | 'end' | 'center'")
    expect(types).not.toContain('FIELD_CONTEXT')
  })
})

describe('API.md tokens', () => {
  it('lists every --bl-* token declared in css/tokens.css', () => {
    const tokens = section('Tokens')
    expect(tokens).toContain('`--bl-canvas`')
    const declared = new Set(
      [...readFileSync(join(ROOT, 'css/tokens.css'), 'utf8').matchAll(/(--bl-[\w-]+)\s*:/g)].map(
        (m) => m[1]!
      )
    )
    for (const token of declared) expect(tokens).toContain(`\`${token}\``)
  })
})

describe('API.md dynamic slots and slot props', () => {
  it('lists the BlTable dynamic slot patterns and slot props', () => {
    const table = /### BlTable\n[\s\S]*?(?=\n### |\n## )/.exec(api())?.[0] ?? ''
    expect(table).toContain('Dynamic slots: `cell-<key>`, `head-<key>`')
    expect(table).toContain('`cell-<key>` `{ row: Row; value: unknown; column: TableColumn<Row> }`')
    expect(table).toContain('`head-<key>` `{ column: TableColumn<Row> }`')
    expect(table).toContain('`footer` `{ rows: Row[]; }`')
  })
  it('lists the BlField slot props', () => {
    expect(api()).toMatch(/### BlField\n[\s\S]*?Slot props: `default` `\{ id: string; describedBy/)
  })
})

describe('API.md attributes and hook-only classes', () => {
  it('lists script-set data-* attributes', () => {
    const attrs = section('Script-set data attributes')
    for (const a of ['data-stacked', 'data-measuring', 'data-lifted', 'data-bl-appearance']) {
      expect(attrs).toContain(`\`${a}\``)
    }
  })
  it('lists the hook-only pagination classes', () => {
    const hooks = section('Hook-only classes')
    expect(hooks).toContain('`bl-pagination__prev`')
    expect(hooks).toContain('`bl-pagination__next`')
  })
  it('lists the BlRange input hook class', () => {
    expect(section('Hook-only classes')).toContain('`bl-range__input`')
  })
  it('renders every hook-only class from some component', () => {
    const dir = join(ROOT, 'vue/components')
    const sources = readdirSync(dir)
      .filter((f) => f.endsWith('.vue'))
      .map((f) => readFileSync(join(dir, f), 'utf8'))
      .join('\n')
    for (const cls of HOOK_ONLY_CLASSES) expect(sources, cls).toContain(cls)
  })
})

describe('BlMedia defaults', () => {
  it('shows the as and align defaults', () => {
    const media = /### BlMedia\n[\s\S]*?(?=\n### )/.exec(api())?.[0] ?? ''
    expect(media).toMatch(/\| `align` .*`"start"`/)
    expect(media).toMatch(/\| `as` .*`"div"`/)
  })
})
