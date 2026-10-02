import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tokens } from '../tokens/tokens'
import { renderTailwindTheme, renderTokensCss } from './lib/render-tokens'

const root = join(import.meta.dir, '..')
writeFileSync(join(root, 'css/tokens.css'), renderTokensCss(tokens))
writeFileSync(join(root, 'tailwind/theme.css'), renderTailwindTheme(tokens))
console.log('wrote css/tokens.css and tailwind/theme.css')
