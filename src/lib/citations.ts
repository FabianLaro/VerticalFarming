import { getSource } from '../data/catalog'
import type { Criterion, DecisionState } from '../components/Brief'

const sourceMarkers: Record<string, string> = {
  material: 'A', pennisi2025: 'P', stanghellini2024: 'S', dlr2019: 'D',
  dlr2020: 'D2', dlrresources2020: 'DR', dlrproject: 'DP', fraunhofer: 'F',
  altmarkt2019: 'F2', uba2026: 'U', blom2022: 'B', barbosa2015: 'AZ',
  regional: 'R', scenario: 'M',
}
const markerSources = Object.fromEntries(Object.entries(sourceMarkers).map(([id, marker]) => [marker, id]))
const printLocators: Record<string, string> = {
  material: 'M4 S. 4; M6 S. 6; Vorlage S. 7',
  uba2026: 'Tabelle 2, S. 16 (THG mit Vorketten)',
  blom2022: '§ 2.1.1–2, S. 3; Tabellen C.1–C.2',
  fraunhofer: 'Projektziele; Ergebnis: ALTMARKTgarten',
}

export function sourceIdForMarker(marker: string): string | undefined {
  return Object.hasOwn(markerSources, marker) ? markerSources[marker] : undefined
}

export function hasCitation(text: string): boolean {
  return [...text.matchAll(/\[([A-Z0-9]+(?:,\s*[A-Z0-9]+)*)\]/gu)]
    .some(match => match[1].split(',').every(marker => sourceIdForMarker(marker.trim())))
}

export function citationMarker(sourceId: string | null): string {
  const marker = sourceId && getSource(sourceId) && sourceMarkers[sourceId]
  return marker ? `[${marker}]` : '[Quelle offen]'
}

/** Only the old app's trailing citation is replaced; the authored statement is retained. */
export function evidenceWithoutCitation(text: string): string {
  return text.replace(/\s*\[((?:P|S|D2?|DR|DP|F2?|U|A|B|AZ|R|M)(?:\s*,\s*(?:P|S|D2?|DR|DP|F2?|U|A|B|AZ|R|M|M4\s+S\.\s*4))*)\](?=[.!?]?\s*$)/u, '').trim()
}

export function criterionEvidence(criterion: Criterion): string {
  const text = evidenceWithoutCitation(criterion.evidence)
  const punctuation = text.match(/[.!?]$/u)?.[0] ?? '.'
  return `${text.replace(/[.!?]$/u, '').trimEnd()} ${citationMarker(criterion.source)}${punctuation}`
}

export function selectCriterionSource(criterion: Criterion, sourceId: string): Criterion {
  if (!getSource(sourceId)) throw new RangeError('Unbekannte Quelle')
  return { ...criterion, source: sourceId, evidence: evidenceWithoutCitation(criterion.evidence) }
}

export function restoredCriterionSource(sourceId: unknown, fallback: string | null): string | null {
  return typeof sourceId === 'string' && getSource(sourceId) ? sourceId : fallback
}

export function sourceReference(sourceId: string): string {
  const source = getSource(sourceId)
  if (!source) return ''
  if (sourceId === 'scenario') return '[M] Eigene Annahmenrechnung, Stand 16.11.2026; Modellgrenzen im Quellenbereich.'
  const locator = printLocators[sourceId] ?? (sourceId === 'pennisi2025' ? source.locator : source.locator.split(';')[0])
  return `${citationMarker(sourceId)} ${source.short}, ${locator}${source.doi ? `, DOI:${source.doi}` : ''}.`
}

/** Selected criterion sources and citations still used elsewhere form the printed bibliography. */
export function decisionReferences(state: DecisionState): string {
  const ids = new Set(['scenario', 'blom2022'])
  state.criteria.forEach(criterion => { if (criterion.source && getSource(criterion.source)) ids.add(criterion.source) })
  const texts = [state.recommendation, ...state.conditions, ...state.pros, ...state.cons,
    state.priorityReason, state.counterargument, state.response, state.uncertainty,
    state.conflictQuestion, state.comparisonQuestion]
  for (const match of texts.join(' ').matchAll(/\[([^\]]+)\]/gu)) {
    for (const marker of match[1].split(',').map(value => value.trim())) {
      const id = sourceIdForMarker(marker)
      if (id) ids.add(id)
    }
  }
  return Object.keys(sourceMarkers).filter(id => ids.has(id)).map(sourceReference).join(' ')
}
