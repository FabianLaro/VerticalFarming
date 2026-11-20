import type { Input, Result } from '../lib/model'
import { compare } from '../lib/model'
import { getSource } from '../data/catalog'
import { criterionEvidence, decisionReferences, sourceIdForMarker } from '../lib/citations'

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
  goal: string
  siteBasis?: string
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
  goal: 'Belastbare Betriebsdaten für eine mögliche regionale Salatversorgung öffentlicher Küchen gewinnen.',
  recommendation: 'Dinslaken sollte einen befristeten Pilot fördern, um den Nutzen einer umgenutzten Halle und den Strombedarf zu prüfen.',
  conditions: [
    'Vor Bewilligung müssen Netzanschluss, Stromherkunft und die zugesagte Abnahmemenge einer öffentlichen Küche belegt sein.',
    'Nach zwölf Monaten entscheidet die Stadt anhand vorab festgelegter Grenzwerte für Liefermenge, kWh/kg und Vollkosten/kg über die Fortsetzung.',
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

function footprintComparison(input: Input, result: Result) {
  const rows = compare(input, 'harvest', result.harvest)
  return {
    title: 'Grundfläche bei gleicher Jahresernte',
    caption: `m² für ${number(result.harvest / 1000)} t Salat/Jahr · VF-Szenario 2040 [M], NL-Referenzen [B]`,
    rows,
    note: 'Direkte Grundfläche. Referenzjahre: Gewächshaus 2019, Freiland 1985/2009. Keine Standort- oder Ökobilanz.',
  }
}

export function briefText(state: DecisionState, input: Input, result: Result): string {
  const chart = footprintComparison(input, result)
  return [
    'STADTLABOR 2040 Decision Brief Soll Dinslaken Vertical Farming fördern?',
    'Szenariomodell', state.names, '·', dateLabel(state.date),
    'Öffentliches Ziel', state.goal,
    `${state.option} · ${OPTIONS.find(option => option.id === state.option)?.label}`,
    ...(state.siteBasis ? ['Eure Standortangaben', state.siteBasis] : []),
    'Empfehlung und zwei Bedingungen', state.recommendation, ...state.conditions,
    'Drei Argumente dafür', ...state.pros, 'Drei Argumente dagegen', ...state.cons,
    chart.title, chart.caption,
    chart.rows.map(row => `${row.label} ${number(row.footprint, 0)}`).join(' '), chart.note,
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
  onSource?: (id: string) => void
}

export function Brief({ state, input, result, valid, onSource }: BriefProps) {
  function cite(text: string) {
    if (!onSource) return text
    return text.split(/(\[[A-Z0-9]+(?:,\s*[A-Z0-9]+)*\])/gu).map((part, index) => {
      if (index % 2 === 0) return part
      const tokens = part.split(/([A-Z0-9]+)/gu)
      if (tokens.some((token, position) => position % 2 && !sourceIdForMarker(token))) return part
      return <span key={index} className="brief-citations">{tokens.map((token, position) => {
        const id = position % 2 ? sourceIdForMarker(token) : undefined
        return id ? <button type="button" key={position} aria-label={`Quelle ${getSource(id)?.short}`} onClick={() => onSource(id)}>{token}</button> : token
      })}</span>
    })
  }

  const chart = footprintComparison(input, result)
  const maxFootprint = Math.max(...chart.rows.map(row => row.footprint), 1)
  return <article className="brief" id="decision-brief" aria-label="Druckbarer Decision Brief">
    <header className="brief-header">
      <div><span className="brief-brand">STADTLABOR 2040</span><span>Decision Brief</span></div>
      <p>{state.names} · {dateLabel(state.date)}</p>
    </header>
    <h1>Soll Dinslaken Vertical Farming fördern?</h1>
    <p className="brief-model-label">Szenariomodell</p>
    {!valid && <p className="brief-invalid">Noch nicht abgabefertig: Wort-, Satz- oder Prioritätenvorgabe prüfen.</p>}
    <section className="brief-recommendation">
      <h2>{state.option} · {OPTIONS.find(option => option.id === state.option)?.label}</h2>
      <p><strong>Öffentliches Ziel</strong> {state.goal}</p>
      {state.siteBasis && <p><strong>Eure Standortangaben</strong> {state.siteBasis}</p>}
      <h3>Empfehlung und zwei Bedingungen</h3>
      <p>{cite(state.recommendation)}</p>
      <ol>{state.conditions.map((condition, index) => <li key={index}>{cite(condition)}</li>)}</ol>
    </section>
    <div className="brief-arguments">
      <section><h3>Drei Argumente dafür</h3><ul>{state.pros.map((argument, index) => <li key={index}>{cite(argument)}</li>)}</ul></section>
      <section><h3>Drei Argumente dagegen</h3><ul>{state.cons.map((argument, index) => <li key={index}>{cite(argument)}</li>)}</ul></section>
    </div>
    <figure className="brief-chart">
      <figcaption><strong>{chart.title}</strong><span>{cite(chart.caption)}</span></figcaption>
      {chart.rows.map(row => <div key={row.system} className={`brief-chart-row atlas-system-${row.system}`}><span>{row.label}</span><div><i style={{ width: `${row.footprint / maxFootprint * 100}%` }} /></div><strong>{number(row.footprint, 0)}</strong></div>)}
      <p>{chart.note}</p>
    </figure>
    <section className="brief-criteria-section">
      <h3>Fünf Kriterien: Urteile, keine Messwerte</h3>
      <div className="brief-criteria">{state.criteria.map(criterion => <div key={criterion.id}><strong>{criterion.label}</strong><b>{criterion.symbol}</b><p>{cite(criterionEvidence(criterion))}</p></div>)}</div>
      <p className="brief-legend">+ dafür · ± bedingt · − dagegen · ? Daten fehlen</p>
    </section>
    <div className="brief-closing">
      <p><strong>Zwei Prioritäten:</strong> {state.priorities.map(id => state.criteria.find(criterion => criterion.id === id)?.label).join(', ')}. {state.priorityReason}</p>
      <p><strong>Stärkstes Gegenargument:</strong> {cite(state.counterargument)} <strong>Antwort:</strong> {cite(state.response)}</p>
      <p><strong>Größte Unsicherheit:</strong> {state.uncertainty}</p>
      <p><strong>Frage zum Zielkonflikt:</strong> {state.conflictQuestion}</p>
      <p><strong>Frage zum Vergleich:</strong> {state.comparisonQuestion}</p>
    </div>
    <footer className="brief-references"><strong>Kurzbelege</strong> {decisionReferences(state)}</footer>
  </article>
}

export default Brief
