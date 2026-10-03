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
