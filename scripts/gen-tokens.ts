import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tokens } from '../tokens/tokens'
import { renderTailwindTheme, renderTokensCss } from './lib/render-tokens'
import { tokensDeclaration } from './lib/tokens-dts'

const root = join(import.meta.dir, '..')
writeFileSync(join(root, 'css/tokens.css'), renderTokensCss(tokens))
writeFileSync(join(root, 'tailwind/theme.css'), renderTailwindTheme(tokens))
writeFileSync(join(root, 'dist/tokens.d.ts'), tokensDeclaration(root))
console.log('wrote css/tokens.css, tailwind/theme.css and dist/tokens.d.ts')
