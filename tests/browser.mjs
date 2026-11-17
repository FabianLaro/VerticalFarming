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
const report = { date: '2026-11-17', baseURL, browser: await browser.version(), checks: [], errors, externalRequests, localAssetStatuses }

async function context(options = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options })
  // Simulate no access to the internet while retaining the explicitly local server.
  await ctx.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (['127.0.0.1', 'localhost'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) return route.continue()
    externalRequests.push(url.href)
    return route.abort('internetdisconnected')
  })
  ctx.on('page', page => {
    page.setDefaultTimeout(10000)
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('response', response => {
      const url = new URL(response.url())
      if (/\/(?:models\/[^/]+\.glb|renders\/[^/]+\.png)$/u.test(url.pathname)) localAssetStatuses[url.pathname] = response.status()
    })
  })
  return ctx
}
async function check(name, run) {
  if (checkFilter && !checkFilter.test(name)) return
  try { await run(); report.checks.push({ name, passed: true }); console.log(`OK ${name}`) }
  catch (error) { report.checks.push({ name, passed: false, error: error.stack || String(error) }); console.error(`FEHLER ${name}: ${error.message}`) }
}
async function nav(page, name) { await page.locator('.main-nav').getByRole('button', { name: new RegExp(name) }).click() }
async function load(page) {
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.locator('canvas').waitFor()
  await page.waitForTimeout(600)
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
async function assertCommonAreaScale(page) {
  const squares = await page.locator('.area-stage svg rect').evaluateAll(rects => rects.map(rect => ({
    width: Number(rect.getAttribute('width')), height: Number(rect.getAttribute('height')),
    pixelWidth: rect.getBoundingClientRect().width, pixelHeight: rect.getBoundingClientRect().height,
  })))
  assert.equal(squares.length, 3)
  // These areas are independently reconstructed from the annual 156,000 kg target.
  const areas = [1000, 156000 / 29.05, 156000 / 8.9]
  const scale = squares[0].width ** 2 / areas[0]
  const pixelScale = squares[0].pixelWidth ** 2 / areas[0]
  squares.forEach((square, index) => {
    assert.ok(Math.abs(square.width - square.height) < 1e-8, 'SVG-Rechtecke müssen Quadrate bleiben')
    assert.ok(Math.abs(square.pixelWidth - square.pixelHeight) < 0.1, 'Angezeigte Flächen dürfen nicht verzerrt werden')
    assert.ok(Math.abs(square.width ** 2 / areas[index] - scale) < 1e-8, 'Alle SVG-Flächen brauchen denselben Maßstab')
    assert.ok(Math.abs(square.pixelWidth ** 2 / areas[index] - pixelScale) < 0.001, 'Auch nach responsiver Skalierung gilt ein gemeinsamer Maßstab')
  })
}
const ctx = await context()
const page = await ctx.newPage()
if (checkFilter) await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
else await load(page)

await check('Initiale echte WebGL-Szene und lokales Laden ohne Internetzugriff', async () => {
  assert.equal(await page.getByTestId('scene').getAttribute('data-levels'), '4')
  assert.match(await page.getByTestId('harvest').innerText(), /156/)
  const webgl = await page.locator('canvas').evaluate(canvas => !!(canvas.getContext('webgl2') || canvas.getContext('webgl')))
  assert.ok(webgl, 'Echte WebGL-Szene muss statt Ersatzansicht aktiv sein')
  report.renderer = await page.locator('canvas').evaluate(canvas => {
    const gl = canvas.getContext('webgl2')
    const debug = gl?.getExtension('WEBGL_debug_renderer_info')
    return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'WebGL ohne Gerätekennung'
  })
  for (const model of ['lettuce', 'rack-tier', 'tank', 'pump', 'air-handler', 'harvest-cart']) {
    await expect.poll(() => localAssetStatuses[`/models/${model}.glb`], { message: `Lokales Blender-Modell ${model} muss erfolgreich laden` }).toBe(200)
  }
  await screenshot(page, 'desktop-erkunden')
})

await check('Kompakter Einstieg und Hintergrundthemen zeigen Details erst auf Anfrage', async () => {
  await nav(page, 'Erkunden')
  assert.equal(await page.locator('.render-archive[open]').count(), 0)
  assert.equal(await page.locator('.knowledge-topic').count(), 4)
  assert.equal(await page.locator('.knowledge-topic[open]').count(), 0)
  const layout = await page.evaluate(() => ({
    viewerTop: document.querySelector('.scene-shell').getBoundingClientRect().top + scrollY,
    resultsTop: document.querySelector('.metrics').getBoundingClientRect().top + scrollY,
    pageHeight: document.documentElement.scrollHeight,
  }))
  assert.ok(layout.viewerTop < 210, `Kompakte Navigation und Modellbeginn: ${layout.viewerTop}px`)
  assert.ok(layout.resultsTop < 650, `Kennzahlen sollen im ersten Laptopbild sichtbar sein: ${layout.resultsTop}px`)
  assert.ok(layout.pageHeight <= 1000, `Kompakte Erkundungsansicht: ${layout.pageHeight}px`)
  report.initialLayout = layout
  await openDetails(page.locator('.knowledge'))
  const resources = page.locator('.knowledge-topic').filter({ has: page.locator('summary', { hasText: 'Ressourcen und Standort' }) })
  await openDetails(resources)
  await expect(resources.locator('.knowledge-facts dt')).toHaveCount(3)
  await expect(resources).toContainText('Strom, Frischwasser, Nährsalze und Betriebsmittel')
  await resources.locator(':scope > summary').click()
  const climate = page.locator('.knowledge-topic').filter({ has: page.locator('summary', { hasText: 'Ist regionaler Salat automatisch klimafreundlicher?' }) })
  await openDetails(climate)
  await expect(climate.locator('.knowledge-research li')).toHaveCount(6)
  await expect(climate).toContainText('Regionalität allein belegt keinen Klimavorteil')
  await climate.locator(':scope > summary').click()
  const data = page.locator('.knowledge-topic').filter({ has: page.locator('summary', { hasText: 'Was die Daten aus M3 belegen' }) })
  await openDetails(data)
  await expect(data.locator('.m3-chart')).toBeVisible()
  await expect(data.locator('.m3-chart b')).toHaveText(['0,13', '0,08'])
  await expect(data).toContainText('keine mittleren Energiebedarfe')
  await data.locator(':scope > summary').click()
  const terms = page.locator('.knowledge-topic').filter({ has: page.locator('summary', { hasText: /^Begriffe$/ }) })
  await openDetails(terms)
  await expect(terms.locator('.knowledge-facts dt')).toHaveCount(4)
  await terms.locator(':scope > summary').click()
  await page.locator('.knowledge > summary').click()
  await nav(page, 'Vergleichen')
  assert.equal(await page.locator('.page-heading').count(), 0, 'Vergleich erhält keinen zweiten sichtbaren globalen Hero')
  await expect(page.locator('.compare-panel h2')).toHaveText('Anbau vergleichen')
  await expect(page.locator('.comparison-data')).not.toHaveAttribute('open')
  await page.locator('.comparison-data > summary').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.comparison-table')).toBeVisible()
  await nav(page, 'Entscheiden')
  await expect(page.locator('.decision-priorities')).not.toHaveAttribute('open')
  await expect(page.locator('.decision-criteria')).not.toHaveAttribute('open')
  await expect(page.locator('.decision-recommendation')).not.toHaveAttribute('open')
  await nav(page, 'Erkunden')
})

await check('Strompreis ändert Kosten, weder Ernte noch Energie', async () => {
  await nav(page, 'Szenarien')
  const before = { harvest: await page.getByTestId('harvest').innerText(), energy: await page.getByTestId('energy').innerText() }
  await page.getByTestId('preset').selectOption('price')
  assert.equal(await page.getByTestId('harvest').innerText(), before.harvest)
  assert.equal(await page.getByTestId('energy').innerText(), before.energy)
  assert.match(await page.getByTestId('cost').innerText(), /624/)
})

await check('Ebenen verändern Geometrieparameter und Kennzahlen; Tastatur und vollständiger Reset', async () => {
  await page.getByTestId('preset').selectOption('levels')
  assert.equal(await page.getByTestId('scene').getAttribute('data-levels'), '6')
  assert.match(await page.getByTestId('harvest').innerText(), /234/)
  assert.equal(await page.getByTestId('param-electricityPrice').inputValue(), '0.25')
  await page.getByTestId('param-levels').focus()
  await page.keyboard.press('End')
  assert.equal(await page.getByTestId('scene').getAttribute('data-levels'), '10')
  assert.match(await page.getByTestId('harvest').innerText(), /390/)
  await page.getByRole('button', { name: 'Basis vollständig wiederherstellen' }).click()
  assert.equal(await page.getByTestId('scene').getAttribute('data-levels'), '4')
  assert.equal(await page.getByTestId('param-electricityPrice').inputValue(), '0.25')
  assert.match(await page.getByTestId('cost').innerText(), /390/)
  await screenshot(page, 'desktop-szenarien')
})

await check('Anderer Emissionsfaktor verändert keine Produktion', async () => {
  const harvest = await page.getByTestId('harvest').innerText()
  const cost = await page.getByTestId('cost').innerText()
  await page.getByTestId('preset').selectOption('power')
  assert.equal(await page.getByTestId('harvest').innerText(), harvest)
  assert.equal(await page.getByTestId('cost').innerText(), cost)
  assert.match(await page.locator('.emission-result').innerText(), /78/)
  await page.getByRole('button', { name: 'Basis vollständig wiederherstellen' }).click()
})

await check('Parameterhilfen sind erreichbar und Sensitivität trennt Energie, Ertrag und Strompreis', async () => {
  await openDetails(page.locator('.sensitivity-section'))
  const help = page.getByTestId('param-levels').locator('..').locator('.parameter-help')
  assert.equal(await help.getAttribute('open'), null)
  await help.locator('summary').click()
  assert.equal(await help.locator('small').isVisible(), true)
  await help.getByRole('button', { name: 'Beleg / Annahme öffnen', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  assert.match(await page.getByRole('dialog').innerText(), /keine Kalibrierung|keine.*Kalibrierung/i)
  await page.keyboard.press('Escape')
  await help.locator('summary').click()
  const table = page.locator('.sensitivity table')
  const rowValues = label => table.locator('tbody tr').filter({ hasText: label }).locator('td').allTextContents()
  assert.deepEqual(await rowValues('Ernte · t/a'), ['156', '156', '156'])
  assert.deepEqual(await rowValues('Stromkosten · Tsd. €/a'), ['312', '390', '468'])
  assert.deepEqual(await rowValues('Strombeitrag · t CO₂eq/a'), ['506,7', '633,4', '760'])
  await page.locator('#sensitivity-key').selectOption('electricityPrice')
  assert.deepEqual(await rowValues('Ernte · t/a'), ['156', '156', '156'])
  assert.deepEqual(await rowValues('Stromkosten · Tsd. €/a'), ['312', '390', '468'])
  assert.deepEqual(await rowValues('Strombeitrag · t CO₂eq/a'), ['633,4', '633,4', '633,4'])
  await page.locator('#sensitivity-key').selectOption('yieldPerArea')
  assert.deepEqual(await rowValues('Ernte · t/a'), ['124,8', '156', '187,2'])
  assert.deepEqual(await rowValues('Stromkosten · Tsd. €/a'), ['312', '390', '468'])
  // Sensitivity is an exploration; it must not mutate the actual scenario.
  assert.equal(await page.getByTestId('param-energyPerKg').inputValue(), '10')
  assert.match(await page.getByTestId('harvest').innerText(), /156/)
  await screenshot(page, 'sensitivitaet')
})

await check('Vergleich: gleiche Fläche und gleiche Ernte, echte Datenlücken', async () => {
  await nav(page, 'Vergleichen')
  const areaRow = page.locator('.comparison-table tbody tr').filter({ hasText: 'Grundfläche · m²' })
  assert.deepEqual(await areaRow.locator('td').allTextContents(), ['1.000', '1.000', '1.000'])
  const energyRow = page.locator('.comparison-table tbody tr').filter({ hasText: 'Energie · kWh/a' })
  assert.deepEqual(await energyRow.locator('td').allTextContents(), ['1.560.000 kWh', 'Datenlücke', 'Datenlücke'])
  await page.getByRole('button', { name: 'Gleiche Jahresernte', exact: true }).click()
  const harvestRow = page.locator('.comparison-table tbody tr').filter({ hasText: 'Salatfrischmasse · kg/a' })
  assert.deepEqual(await harvestRow.locator('td').allTextContents(), ['156.000', '156.000', '156.000'])
  assert.deepEqual(await areaRow.locator('td').allTextContents(), ['1.000', '5.370', '17.528'])
  await assertCommonAreaScale(page)
  await screenshot(page, 'desktop-vergleichen')
})

await check('Quellendialog: Original-URLs, Fundstellen und Escape-Taste', async () => {
  await page.locator('.header-actions').getByRole('button', { name: 'Belege', exact: true }).click()
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
  await nav(page, 'Szenarien')
  await page.getByTestId('preset').selectOption('price')
  await page.locator('.header-actions').getByRole('button', { name: 'Belege', exact: true }).click()
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
  await page.getByRole('button', { name: 'Basis vollständig wiederherstellen' }).click()
})

await check('Entscheidung: zwei Prioritäten, persistente Bearbeitung und Exportvalidierung', async () => {
  await nav(page, 'Entscheiden')
  await openDetails(page.locator('.decision-priorities'))
  await openDetails(page.locator('.decision-recommendation'))
  const exportButton = page.getByRole('button', { name: 'Decision Brief als PDF drucken', exact: true })
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
  await nav(page, 'Erkunden')
  await nav(page, 'Entscheiden')
  assert.equal(await recommendation.inputValue(), revised)
  await openDetails(page.locator('.decision-priorities'))
  await openDetails(page.locator('.decision-recommendation'))
  await recommendation.fill(originalRecommendation)
  const reason = page.locator('.decision-field').filter({ hasText: /^Warum diese beiden\?/ }).locator('textarea')
  const originalReason = await reason.inputValue()
  await reason.fill('Wort '.repeat(59))
  await expect(exportButton, 'Überlanger Brief muss Export blockieren').toBeDisabled()
  await reason.fill(originalReason)
  await expect(exportButton).toBeEnabled()
  await recommendation.fill('Erster Satz. Zweiter Satz.')
  await expect(exportButton, 'Mehr als drei Sätze einschließlich Bedingungen müssen Export blockieren').toBeDisabled()
  await recommendation.fill(originalRecommendation)
  await screenshot(page, 'desktop-entscheiden')
  await page.reload({ waitUntil: 'networkidle' })
  await nav(page, 'Entscheiden')
  assert.equal(await recommendation.inputValue(), originalRecommendation)
})

await check('Quellenwechsel am Kriterium aktualisiert Beleg, Brief und Speicherung ohne eigene Aussage zu ersetzen', async () => {
  await nav(page, 'Entscheiden')
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
    await nav(page, 'Szenarien')
    await nav(page, 'Entscheiden')
    await openDetails(page.locator('.decision-criteria'))
    assert.equal(await sourceSelect.inputValue(), 'blom2022')
    assert.equal(await evidence.inputValue(), statement)
    await openDetails(criterion.locator('.criterion-reference-detail'))
    await expect(reference).toContainText('[B] Blom et al. 2022')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await nav(page, 'Entscheiden')
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
    await expect(bibliography).not.toContainText('[B]')
    await expect(bibliography).not.toContainText('Blom et al.')
    await screenshot(page, 'quellenwechsel')
  } finally {
    const resetSection = page.locator('.decision-details').filter({ has: page.locator('summary', { hasText: 'Name, Datum und Beispiel zurücksetzen' }) })
    if (!(await resetSection.getAttribute('open'))) await resetSection.locator('summary').click()
    await resetSection.getByRole('button', { name: 'Beispielposition wiederherstellen', exact: true }).click()
    await expect(sourceSelect).toHaveValue('stanghellini2024')
    await expect(evidence).toHaveValue('Hoher Strombedarf; Gesamtbilanz bleibt offen.')
  }
})

await check('Aktuelles Drucklayout wird unabhängig vom Wortlimit auf A4-Passung geprüft', async () => {
  await openDetails(page.locator('.decision-criteria'))
  const exportButton = page.getByRole('button', { name: 'Decision Brief als PDF drucken', exact: true })
  await expect(exportButton).toBeEnabled()
  const height = Number(await page.locator('.decision-panel').getAttribute('data-print-height'))
  assert.ok(height > 0 && height <= 273 * 96 / 25.4, `Basisbrief ${height}px muss in den A4-Inhaltsbereich passen`)
  const liveWords = Number((await page.locator('.brief-count strong').innerText()).split(' / ')[0])
  await page.emulateMedia({ media: 'print' })
  const printed = await page.locator('#decision-brief').innerText()
  const domWords = printed.trim().split(/\s+/u).length
  assert.ok(domWords <= 450, `Auch der sichtbare Drucktext enthält höchstens450Wörter (${domWords})`)
  assert.equal(domWords, liveWords, 'Wortzähler muss alle tatsächlichen Drucktexte berücksichtigen')
  await page.emulateMedia({ media: 'screen' })
  report.printLayout = { measuredHeightCssPx: height, availableHeightCssPx: 273 * 96 / 25.4, liveWords, domWords }
  const evidence = page.getByRole('textbox', { name: 'Beleg für Gesellschaft', exact: true })
  const original = await evidence.inputValue()
  // One long word stays below450words but wraps over several lines in the narrow criterion column.
  try {
    await evidence.fill('W'.repeat(180))
    await expect.poll(async () => Number(await page.locator('.decision-panel').getAttribute('data-print-height'))).toBeGreaterThan(273 * 96 / 25.4)
    assert.ok(Number((await page.locator('.brief-count strong').innerText()).split(' / ')[0]) < 450)
    await expect(exportButton).toBeDisabled()
    await expect(page.getByText('Der Text passt nicht auf eine A4-Seite. Bitte kürzen.', { exact: true })).toBeVisible()
  } finally { await evidence.fill(original) }
  await expect(exportButton).toBeEnabled()
})

await check('Aktuelle Parameter und Ergebnisse werden in den Brief übernommen', async () => {
  await nav(page, 'Szenarien')
  await page.getByTestId('preset').selectOption('levels')
  assert.match(await page.getByTestId('harvest').innerText(), /234/)
  await nav(page, 'Entscheiden')
  const brief = await page.locator('#decision-brief').textContent()
  assert.match(brief, /234/)
  assert.match(brief, /3\.900/)
  assert.match(brief, /6 Ebenen/)
  assert.match(brief, /2\.340/)
  await nav(page, 'Szenarien')
  await page.getByRole('button', { name: 'Basis vollständig wiederherstellen' }).click()
})

await check('Vortragsmodus mit sechs vollständigen Schritten', async () => {
  await page.getByRole('button', { name: 'Vortrag starten', exact: true }).click()
  const expected = ['Die Frage der Stadt', 'So funktioniert die Farm', 'Eine faire Bezugsgröße', 'Was ändert das Ergebnis?', 'Wer trägt Nutzen und Risiko?', 'Eine überprüfbare Empfehlung']
  for (let i = 0; i < expected.length; i++) {
    assert.equal(await page.locator('.tour-note strong').innerText(), expected[i])
    if (i < expected.length - 1) await page.locator('.tour-bar').getByRole('button', { name: 'Weiter', exact: true }).click()
  }
  await page.locator('.tour-bar').getByRole('button', { name: 'Vortrag abschließen', exact: true }).click()
  assert.equal(await page.locator('.tour-note').count(), 0)
})

await check('Lokale Blender-Galerie zeigt vier Bilder mit 2048 × 1408 Pixeln; Großansicht, Pfeiltasten und Escape funktionieren', async () => {
  await nav(page, 'Erkunden')
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
    for (const tab of ['Erkunden', 'Szenarien', 'Vergleichen', 'Entscheiden']) {
      await rp.locator('.main-nav').getByRole('button', { name: new RegExp(tab) }).tap()
      const sizes = await rp.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
      assert.ok(sizes.scroll <= sizes.client + 1, `${name}/${tab}: Seitenüberlauf ${sizes.scroll} > ${sizes.client}`)
      await screenshot(rp, `${name}-${tab.toLowerCase()}`)
      if (tab === 'Vergleichen') {
        await rp.getByRole('button', { name: 'Gleiche Jahresernte', exact: true }).tap()
        await assertCommonAreaScale(rp)
        await screenshot(rp, `${name}-flaechenmassstab`)
      }
    }
    await nav(rp, 'Erkunden')
    await rp.locator('.part-buttons').getByRole('button', { name: 'Ein Kreislauf mit Zuflüssen', exact: true }).tap()
    assert.equal(await rp.locator('.part-copy h2').innerText(), 'Ein Kreislauf mit Zuflüssen')
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
  await rp.locator('.select-compact').filter({ hasText: /^Grafik/ }).locator('select').selectOption('fallback')
  assert.ok(await rp.locator('.scene-fallback').isVisible())
  assert.equal(await rp.locator('canvas').count(), 0)
  await rp.locator('.system-switch').getByRole('button', { name: /Gewächshaus/ }).click()
  assert.equal(await rp.getByTestId('scene').getAttribute('data-system'), 'greenhouse')
  await rp.locator('.system-switch').getByRole('button', { name: /Freiland/ }).click()
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
