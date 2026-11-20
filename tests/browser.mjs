import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { chromium, expect } from '@playwright/test'

const baseURL = process.env.BASE_URL || process.argv[2] || 'http://127.0.0.1:5173'
const checkFilter = process.env.BROWSER_CHECK_FILTER ? new RegExp(process.env.BROWSER_CHECK_FILTER, 'u') : null
const output = 'tmp/qa'
await fs.mkdir(output, { recursive: true })
const installedChrome = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1228/chrome-win64/chrome.exe')
const executablePath = process.env.PLAYWRIGHT_BROWSER_PATH || (existsSync(chromium.executablePath()) ? chromium.executablePath() : installedChrome)
const args = process.env.PLAYWRIGHT_SOFTWARE_RENDERING === '1' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []
const browser = await chromium.launch({ executablePath, headless: true, args })
const errors = []
const externalRequests = []
const localAssetStatuses = {}
const report = { date: new Date().toISOString().slice(0, 10), baseURL, browser: await browser.version(), checks: [], errors, externalRequests, localAssetStatuses }

async function context(options = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options })
  // Simulate no access to the internet while retaining the explicitly local server.
  await ctx.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.origin === new URL(baseURL).origin || ['data:', 'blob:'].includes(url.protocol)) return route.continue()
    externalRequests.push(url.href)
    return route.abort('internetdisconnected')
  })
  ctx.on('page', page => {
    page.setDefaultTimeout(10000)
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('response', response => {
      const url = new URL(response.url())
      if (/\/(?:models\/[^/]+\.glb|renders\/[^/]+\.(?:png|webp))$/u.test(url.pathname)) localAssetStatuses[url.pathname] = response.status()
    })
  })
  return ctx
}
async function check(name, run) {
  if (checkFilter && !checkFilter.test(name)) return
  try { await run(); report.checks.push({ name, passed: true }); console.log(`OK ${name}`) }
  catch (error) { report.checks.push({ name, passed: false, error: error.stack || String(error) }); console.error(`FEHLER ${name}: ${error.message}`) }
}
async function nav(page, name, { manual = true } = {}) {
  await page.getByRole('navigation', { name: 'Bereiche' }).getByRole('button', { name, exact: true }).click()
  if (name === 'Entscheidung' && manual) {
    const toggle = page.getByRole('button', { name: /^(Brief manuell bearbeiten|Manuellen Brief öffnen)$/u })
    if (await toggle.isVisible()) await toggle.click()
  }
}
async function load(page) {
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: 'Soll Dinslaken Vertical Farming fördern?' })).toBeVisible()
}
async function screenshot(page, name) { await page.screenshot({ path: `${output}/browser-${name}.png`, fullPage: true }) }
async function openDetails(details) {
  if (!(await details.evaluate(element => element.open))) await details.locator(':scope > summary').click()
}
async function assertLateCloseKeepsReopenedDialog(dialog) {
  // Native close events are queued; an old event must not dismiss a new opening.
  await dialog.evaluate(element => new Promise(resolve => {
    element.addEventListener('close', () => requestAnimationFrame(() => requestAnimationFrame(resolve)), { once: true })
    element.close()
    element.showModal()
  }))
  await expect(dialog, 'Ein verspätetes Close-Event darf einen neu geöffneten Dialog nicht schließen').toBeVisible()
}
async function assertCommonAreaScale(page, areas = [1000, 156000 / 29.05, 156000 / 8.9]) {
  const scene = page.locator('.comparison-scene')
  await expect(scene).toHaveAttribute('data-ready', 'true')
  await expect.poll(async () => {
    const grounds = JSON.parse(await scene.getAttribute('data-world-footprints'))
    return grounds.length === 3 && grounds.every((ground, i) => Math.abs(ground.width * ground.depth - areas[i]) < areas[i] * 1e-6)
  }).toBe(true)
  const grounds = JSON.parse(await scene.getAttribute('data-world-footprints'))
  const projection = grounds[0].pixelWidth / grounds[0].width
  grounds.forEach(ground => {
    assert.ok(Math.abs(ground.width - ground.depth) < 1e-6, 'Alle Parzellen bleiben quadratisch')
    assert.ok(Math.abs(ground.pixelWidth / ground.width - projection) < 1e-5, 'Alle Modelle teilen denselben projizierten Metermaßstab')
  })
  const ruler = page.locator('.comparison-scale')
  const metres = Number(await ruler.getAttribute('data-metres'))
  const pixels = Number(await ruler.getAttribute('data-pixels'))
  assert.ok(Math.abs(pixels / metres - projection) < 1e-5, 'Maßstabsbalken entspricht der tatsächlichen Kameraprojektion')
  await expect.poll(() => ruler.evaluate(element => Math.abs(element.querySelector('path').getBoundingClientRect().width - Number(element.dataset.pixels))), { message: 'Sichtbare Linienlänge entspricht nach dem Kamera-Update den kalibrierten Pixeln' }).toBeLessThan(.1)
  const stageBox = await page.locator('.comparison-stage').boundingBox()
  const rulerBox = await ruler.boundingBox()
  assert.ok(Math.abs(stageBox.x + stageBox.width - rulerBox.x - rulerBox.width - 10) < 1, 'Maßstab steht rechts in der Ecke')
  assert.ok(Math.abs(stageBox.y + stageBox.height - rulerBox.y - rulerBox.height - 10) < 1, 'Maßstab steht unten in der Ecke')
  await expect(page.getByRole('button', { name: 'Grundriss', exact: true })).toHaveCount(0)
  await expect(page.locator('.comparison-plan')).toHaveCount(0)
}
const ctx = await context()
const page = await ctx.newPage()
if (checkFilter) await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
else await load(page)

await check('Standort zeigt ein lokales Renderbild und lädt WebGL auf Anfrage', async () => {
  await nav(page, 'Standort')
  await expect(page.locator('.atlas-model-picture img')).toHaveAttribute('src', './renders/vertical-farm-poster.webp')
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.locator('.atlas-land-key')).toContainText('1.000 → 2.600 m²')
  await page.locator('.atlas-notes').getByRole('button', { name: 'Wasser' }).click()
  await expect(page.getByRole('heading', { name: 'Ein Kreislauf mit Zuflüssen' })).toBeVisible()
  await screenshot(page, 'desktop-standort')
  await page.getByRole('button', { name: '3D öffnen', exact: true }).click()
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  assert.ok(await canvas.evaluate(element => !!element.getContext('webgl2')), 'WebGL-Modell muss verfügbar sein')
  for (const model of ['lettuce', 'rack-tier', 'tank', 'pump', 'air-handler', 'harvest-cart']) {
    await expect.poll(() => localAssetStatuses[`/models/${model}.glb`]).toBe(200)
  }
})

await check('Vergleich zeigt bei gleicher Ernte maßstäbliche 2D-Flächen und echte Datenlücken', async () => {
  await nav(page, 'Vergleich')
  const graphic = page.getByTestId('comparison-graphic')
  await expect(graphic.locator('.atlas-comparison-label strong')).toHaveText(['1.000 m²', '5.370 m²', '17.528 m²'])
  await expect(page.locator('canvas')).toHaveCount(0)
  const squareWidths = await graphic.locator('.atlas-square-frame > div').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width))
  assert.ok(Math.abs((squareWidths[0] / squareWidths[2]) ** 2 - 1000 / (156000 / 8.9)) < .003)
  await screenshot(page, 'desktop-vergleich')
  await page.getByRole('button', { name: 'Gleiche Grundfläche' }).click()
  await expect(graphic.locator('.atlas-comparison-label strong')).toHaveText(['156 t/Jahr', '29,1 t/Jahr', '8,9 t/Jahr'])
  await openDetails(page.locator('.comparison-data'))
  await expect(page.locator('.comparison-table tr').filter({ hasText: 'Energie · kWh/Jahr' }).getByText('Datenlücke')).toHaveCount(2)
  await page.getByRole('button', { name: 'Gleiche Jahresernte' }).click()
  await openDetails(page.locator('.atlas-compare-3d'))
  await assertCommonAreaScale(page)
})

await check('Szenarien, Klimatest und Reset ändern nur die vorgesehenen Eingaben', async () => {
  await nav(page, 'Vergleich')
  const preset = page.getByTestId('preset')
  const harvest = page.getByTestId('harvest')
  const energy = page.getByTestId('energy')
  const climate = page.locator('.atlas-climate')
  await preset.selectOption('levels')
  await expect(harvest).toContainText('234')
  await expect(energy).toContainText('2.340')
  await page.getByRole('button', { name: 'Strommix testen' }).click()
  await expect(harvest).toContainText('234')
  await expect(energy).toContainText('2.340')
  await expect(climate).toContainText('0,5 kg CO₂eq/kg')
  await preset.selectOption('price')
  await expect(harvest).toContainText('156')
  await expect(energy).toContainText('1.560')
  await expect(page.getByTestId('cost')).toContainText('4 €/kg')
  await page.getByRole('button', { name: 'Basisszenario wiederherstellen' }).click()
  await expect(page.getByTestId('cost')).toContainText('2,5 €/kg')
  await expect(climate).toContainText('4,06 kg CO₂eq/kg')
  await openDetails(page.locator('.atlas-research'))
  await expect(page.locator('.atlas-research li')).toHaveCount(6)
  await openDetails(page.locator('.atlas-evidence'))
  await expect(page.locator('.m3-chart b')).toHaveText(['0,13', '0,08'])
})

await check('Quellendialog: Original-URLs, Fundstellen und Escape-Taste', async () => {
  await page.locator('.atlas-actions').getByRole('button', { name: 'Quellen', exact: true }).click()
  const dialog = page.getByRole('dialog')
  assert.ok(await dialog.isVisible())
  const urls = await dialog.locator('a[href]').evaluateAll(links => links.map(link => link.href))
  assert.ok(urls.some(url => url.includes('10.1007/s13593-025-01055-w')))
  assert.ok(urls.some(url => url.includes('10.1016/j.jclepro.2024.142359')))
  assert.equal(await dialog.locator('.source-card[open]').count(), 0, 'Die Quellenübersicht beginnt mit geschlossenen Einträgen')
  assert.equal(await dialog.locator('.assumption-summary[open]').count(), 0)
  const pennisi = dialog.locator('.source-card').filter({ has: page.locator('summary > strong', { hasText: 'Pennisi et al. 2025' }) })
  await openDetails(pennisi)
  await expect(pennisi.locator('a').first()).toBeVisible()
  assert.ok((await dialog.innerText()).includes('Fundstelle'))
  await assertLateCloseKeepsReopenedDialog(dialog)
  await page.keyboard.press('Escape')
  assert.equal(await dialog.isVisible(), false)
})

await check('Strukturiertes Datenverzeichnis exportiert Quellen, Metadaten und aktuellen Szenariostand lokal', async () => {
  await nav(page, 'Vergleich')
  await page.getByTestId('preset').selectOption('price')
  await page.locator('.atlas-actions').getByRole('button', { name: 'Quellen', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Strukturiertes Datenverzeichnis speichern', exact: true }).click()
  const download = await downloadPromise
  assert.equal(download.suggestedFilename(), 'stadtlabor-daten-und-quellen.json')
  const downloaded = JSON.parse(await fs.readFile(await download.path(), 'utf8'))
  assert.equal(downloaded.currentScenario.input.electricityPrice, 0.4)
  assert.equal(downloaded.currentScenario.result.electricityCost, 624000)
  assert.equal(downloaded.currentScenario.result.harvest, 156000)
  assert.ok(downloaded.sources.some(source => source.id === 'pennisi2025'))
  assert.ok(downloaded.sources.some(source => source.id === 'blom2022'))
  assert.ok(downloaded.data.some(datum => datum.id === 'gh-yield' && datum.value === 29.05))
  assert.ok(downloaded.data.some(datum => datum.id === 'gridFactor' && datum.unit === 'kg CO₂eq/kWh'))
  assert.ok(downloaded.data.every(datum => downloaded.sources.some(source => source.id === datum.sourceId)))
  assert.equal(downloaded.results.electricityCost.unit, '€/Jahr')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Basisszenario wiederherstellen' }).click()
})

await check('Fragenkatalog begründet einen Pilot und öffnet die Quelle direkt im Brief', async () => {
  const quizContext = await context()
  const qp = await quizContext.newPage()
  await load(qp)
  await nav(qp, 'Entscheidung', { manual: false })
  const next = qp.getByRole('button', { name: 'Weiter', exact: true })
  await expect(next).toBeDisabled()
  await qp.getByRole('button', { name: 'Verlässliche lokale Versorgung', exact: true }).click()
  await next.click()
  await qp.getByRole('button', { name: 'Trifft zu', exact: true }).click()
  await next.click()
  await qp.reload({ waitUntil: 'domcontentloaded' })
  await expect(qp.getByText('Frage 3 von 8', { exact: true })).toBeVisible()
  const answers = ['Unklar', 'Unklar', 'Bis 3 €/kg', 'Beide Strommixe vergleichen', 'Unklar', 'Nachweise fehlen']
  for (const [index, answer] of answers.entries()) {
    if (index === 2) await expect(qp.locator('.funding-model-note')).toContainText('2,5 €/kg')
    if (index === 3) {
      await expect(qp.locator('.funding-model-note')).toContainText('4,06 kg CO₂eq/kg')
      await expect(qp.locator('.funding-model-note')).toContainText('0,5 kg CO₂eq/kg')
    }
    await qp.getByRole('button', { name: answer, exact: true }).click()
    if (index < answers.length - 1) await next.click()
  }
  await qp.getByRole('button', { name: 'Decision Brief erstellen', exact: true }).click()
  await expect(qp.getByRole('heading', { name: 'Befristete Pilotförderung', exact: true })).toBeVisible()
  const brief = qp.getByRole('article', { name: 'Druckbarer Decision Brief' })
  await expect(brief).toContainText('Eure Standortangaben')
  await expect(brief).toContainText('Prüfgrenze 3 €/kg eingehalten')
  await expect(brief).toContainText('4,06 kg CO₂eq/kg')
  await expect(qp.getByRole('button', { name: 'PDF drucken', exact: true })).toBeEnabled()
  await brief.getByRole('button', { name: 'Quelle Pennisi et al. 2025', exact: true }).first().click()
  await expect(qp.getByRole('dialog')).toContainText('Abb. 3, S. 5')
  await qp.keyboard.press('Escape')
  await qp.reload({ waitUntil: 'domcontentloaded' })
  await expect(brief).toBeVisible()
  await qp.getByRole('button', { name: 'Antworten ändern', exact: true }).click()
  await expect(qp.getByText('Frage 1 von 8', { exact: true })).toBeVisible()
  await expect(qp.getByRole('button', { name: 'Verlässliche lokale Versorgung', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await quizContext.close()
})

await check('Entscheidung: zwei Prioritäten, persistente Bearbeitung und Exportvalidierung', async () => {
  await nav(page, 'Entscheidung')
  await openDetails(page.locator('.decision-priorities'))
  const exportButton = page.getByRole('button', { name: 'PDF drucken', exact: true })
  await expect(exportButton).toBeEnabled()
  assert.equal(await page.locator('.priority-choices input:checked').count(), 2)
  const checkbox = page.locator('.priority-choices input').nth(1)
  await checkbox.uncheck()
  await expect(exportButton).toBeDisabled()
  await page.locator('.priority-choices input').nth(1).check()
  await expect(exportButton).toBeEnabled()
  const recommendation = page.locator('.decision-field').filter({ hasText: /^Empfehlung mit wichtigster Begründung/ }).locator('textarea')
  const originalRecommendation = await recommendation.inputValue()
  const revised = 'Die Stadt sollte ein offenes Pilotprojekt mit belegten Abnehmern fördern.'
  await recommendation.fill(revised)
  await nav(page, 'Standort')
  await nav(page, 'Entscheidung')
  assert.equal(await recommendation.inputValue(), revised)
  await openDetails(page.locator('.decision-priorities'))
  await recommendation.fill(originalRecommendation)
  await recommendation.fill('W '.repeat(110).trim() + '.')
  await expect(exportButton, 'Überlanger Brief muss Export blockieren').toBeDisabled()
  await recommendation.fill(originalRecommendation)
  await expect(exportButton).toBeEnabled()
  await recommendation.fill('Erster Satz. Zweiter Satz.')
  await expect(exportButton, 'Mehr als drei Sätze einschließlich Bedingungen müssen Export blockieren').toBeDisabled()
  await recommendation.fill(originalRecommendation)
  await screenshot(page, 'desktop-entscheiden')
  await page.reload({ waitUntil: 'networkidle' })
  await nav(page, 'Entscheidung')
  assert.equal(await recommendation.inputValue(), originalRecommendation)
})

await check('Quellenwechsel am Kriterium aktualisiert Beleg, Brief und Speicherung ohne eigene Aussage zu ersetzen', async () => {
  await nav(page, 'Entscheidung')
  await openDetails(page.locator('.decision-criteria'))
  const criterion = page.locator('.criterion-editor').filter({ has: page.locator('#source-environment') })
  const sourceSelect = criterion.locator('#source-environment')
  const reference = criterion.locator('.criterion-reference')
  const evidence = page.getByRole('textbox', { name: 'Beleg für Umwelt', exact: true })
  const statement = 'Die Umweltwirkung hängt vom Vergleichssystem ab.'
  const bibliography = page.locator('.brief-references')
  const briefEnvironment = page.locator('.brief-criteria > div').filter({ has: page.locator('strong', { hasText: /^Umwelt$/ }) })
  try {
    await openDetails(criterion.locator('.criterion-reference-detail'))
    await expect(reference).toBeVisible()
    await evidence.fill(statement)
    // An otherwise unused temporary source must disappear after the next selection.
    await sourceSelect.selectOption('barbosa2015')
    await expect(reference).toContainText('[AZ] Barbosa et al. 2015')
    await expect(bibliography).toContainText('[AZ] Barbosa et al. 2015')
    await sourceSelect.selectOption('blom2022')
    await expect(reference).toContainText('[B] Blom et al. 2022 · Niederlande')
    await expect(reference).toContainText('Abschnitte 2.1.1–2.1.2')
    assert.equal(await evidence.inputValue(), statement)
    await expect(briefEnvironment).toContainText('Die Umweltwirkung hängt vom Vergleichssystem ab [B].')
    await expect(briefEnvironment).not.toContainText('[P,S]')
    await expect(bibliography).toContainText('[B] Blom et al. 2022 · Niederlande')
    await expect(bibliography).toContainText('§ 2.1.1–2, S. 3; Tabellen C.1–C.2')
    await expect(bibliography).not.toContainText('[AZ]')
    await expect(bibliography).not.toContainText('Barbosa')
    await criterion.getByRole('button', { name: 'Quelle und Grenzen lesen', exact: true }).click()
    const selectedSourceDialog = page.getByRole('dialog', { name: 'Quellen und Annahmen' })
    await expect(selectedSourceDialog).toContainText('The embodied carbon emissions of lettuce production')
    await expect(selectedSourceDialog.locator('.source-card')).toHaveAttribute('open', '')
    await page.keyboard.press('Escape')
    await nav(page, 'Vergleich')
    await nav(page, 'Entscheidung')
    await openDetails(page.locator('.decision-criteria'))
    assert.equal(await sourceSelect.inputValue(), 'blom2022')
    assert.equal(await evidence.inputValue(), statement)
    await openDetails(criterion.locator('.criterion-reference-detail'))
    await expect(reference).toContainText('[B] Blom et al. 2022')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await nav(page, 'Entscheidung')
    await openDetails(page.locator('.decision-criteria'))
    assert.equal(await sourceSelect.inputValue(), 'blom2022')
    assert.equal(await evidence.inputValue(), statement)
    await openDetails(criterion.locator('.criterion-reference-detail'))
    await expect(briefEnvironment).toContainText('[B]')
    await expect(bibliography).not.toContainText('Barbosa')
    await sourceSelect.selectOption('regional')
    await expect(reference).toContainText('[R] BLE / BZL 2026')
    await expect(reference).toContainText('Klimabilanz Gemüse: Beispiel Tomaten')
    assert.equal(await evidence.inputValue(), statement)
    await expect(briefEnvironment).toContainText('Die Umweltwirkung hängt vom Vergleichssystem ab [R].')
    await expect(bibliography).toContainText('[R] BLE / BZL 2026')
    await expect(bibliography).toContainText('[B] Blom et al.')
    await screenshot(page, 'quellenwechsel')
  } finally {
    const resetSection = page.locator('.decision-details').filter({ has: page.locator('summary', { hasText: 'Name, Datum und Beispiel zurücksetzen' }) })
    if (!(await resetSection.getAttribute('open'))) await resetSection.locator('summary').click()
    await resetSection.getByRole('button', { name: 'Beispielposition wiederherstellen', exact: true }).click()
    await expect(sourceSelect).toHaveValue('stanghellini2024')
    await expect(evidence).toHaveValue('Hoher Strombedarf; Gesamtbilanz bleibt offen.')
  }
})

await check('Einseitiger Brief übernimmt den Flächenvergleich und zählt sein Drucklayout', async () => {
  await nav(page, 'Vergleich')
  await page.getByTestId('preset').selectOption('levels')
  await nav(page, 'Entscheidung')
  const exportButton = page.getByRole('button', { name: 'PDF drucken', exact: true })
  await expect(exportButton).toBeEnabled()
  const height = Number(await page.locator('.decision-panel').getAttribute('data-print-height'))
  assert.ok(height > 0 && height <= 273 * 96 / 25.4)
  const liveWords = Number((await page.locator('.atlas-preview-header span').innerText()).split(' / ')[0])
  await page.emulateMedia({ media: 'print' })
  const brief = page.locator('#decision-brief')
  await expect(brief).toContainText('m² für 234 t Salat/Jahr')
  await expect(brief.locator('.brief-chart-row strong')).toHaveText(['1.000', '8.055', '26.292'])
  const visibleWords = (await brief.innerText()).trim().split(/\s+/u).length
  assert.equal(visibleWords, liveWords)
  assert.ok(visibleWords <= 450)
  await page.pdf({ path: `${output}/browser-decision-brief.pdf`, preferCSSPageSize: true, printBackground: true })
  await page.emulateMedia({ media: 'screen' })
  await nav(page, 'Vergleich')
  await page.getByRole('button', { name: 'Basisszenario wiederherstellen' }).click()
})

await check('Vortragsmodus führt in sechs Schritten über die drei Ansichten', async () => {
  await page.getByRole('button', { name: 'Vortrag starten', exact: true }).click()
  const expected = ['Standort', 'Standort', 'Vergleich', 'Vergleich', 'Entscheidung', 'Entscheidung']
  for (let i = 0; i < expected.length; i++) {
    await expect(page.locator('.atlas-tour > b')).toHaveText(`${i + 1} / 6`)
    await expect(page.getByRole('navigation', { name: 'Bereiche' }).getByRole('button', { name: expected[i], exact: true })).toHaveAttribute('aria-current', 'page')
    if (i < expected.length - 1) await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Abschließen', exact: true }).click()
  await expect(page.locator('.atlas-tour')).toHaveCount(0)
})

await check('Lokale Blender-Galerie zeigt vier Bilder mit 2048 × 1408 Pixeln; Großansicht, Pfeiltasten und Escape funktionieren', async () => {
  await nav(page, 'Standort')
  await openDetails(page.locator('.render-archive'))
  const gallery = page.locator('.render-gallery')
  const galleryImage = gallery.locator('figure img')
  const galleryNav = gallery.getByRole('navigation', { name: 'Gerenderte Modellansichten' })
  const assets = [
    { title: 'Vertical Farm', path: '/renders/vertical-farm.png' },
    { title: 'Gewächshaus', path: '/renders/greenhouse.png' },
    { title: 'Freiland', path: '/renders/field.png' },
  ]
  const dialog = page.locator('.render-dialog')
  const loadedImage = async (image, source) => {
    await expect(image).toHaveAttribute('src', source)
    await expect.poll(async () => image.evaluate(element => element.complete ? { width: element.naturalWidth, height: element.naturalHeight } : null)).toEqual({ width: 2048, height: 1408 })
  }
  for (const asset of assets) {
    await galleryNav.getByRole('button', { name: new RegExp(asset.title) }).click()
    await loadedImage(galleryImage, `.${asset.path}`)
    assert.equal(await page.getByTestId('scene').getAttribute('data-system'), asset.title === 'Vertical Farm' ? 'vertical' : asset.title === 'Gewächshaus' ? 'greenhouse' : 'field')
    await gallery.locator('.render-image-button').click()
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-label', `Großansicht: ${asset.title}`)
    await loadedImage(dialog.locator('img'), `.${asset.path}`)
    await dialog.getByRole('button', { name: 'Großansicht schließen', exact: true }).click()
    await expect(dialog).not.toBeVisible()
  }
  await galleryNav.getByRole('button', { name: /Vertical Farm/ }).click()
  await gallery.getByRole('button', { name: 'Blätter & Anbaukanal', exact: true }).click()
  await loadedImage(galleryImage, './renders/lettuce-detail.png')
  const opener = gallery.locator('.render-image-button')
  await opener.focus()
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-label', 'Großansicht: Salat und Anbaukanal')
  await loadedImage(dialog.locator('img'), './renders/lettuce-detail.png')
  await assertLateCloseKeepsReopenedDialog(dialog)
  await screenshot(page, 'galerie-blattdetail')
  await page.keyboard.press('ArrowRight')
  await expect(dialog).toHaveAttribute('aria-label', 'Großansicht: Gewächshaus')
  await loadedImage(dialog.locator('img'), './renders/greenhouse.png')
  await page.keyboard.press('ArrowLeft')
  await expect(dialog).toHaveAttribute('aria-label', 'Großansicht: Vertical Farm')
  await loadedImage(dialog.locator('img'), './renders/vertical-farm.png')
  await page.keyboard.press('ArrowRight')
  await expect(dialog).toHaveAttribute('aria-label', 'Großansicht: Gewächshaus')
  await loadedImage(dialog.locator('img'), './renders/greenhouse.png')
  await page.keyboard.press('ArrowRight')
  await expect(dialog).toHaveAttribute('aria-label', 'Großansicht: Freiland')
  await page.keyboard.press('ArrowRight')
  await expect(dialog).toHaveAttribute('aria-label', 'Großansicht: Vertical Farm')
  await page.keyboard.press('ArrowLeft')
  await expect(dialog).toHaveAttribute('aria-label', 'Großansicht: Freiland')
  await screenshot(page, 'galerie-grossansicht')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(opener).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Großansicht schließen', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await galleryNav.getByRole('button', { name: /Vertical Farm/ }).click()
  await expect(gallery.getByRole('button', { name: 'Gesamtansicht', exact: true })).toHaveAttribute('aria-pressed', 'true')
  for (const asset of [...assets, { path: '/renders/lettuce-detail.png' }]) assert.equal(localAssetStatuses[asset.path], 200)
})

await check('Tablet und Smartphone: alle Bereiche ohne Seitenüberlauf, Touchbedienung', async () => {
  for (const [name, width, height] of [['tablet', 820, 1180], ['phone', 390, 844]]) {
    const responsive = await context({ viewport: { width, height }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })
    const rp = await responsive.newPage()
    await load(rp)
    for (const tab of ['Standort', 'Vergleich', 'Entscheidung']) {
      await nav(rp, tab)
      const sizes = await rp.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
      assert.ok(sizes.scroll <= sizes.client + 1, `${name}/${tab}: Seitenüberlauf ${sizes.scroll} > ${sizes.client}`)
      await screenshot(rp, `${name}-${tab.toLowerCase()}`)
    }
    await expect(rp.locator('.atlas-paper')).not.toBeVisible()
    await rp.getByRole('button', { name: 'Vorschau öffnen' }).tap()
    await expect(rp.locator('.atlas-paper')).toBeVisible()
    await nav(rp, 'Standort')
    await rp.locator('.atlas-parts').getByRole('button', { name: 'Wasser', exact: true }).tap()
    await expect(rp.getByRole('heading', { name: 'Ein Kreislauf mit Zuflüssen' })).toBeVisible()
    await openDetails(rp.locator('.render-archive'))
    await rp.locator('.render-image-button').tap()
    await expect(rp.locator('.render-dialog')).toBeVisible()
    await rp.locator('.render-dialog').getByRole('button', { name: 'Großansicht schließen', exact: true }).tap()
    await expect(rp.locator('.render-dialog')).not.toBeVisible()
    await responsive.close()
  }
})

await check('Reduzierte Bewegung und technische Ersatzansicht', async () => {
  const reduced = await context({ reducedMotion: 'reduce' })
  const rp = await reduced.newPage()
  await load(rp)
  assert.equal(await rp.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true)
  await rp.getByRole('button', { name: '3D öffnen', exact: true }).click()
  await rp.getByLabel('Grafik', { exact: true }).selectOption('fallback')
  assert.ok(await rp.locator('.scene-fallback').isVisible())
  assert.equal(await rp.locator('canvas').count(), 0)
  await rp.locator('.atlas-site-grid').getByRole('button', { name: /Gewächshaus/ }).click()
  assert.equal(await rp.getByTestId('scene').getAttribute('data-system'), 'greenhouse')
  await rp.locator('.atlas-site-grid').getByRole('button', { name: /Freiland/ }).click()
  assert.equal(await rp.getByTestId('scene').getAttribute('data-system'), 'field')
  await screenshot(rp, 'ersatzschema')
  await reduced.close()
})

await check('Keine relevanten Browserfehler und keine externen Laufzeitabrufe', async () => {
  assert.deepEqual(errors, [])
  assert.deepEqual(externalRequests, [])
})
await browser.close()
report.passed = report.checks.every(check => check.passed)
if (!checkFilter) await fs.writeFile(process.env.BROWSER_REPORT_PATH || 'docs/browser-checks.json', JSON.stringify(report, null, 2) + '\n')
if (!report.passed) process.exitCode = 1
