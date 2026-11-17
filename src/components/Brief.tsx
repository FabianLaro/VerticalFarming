import type { Input, Result } from '../lib/model'
import { BASE_INPUT, calculate } from '../lib/model'
import { criterionEvidence, decisionReferences } from '../lib/citations'

export type Verdict = '+' | '±' | '−' | '?'
export type CriterionId = 'food' | 'environment' | 'economy' | 'society' | 'feasibility'
export interface Criterion {
  id: CriterionId
  label: string
  symbol: Verdict
  evidence: string
  source: string | null
}
export interface DecisionState {
  option: 'A' | 'B' | 'C'
  names: string
  date: string
  recommendation: string
  conditions: [string, string]
  priorities: CriterionId[]
  priorityReason: string
  criteria: Criterion[]
  pros: [string, string, string]
  cons: [string, string, string]
  counterargument: string
  response: string
  uncertainty: string
  conflictQuestion: string
  comparisonQuestion: string
}

export const OPTIONS = [
  { id: 'A', label: 'Breite Investitionsförderung', description: 'Viele Anlagen schnell aufbauen. Energieversorgung und Absatz müssen tragfähig sein.' },
  { id: 'B', label: 'Befristete Pilotförderung', description: 'Messdaten und Gebäudekopplung prüfen. Ergebnisse offenlegen und Abbruchkriterien festlegen.' },
  { id: 'C', label: 'Andere Versorgung fördern', description: 'Freiland, Gewächshaus oder Logistik stärken. Den entgangenen Sondernutzen abwägen.' },
] as const

export const INITIAL_DECISION: DecisionState = {
  option: 'B',
  names: 'Projektgruppe Q1 (Namen ergänzen)',
  date: '2026-11-16',
  recommendation: 'Die Stadt sollte befristete Pilotförderung wählen, um Standortnutzen und Energiebedarf vor einem Ausbau zu prüfen.',
  conditions: [
    'Vor Bewilligung müssen ein belastbares Stromkonzept und vertraglich belegte Abnehmer vorliegen.',
    'Nach zwölf Monaten werden Ernte, Energie, Wasser und Vollkosten veröffentlicht; bei verfehlten vorab vereinbarten Zielen endet die Förderung.',
  ],
  priorities: ['environment', 'economy'],
  priorityReason: 'Umwelt schützt Klimaziele; Wirtschaftlichkeit begrenzt das Risiko öffentlicher Mittel.',
  criteria: [
    { id: 'food', label: 'Ernährungsbeitrag', symbol: '±', evidence: 'Blattgemüse ergänzt, ersetzt keine Grundnahrung [D].', source: 'dlr2019' },
    { id: 'environment', label: 'Umwelt', symbol: '±', evidence: 'Hoher Strombedarf; Gesamtbilanz bleibt offen [P,S].', source: 'stanghellini2024' },
    { id: 'economy', label: 'Wirtschaftlichkeit', symbol: '?', evidence: 'Stromkosten sind nur Teil der Vollkosten [M].', source: 'scenario' },
    { id: 'society', label: 'Gesellschaft', symbol: '±', evidence: 'Zugang und Verteilung offen [A, M4 S.4].', source: 'material' },
    { id: 'feasibility', label: 'Umsetzbarkeit', symbol: '±', evidence: 'Gebäudekopplung möglich, lokal ungeprüft [F].', source: 'fraunhofer' },
  ],
  pros: [
    'Ebenen erhöhen Ernte je Gebäudegrundfläche [M].',
    'Nährlösung kann wiederverwendet werden [D].',
    'Pilot prüft Gebäudekopplung vor Ausbau [F].',
  ],
  cons: [
    'Künstliche Beleuchtung benötigt viel Energie [P,S].',
    'Lokale Vollkosten und Absatz sind unbelegt [M].',
    'Salat deckt nur einen Ernährungsausschnitt [D].',
  ],
  counterargument: 'Förderung könnte energieintensive Produktion dauerhaft festschreiben.',
  response: 'Befristung, offene Messdaten und Abbruchkriterien erlauben Korrekturen.',
  uncertainty: 'Standortspezifische Ganzjahresvollkosten und vollständige Ökobilanz fehlen.',
  conflictQuestion: 'Wer trägt Mehrkosten, wenn bezahlbares Gemüse und Klimaziele kollidieren?',
  comparisonQuestion: 'Wann erreicht ein regionales Gewächshaus dasselbe Förderziel mit weniger Energie?',
}

const number = (value: number, digits = 1) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value)
const dateLabel = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split('-').reverse().join('.') : date

export function recommendationSentences(state: DecisionState): number {
  // Decimal points are not sentence boundaries; a sentence ending in a year is.
  const text = [state.recommendation, ...state.conditions].join(' ').trim().replace(/(\d)\.(?=\d)/gu, '$1,')
  return text ? text.split(/[.!?]+(?:\s+|$)/u).filter(part => part.trim()).length : 0
}

export function briefText(state: DecisionState, input: Input, result: Result): string {
  const baseline = calculate(BASE_INPUT)
  return [
    'STADTLABOR 2040 Decision Brief Soll unsere Stadt Vertical Farming fördern?',
    'Szenariomodell · Beispielposition, bearbeitbar', state.names, '·', dateLabel(state.date),
    `${state.option} · ${OPTIONS.find(option => option.id === state.option)?.label}`,
    'Empfehlung und zwei Bedingungen', state.recommendation, ...state.conditions,
    'Drei Argumente dafür', ...state.pros, 'Drei Argumente dagegen', ...state.cons,
    'Ernte im Szenarienvergleich', 'Salatfrischmasse · t/Jahr · Szenariojahr 2040 · [M]',
    `Basis ${number(baseline.harvest / 1000)} Aktuell ${number(result.harvest / 1000)}`,
    `Aktuell: ${number(input.footprint, 0)} m² Grundfläche · ${number(input.usable * 100, 0)} % Nutzanteil · ${input.levels} Ebenen · ${number(input.yieldPerArea)} kg/(m²·a).`,
    `Anbaufläche ${number(result.cultivationArea, 0)} m²; Energie ${number(result.energy / 1000)} MWh/Jahr; Frischwasserzusatz im Anbau ${number(result.water / 1000)} m³/Jahr (${number(input.waterPerKg)} L/kg, Annahme), ohne Reinigung/Vorketten.`,
    `Strom: ${number(input.energyPerKg)} kWh/kg · ${number(input.electricityPrice, 2)} €/kWh · ${number(input.gridFactor, 3)} kgCO₂eq/kWh.`,
    'Modellenergie vollständig als Strom, inklusive Klima/Pumpen. Stromfaktor veränderbar; Basis 2025 geschätzt [U], keine Prognose.',
    `Stromkosten ${number(result.electricityPerKg, 2)} €/kg; Strombeitrag ${number(result.emissionsPerKg, 2)} kgCO₂eq/kg.`,
    'Aussage: mehr Anbaufläche kann mehr Ernte liefern. Grenze: konstante Ertragsannahme; keine Betriebsprognose, Vollkosten oder Gesamtklimabilanz.',
    'Fünf Kriterien: Urteile, keine Messwerte',
    ...state.criteria.map(criterion => `${criterion.label} ${criterion.symbol} ${criterionEvidence(criterion)}`),
    '+ dafür · ± bedingt · − dagegen · ? Daten fehlen',
    'Zwei Prioritäten', state.priorities.map(id => state.criteria.find(criterion => criterion.id === id)?.label).join(', '), state.priorityReason,
    'Stärkstes Gegenargument', state.counterargument, 'Antwort', state.response,
    'Größte Unsicherheit', state.uncertainty,
    'Frage zum Zielkonflikt', state.conflictQuestion, 'Frage zum Vergleich', state.comparisonQuestion,
    'Kurzbelege', decisionReferences(state),
  ].join(' ')
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length
}

export interface BriefProps {
  state: DecisionState
  input: Input
  result: Result
  valid: boolean
}

export function Brief({ state, input, result, valid }: BriefProps) {
  const baseline = calculate(BASE_INPUT)
  const maxHarvest = Math.max(baseline.harvest, result.harvest, 1)
  return <article className="brief" id="decision-brief" aria-label="Druckbarer Decision Brief">
    <header className="brief-header">
      <div><span className="brief-brand">STADTLABOR 2040</span><span>Decision Brief</span></div>
      <p>{state.names} · {dateLabel(state.date)}</p>
    </header>
    <h1>Soll unsere Stadt Vertical Farming fördern?</h1>
    <p className="brief-model-label">Szenariomodell · Beispielposition, bearbeitbar</p>
    {!valid && <p className="brief-invalid">Noch nicht abgabefertig: Wort-, Satz- oder Prioritätenvorgabe prüfen.</p>}
    <section className="brief-recommendation">
      <h2>{state.option} · {OPTIONS.find(option => option.id === state.option)?.label}</h2>
      <h3>Empfehlung und zwei Bedingungen</h3>
      <p>{state.recommendation}</p>
      <ol>{state.conditions.map((condition, index) => <li key={index}>{condition}</li>)}</ol>
    </section>
    <div className="brief-arguments">
      <section><h3>Drei Argumente dafür</h3><ul>{state.pros.map((argument, index) => <li key={index}>{argument}</li>)}</ul></section>
      <section><h3>Drei Argumente dagegen</h3><ul>{state.cons.map((argument, index) => <li key={index}>{argument}</li>)}</ul></section>
    </div>
    <figure className="brief-chart">
      <figcaption><strong>Ernte im Szenarienvergleich</strong><span>Salatfrischmasse · t/Jahr · Szenariojahr 2040 · [M]</span></figcaption>
      <div className="brief-chart-row"><span>Basis</span><div><i style={{ width: `${baseline.harvest / maxHarvest * 100}%` }} /></div><strong>{number(baseline.harvest / 1000)}</strong></div>
      <div className="brief-chart-row current"><span>Aktuell</span><div><i style={{ width: `${result.harvest / maxHarvest * 100}%` }} /></div><strong>{number(result.harvest / 1000)}</strong></div>
      <p>Aktuell: {number(input.footprint, 0)} m² Grundfläche · {number(input.usable * 100, 0)} % Nutzanteil · {input.levels} Ebenen · {number(input.yieldPerArea)} kg/(m²·a).</p>
      <p>Anbaufläche {number(result.cultivationArea, 0)} m²; Energie {number(result.energy / 1000)} MWh/Jahr; Frischwasserzusatz im Anbau {number(result.water / 1000)} m³/Jahr ({number(input.waterPerKg)} L/kg, Annahme), ohne Reinigung/Vorketten.</p>
      <p>Strom: {number(input.energyPerKg)} kWh/kg · {number(input.electricityPrice, 2)} €/kWh · {number(input.gridFactor, 3)} kgCO₂eq/kWh.</p>
      <p>Modellenergie vollständig als Strom, inklusive Klima/Pumpen. Stromfaktor veränderbar; Basis 2025 geschätzt [U], keine Prognose.</p>
      <p>Stromkosten {number(result.electricityPerKg, 2)} €/kg; Strombeitrag {number(result.emissionsPerKg, 2)} kgCO₂eq/kg.</p>
      <p>Aussage: mehr Anbaufläche kann mehr Ernte liefern. Grenze: konstante Ertragsannahme; keine Betriebsprognose, Vollkosten oder Gesamtklimabilanz.</p>
    </figure>
    <section className="brief-criteria-section">
      <h3>Fünf Kriterien: Urteile, keine Messwerte</h3>
      <div className="brief-criteria">{state.criteria.map(criterion => <div key={criterion.id}><strong>{criterion.label}</strong><b>{criterion.symbol}</b><p>{criterionEvidence(criterion)}</p></div>)}</div>
      <p className="brief-legend">+ dafür · ± bedingt · − dagegen · ? Daten fehlen</p>
    </section>
    <div className="brief-closing">
      <p><strong>Zwei Prioritäten:</strong> {state.priorities.map(id => state.criteria.find(criterion => criterion.id === id)?.label).join(', ')}. {state.priorityReason}</p>
      <p><strong>Stärkstes Gegenargument:</strong> {state.counterargument} <strong>Antwort:</strong> {state.response}</p>
      <p><strong>Größte Unsicherheit:</strong> {state.uncertainty}</p>
      <p><strong>Frage zum Zielkonflikt:</strong> {state.conflictQuestion}</p>
      <p><strong>Frage zum Vergleich:</strong> {state.comparisonQuestion}</p>
    </div>
    <footer className="brief-references"><strong>Kurzbelege</strong> {decisionReferences(state)}</footer>
  </article>
}

export default Brief
