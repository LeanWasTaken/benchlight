import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderApi } from './lib/api'

const root = join(import.meta.dir, '..')
writeFileSync(join(root, 'API.md'), renderApi(root))
console.log('wrote API.md')
