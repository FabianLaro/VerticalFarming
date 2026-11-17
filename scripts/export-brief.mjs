import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173'
const installedChrome = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1228/chrome-win64/chrome.exe')
const executablePath = process.env.PLAYWRIGHT_BROWSER_PATH || (existsSync(chromium.executablePath()) ? chromium.executablePath() : installedChrome)
await mkdir('output/pdf', { recursive: true })
const args = process.env.PLAYWRIGHT_SOFTWARE_RENDERING === '1' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []
const browser = await chromium.launch({ executablePath, headless: true, args })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    return ['localhost', '127.0.0.1'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol) ? route.continue() : route.abort('internetdisconnected')
  })
  const page = await context.newPage()
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.locator('.main-nav').getByRole('button', { name: /Entscheiden/ }).click()
  await page.getByRole('button', { name: 'Decision Brief als PDF drucken', exact: true }).waitFor()
  await page.waitForFunction(() => !document.querySelector('.decision-export .primary-button')?.disabled)
  // innerText counts separately laid-out headings/captions instead of joining text nodes.
  await page.emulateMedia({ media: 'print' })
  const text = await page.locator('#decision-brief').innerText()
  const words = text.trim().split(/\s+/u).length
  assert.ok(words <= 450, `${words} Wörter überschreiten die Vorgabe`)
  assert.match(text, /156/)
  assert.match(text, /2\.600/)
  assert.match(text, /1\.560/)
  assert.match(text, /Reinigung\/Vorketten/)
  await page.pdf({ path: 'output/pdf/decision-brief-basis.pdf', preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false })
  const measured = await page.locator('#decision-brief').evaluate(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))
  await writeFile('output/pdf/export-pruefung.json', JSON.stringify({ baseURL, words, printPixels: measured, maxContentHeight: 273 * 96 / 25.4, state: 'Basisszenario und bearbeitbare Beispielposition B', internet: 'Externe Anfragen blockiert' }, null, 2) + '\n')
  console.log(JSON.stringify({ output: 'output/pdf/decision-brief-basis.pdf', words, measured }))
} finally { await browser.close() }
