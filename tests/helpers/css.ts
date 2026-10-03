export {
  classNames,
  customPropertyDeclarations,
  keyframeNames,
  propertyNames,
  stripNoise
} from '../../scripts/lib/css-scan'
import { stripNoise } from '../../scripts/lib/css-scan'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

// Preludes of top-level statements and blocks, e.g. "@layer components" or "@import """.
export function topLevelPreludes(css: string): string[] {
  const preludes: string[] = []
  let depth = 0
  let buffer = ''
  for (const char of stripNoise(css)) {
    if (depth === 0) {
      if (char === '{') {
        preludes.push(buffer.trim())
        buffer = ''
        depth = 1
      } else if (char === ';') {
        preludes.push(`${buffer.trim()};`)
        buffer = ''
      } else {
        buffer += char
      }
    } else if (char === '{') {
      depth++
    } else if (char === '}') {
      depth--
    }
  }
  return preludes.filter((prelude) => prelude !== '' && prelude !== ';')
}

export function listCssFiles(root: string): string[] {
  return readdirSync(join(root, 'css'), { recursive: true })
    .map(String)
    .filter((file) => file.endsWith('.css'))
    .map((file) => `css/${file}`)
}

export interface CssRule {
  /** Normalised selectors of the rule (the comma-separated list, split). */
  selectors: string[]
  /** Preludes of the enclosing at-rules, outermost first, e.g. "@layer components". */
  within: string[]
  /** Declarations written directly in this rule's block (nested rules excluded). */
  declarations: Record<string, string>
}

const squash = (text: string) => text.replace(/\s+/g, ' ').trim()

function splitList(prelude: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote = ''
  let buffer = ''
  for (const char of prelude) {
    if (quote) {
      if (char === quote) quote = ''
    } else if (char === '"' || char === "'") quote = char
    else if (char === '(' || char === '[') depth++
    else if (char === ')' || char === ']') depth--
    if (char === ',' && depth === 0 && !quote) {
      parts.push(squash(buffer))
      buffer = ''
    } else buffer += char
  }
  parts.push(squash(buffer))
  return parts.filter(Boolean)
}

function parseDeclarations(text: string): Record<string, string> {
  const declarations: Record<string, string> = {}
  let depth = 0
  let quote = ''
  let buffer = ''
  const flush = () => {
    const at = buffer.indexOf(':')
    if (at > 0) declarations[squash(buffer.slice(0, at))] = squash(buffer.slice(at + 1))
    buffer = ''
  }
  for (const char of text) {
    if (quote) {
      if (char === quote) quote = ''
    } else if (char === '"' || char === "'") quote = char
    else if (char === '(') depth++
    else if (char === ')') depth--
    if (char === ';' && depth === 0 && !quote) flush()
    else buffer += char
  }
  flush()
  return declarations
}

/** Every style rule in the sheet, with its at-rule ancestry. Comments are dropped. */
export function parseRules(css: string): CssRule[] {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules: CssRule[] = []
  const walk = (start: number, within: string[]): number => {
    let i = start
    let head = ''
    let quote = ''
    let paren = 0
    while (i < source.length) {
      const char = source[i]!
      if (quote) {
        if (char === quote) quote = ''
        head += char
      } else if (char === '"' || char === "'") {
        quote = char
        head += char
      } else if (char === '(') {
        paren++
        head += char
      } else if (char === ')') {
        paren--
        head += char
      } else if (char === ';' && paren === 0) {
        head = ''
      } else if (char === '{' && paren === 0) {
        const prelude = squash(head)
        head = ''
        if (prelude.startsWith('@')) {
          if (/^@(keyframes|font-face|property)\b/.test(prelude)) {
            i = skip(i + 1)
          } else {
            i = walk(i + 1, [...within, prelude])
          }
        } else {
          const end = skip(i + 1)
          const body = source.slice(i + 1, end - 1)
          rules.push({
            selectors: splitList(prelude),
            within,
            declarations: parseDeclarations(stripNested(body))
          })
          i = end
        }
        continue
      } else if (char === '}' && paren === 0) {
        return i + 1
      } else head += char
      i++
    }
    return i
  }
  const skip = (from: number): number => {
    let depth = 1
    let i = from
    while (i < source.length && depth > 0) {
      if (source[i] === '{') depth++
      else if (source[i] === '}') depth--
      i++
    }
    return i
  }
  const stripNested = (body: string) => {
    let out = ''
    let depth = 0
    for (const char of body) {
      if (char === '{') depth++
      else if (char === '}') depth--
      else if (depth === 0) out += char
    }
    return out
  }
  walk(0, [])
  return rules
}

/**
 * Declarations of the rule(s) whose selector list contains `selector` exactly, merged in source
 * order. `within` lists the non-@layer at-rule ancestors the rule must sit in, outermost first,
 * each compared exactly (e.g. "@media (min-width: 640px)"); omit it for rules outside any @media.
 * Throws when nothing matches, so a renamed selector fails loudly.
 */
export function ruleBody(
  css: string,
  selector: string,
  within: string[] = []
): Record<string, string> {
  const wanted = squash(selector)
  const media = (rule: CssRule) => rule.within.filter((p) => !p.startsWith('@layer'))
  const matches = parseRules(css).filter(
    (rule) =>
      rule.selectors.includes(wanted) &&
      media(rule).length === within.length &&
      within.every((p, i) => media(rule)[i] === p)
  )
  if (matches.length === 0) {
    throw new Error(
      `no rule for "${selector}"${within.length ? ` within ${within.join(' > ')}` : ''}`
    )
  }
  return Object.assign({}, ...matches.map((rule) => rule.declarations))
}
