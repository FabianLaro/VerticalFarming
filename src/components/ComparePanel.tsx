import { useState } from 'react'
import { ArrowRight, ArrowCounterClockwise, BookOpen, Lightning } from '@phosphor-icons/react'
import { BASE_INPUT, PARAMS, PRESETS, compare } from '../lib/model'
import type { ComparisonMode, Input, InputKey, Result } from '../lib/model'
import { getDatum } from '../data/catalog'
import { amount, number } from '../lib/format'
import { ComparisonGraphic } from './ComparisonGraphic'
import { EnergyEvidence } from './Knowledge'
import { Sensitivity } from './Sensitivity'
import { ScenarioControl } from './ScenarioControl'

type Props = {
  input: Input
  result: Result
  onSource: (id: string) => void
  onDecide: () => void
  update: (key: InputKey, value: number) => void
  selectPreset: (id: string) => void
}

const germanHarvest = getDatum('de-head-lettuce-2025')!
const primaryControls = ['levels', 'energyPerKg', 'gridFactor'] as const

export function ComparePanel({ input, result, onSource, onDecide, update, selectPreset }: Props) {
  const [mode, setMode] = useState<ComparisonMode>('harvest')
  const target = mode === 'footprint' ? input.footprint : result.harvest
  const rows = compare(input, mode, target)
  const scenarioTonnes = result.harvest / 1000
  const preset = PRESETS.find(item => PARAMS.every(param => (item.changes[param.key] ?? BASE_INPUT[param.key]) === input[param.key]))
  return <section className="atlas-compare no-print">
    <header className="atlas-page-heading atlas-compare-heading"><div><h1>Wie viel Fläche braucht Salat?</h1><p>Vergleiche drei Systeme mit derselben Bezugsgröße.</p></div>
      <div className="atlas-mode" aria-label="Vergleichsperspektive">{([['harvest', 'Gleiche Jahresernte'], ['footprint', 'Gleiche Grundfläche']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</button>)}</div>
    </header>

    <div className="atlas-compare-grid">
      <div className="atlas-chart-card">
        <div className="atlas-chart-target"><span>{mode === 'footprint' ? 'Grundfläche pro System' : 'Jahresernte pro System'}</span><strong>{mode === 'footprint' ? number(target) : number(target / 1000, 1)} <small>{mode === 'footprint' ? 'm²' : 't Salat/Jahr'}</small></strong></div>
        <ComparisonGraphic rows={rows} input={input} mode={mode} />
        <div className="atlas-chart-source"><p>Vertical Farm: Szenario 2040. Gewächshaus und Freiland: niederländische Kopfsalatreferenzen mit älteren Daten.</p><button type="button" className="atlas-text" onClick={() => onSource('blom2022')}><BookOpen size={16} /> Blom et al. 2022</button></div>
      </div>
      <aside className="atlas-scenario" aria-label="Vertical-Farm-Szenario">
        <div className="atlas-scenario-heading"><h2>Szenario ändern</h2><button type="button" className="atlas-icon" aria-label="Basisszenario wiederherstellen" title="Basisszenario wiederherstellen" onClick={() => selectPreset('base')}><ArrowCounterClockwise size={19} /></button></div>
        <label className="atlas-preset"><span>Vertical Farm</span><select data-testid="preset" value={preset?.id ?? 'custom'} onChange={event => selectPreset(event.target.value)}>{PRESETS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}{!preset && <option value="custom" disabled>Eigene Annahmen</option>}</select></label>
        {primaryControls.map(field => <ScenarioControl key={field} field={field} input={input} update={update} />)}
        {preset && preset.id !== 'base' && <small className="atlas-preset-note">{preset.description}</small>}
        <dl className="atlas-scenario-kpis" aria-label="Ergebnisse des Vertical-Farm-Szenarios" aria-live="polite">
          <div><dt>Ernte</dt><dd data-testid="harvest">{number(result.harvest / 1000, 1)} <small>t/Jahr</small></dd></div>
          <div><dt>Strombedarf</dt><dd data-testid="energy">{number(result.energy / 1000, 1)} <small>MWh/Jahr</small></dd></div>
          <div><dt>Strombeitrag</dt><dd>{number(result.emissionsPerKg, 2)} <small>kg CO₂eq/kg</small></dd></div>
          <div><dt>Stromkosten · Teilkosten</dt><dd data-testid="cost">{number(result.electricityPerKg, 2)} <small>€/kg</small></dd></div>
        </dl>
        <details className="atlas-details atlas-scenario-details"><summary>Weitere Annahmen</summary>{PARAMS.filter(param => !primaryControls.some(key => key === param.key)).map(param => <ScenarioControl key={param.key} field={param.key} input={input} update={update} />)}<p>Anbaufläche: {number(result.cultivationArea)} m². Frischwasserzusatz: {number(result.water / 1000, 1)} m³/Jahr. Stromkosten insgesamt: {number(result.electricityCost / 1000, 1)} Tsd. €/Jahr.</p><button type="button" className="atlas-text" onClick={() => onSource('assumptions')}>Rechenannahmen und Systemgrenzen</button></details>
      </aside>
    </div>

    <section className="atlas-climate">
      <div className="atlas-climate-icon"><Lightning size={25} /></div>
      <div><h2>Ist regionaler Salat automatisch klimafreundlicher?</h2><p>Der Test hält Ernte und Strombedarf konstant und ändert nur den <strong>Strommix</strong>. Für das Klimaurteil fehlen ein konkreter Importfall und eine gemeinsame Vollbilanz.</p><p aria-live="polite"><strong>{number(result.emissionsPerKg, 2)} kg CO₂eq/kg Salat</strong> aus dem Strom im aktuellen Szenario.</p></div>
      <button type="button" className="atlas-outline" onClick={() => update('gridFactor', input.gridFactor === .05 ? BASE_INPUT.gridFactor : .05)}>{input.gridFactor === .05 ? 'Referenzmix testen' : 'Strommix testen'} <ArrowRight size={16} /></button>
    </section>
    <details className="atlas-details atlas-research"><summary>Recherchekarte und Originalquellen</summary>
      <ol>
        <li><strong>Behauptung:</strong> Regionaler Salat aus Vertical Farming sei automatisch klimafreundlicher als importierter Salat.</li>
        <li><strong>Befund:</strong> Der Strom für Licht und Klima kann den Vorteil kurzer Wege überwiegen. Prüffrage: Wie CO₂-intensiv ist der eingesetzte Strom?</li>
        <li><strong>Quellen:</strong> Stanghellini &amp; Katzin, <cite>The dark side of lighting</cite>, und Fraunhofer UMSICHT, <cite>inFARMING</cite>.</li>
        <li><strong>Fundstellen:</strong> V3, Energie- und Transportvergleich in der Review. V4, Projektziele und ALTMARKTgarten.</li>
        <li><strong>Zeitbezug:</strong> Review 2024 und Projektbeschreibung, geprüft im November 2026.</li>
        <li><strong>Offen:</strong> Gemeinsame Systemgrenze und Lieferkette für den Importfall. Die Fraunhofer-Projektseite beschreibt die Gebäudekopplung.</li>
      </ol><div className="atlas-inline-links"><button type="button" className="atlas-text" onClick={() => onSource('stanghellini2024')}>V3 · Stanghellini &amp; Katzin</button><button type="button" className="atlas-text" onClick={() => onSource('fraunhofer')}>V4 · Fraunhofer UMSICHT</button></div>
    </details>
    <EnergyEvidence onSource={onSource} />
    <details className="atlas-details comparison-data"><summary>Datentabelle und Vergleichsgrenzen</summary>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Vergleichstabelle, horizontal scrollbar">
        <table className="comparison-table"><caption>Jahresvergleich · gleiche Bezugsgröße, unterschiedliche Systemgrenzen</caption>
          <thead><tr><th scope="col">Kennzahl</th>{rows.map(row => <th scope="col" key={row.system}>{row.label}</th>)}</tr></thead>
          <tbody>
            <tr><th scope="row">Grundfläche · m²</th>{rows.map(row => <td key={row.system}>{number(row.footprint)}</td>)}</tr>
            <tr><th scope="row">Anbaufläche · m²</th>{rows.map(row => <td key={row.system}>{row.cultivationArea === null ? 'Datenlücke' : number(row.cultivationArea)}</td>)}</tr>
            <tr><th scope="row">Salatfrischmasse · kg/Jahr</th>{rows.map(row => <td key={row.system}>{number(row.harvest)}</td>)}</tr>
            <tr><th scope="row">Energie · kWh/Jahr</th>{rows.map(row => <td key={row.system}>{amount(row.energy, 'kWh')}</td>)}</tr>
            <tr><th scope="row">Energie · kWh/kg</th>{rows.map(row => <td key={row.system}>{amount(row.energyPerKg, 'kWh/kg', 2)}</td>)}</tr>
            <tr><th scope="row">Wasserzufuhr · L/kg</th>{rows.map(row => <td key={row.system}>{number(row.waterPerKg, 2)}</td>)}</tr>
            <tr><th scope="row">Bezugsjahr / Region</th>{rows.map(row => <td key={row.system}>{row.referenceYear}<br />{row.region}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <p>Freilandbewässerung ohne Regen, Vertical Farming ohne Reinigung und Vorketten. Das Gewächshaus nutzt Erdgas zur Heizung. Vergleichbare Energie- und Klimabilanzen fehlen. Die direkte Grundstücksfläche erfasst keine Flächen für Strom und Vorprodukte.</p>
      <button type="button" className="atlas-text" onClick={() => onSource('blom2022')}>Referenzwerte und Methode</button>
    </details>
    <details className="atlas-details"><summary>Plausibilität für einen Standort in Dinslaken</summary>
      <p>Bei angenommenen 1,7 m je Ebene plus 1,2 m Technik braucht das Modell rechnerisch {number(input.levels * 1.7 + 1.2, 1)} m Höhe. Die mittlere elektrische Leistung beträgt {number(result.energy / 8760, 1)} kW. Für die Umnutzung einer Halle sind zusätzlich Spitzenlast, Netzanschluss und geprüfte Maße nötig.</p>
      <p>Bei angenommenen 5 kg Salat pro Person und Jahr entspricht die Modellernte dem Salatbedarf von {number(result.harvest / 5)} Menschen. Der Wert veranschaulicht den Salatbedarf. Er sagt nichts über die gesamte Ernährung aus.</p>
    </details>
    <details className="atlas-details"><summary>Was könnte Vertical Farming zur Versorgung Deutschlands beitragen?</summary>
      <p>Deutschland erntete {germanHarvest.dataYear} laut Destatis <strong>{number(germanHarvest.value)} t Kopfsalat im Freiland</strong>. Die {number(scenarioTonnes, 2)} t Salat aus einer Modellanlage entsprechen rund <strong>{number(scenarioTonnes / germanHarvest.value * 100, 2)} %</strong> dieser Erntemenge.</p>
      <p>Zehn gleichartige Anlagen kämen rechnerisch auf {number(scenarioTonnes * 10, 1)} t Salat pro Jahr und bräuchten {number(result.energy * 10 / 1_000_000, 2)} GWh Strom im Jahr. Das Beispiel setzt dieselbe Leistung an allen Standorten voraus. Die Freilandernte ist eine Bezugsgröße für die Menge. Für Marktanteile wären auch Gewächshausernten, Einfuhren und Nachfrage zu berücksichtigen.</p>
      <p>Ein Beitrag ist vor allem bei Blattgemüse in der Zeit außerhalb der Freilandsaison denkbar. Prüft, in welchen Monaten Abnehmer zusätzliche Mengen benötigen und ob regionale Gewächshäuser sie bei vergleichbaren Kosten und Umweltwirkungen liefern könnten.</p>
      <button type="button" className="atlas-text" onClick={() => onSource(germanHarvest.sourceId)}>Quelle zur deutschen Freilandernte</button>
    </details>
    <details className="atlas-details"><summary>Empfindlichkeit der Annahmen (±20 %)</summary><Sensitivity input={input} /></details>
    <div className="atlas-next"><button type="button" className="atlas-primary" onClick={onDecide}>Förderung bewerten <ArrowRight size={18} /></button></div>
  </section>
}
