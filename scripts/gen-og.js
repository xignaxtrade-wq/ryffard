import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const htmlPath  = join(__dirname, '..', 'public', 'og-image.html')
const outPath   = join(__dirname, '..', 'public', 'og-image.png')

const browser = await puppeteer.launch({ headless: 'new' })
const page    = await browser.newPage()
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 })
await page.goto(`file://${htmlPath}`)
await new Promise(r => setTimeout(r, 300))
await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1200, height: 630 } })
await browser.close()

console.log('✅ og-image.png generada en public/')
