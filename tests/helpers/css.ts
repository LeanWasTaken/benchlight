import { readdirSync } from 'node:fs'
import { join } from 'node:path'

// Removes comments, strings and url() bodies so selectors can be scanned with regexes.
export function stripNoise(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/url\([^)]*\)/g, 'url()')
    .replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, '""')
}

export const classNames = (css: string) =>
  [...stripNoise(css).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]!)

export const customPropertyDeclarations = (css: string) =>
  [...stripNoise(css).matchAll(/(?:^|[{;\s])(--[\w-]+)\s*:/g)].map((m) => m[1]!)

export const keyframeNames = (css: string) =>
  [...stripNoise(css).matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]!)

export const propertyNames = (css: string) =>
  [...stripNoise(css).matchAll(/@property\s+(--[\w-]+)/g)].map((m) => m[1]!)

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
