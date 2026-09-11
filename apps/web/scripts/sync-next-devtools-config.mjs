import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'next-devtools-config.json')
const targetDir = join(root, '.next', 'cache')
const target = join(targetDir, 'next-devtools-config.json')

try {
  const config = await readFile(source, 'utf8')
  await mkdir(targetDir, { recursive: true })
  await writeFile(target, config)
} catch {
  
}
