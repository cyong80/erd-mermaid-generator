import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const buildDir = join(__dirname, '..', 'build')
const svgPath = join(buildDir, 'icon.svg')
const pngPath = join(buildDir, 'icon.png')

const svg = readFileSync(svgPath)
await sharp(svg)
  .resize(1024, 1024)
  .png()
  .toFile(pngPath)

console.log('✓ build/icon.png generated from icon.svg')
