import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Input, Result } from '../lib/model'
import { Brief, INITIAL_DECISION, OPTIONS, briefText, countWords, recommendationSentences } from './Brief'
import type { CriterionId, DecisionState, Verdict } from './Brief'
import { getSource, sources } from '../data/catalog'
import { citationMarker, evidenceWithoutCitation, restoredCriterionSource, selectCriterionSource } from '../lib/citations'
import './decision.css'

const STORAGE_KEY = 'stadtlabor2040-decision-v1'
const MAX_BRIEF_HEIGHT = 273 * 96 / 25.4

function measureBrief(): number | null {
  const original = document.getElementById('decision-brief')
  if (!original) return null
  const copy = original.cloneNode(true) as HTMLElement
  copy.removeAttribute('id')
  copy.setAttribute('aria-hidden', 'true')
  copy.querySelector('.brief-invalid')?.remove()
  Object.assign(copy.style, { width: '186mm', padding: '0', minHeight: '0', height: 'auto', maxHeight: 'none', overflow: 'visible', visibility: 'hidden', position: 'absolute', left: '-100000px', top: '0', pointerEvents: 'none' })
  document.body.appendChild(copy)
  try { return Math.max(copy.getBoundingClientRect().height, copy.scrollHeight) }
  finally { copy.remove() }
}

type StoredDecision = DecisionState & { optionReviewed?: boolean }

function initialState(): { draft: DecisionState; confirmed: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredDecision
      const strings: (keyof DecisionState)[] = ['names', 'date', 'recommendation', 'priorityReason', 'counterargument', 'response', 'uncertainty', 'conflictQuestion', 'comparisonQuestion']
      const valid = ['A', 'B', 'C'].includes(parsed.option)
        && strings.every(key => typeof parsed[key] === 'string')
        && ['conditions', 'pros', 'cons'].every(key => {
          const value = parsed[key as 'conditions' | 'pros' | 'cons']
          return Array.isArray(value) && value.length === (key === 'conditions' ? 2 : 3) && value.every(item => typeof item === 'string')
        })
        && Array.isArray(parsed.priorities) && parsed.priorities.length <= 2
        && new Set(parsed.priorities).size === parsed.priorities.length
        && parsed.priorities.every(id => INITIAL_DECISION.criteria.some(criterion => criterion.id === id))
        && Array.isArray(parsed.criteria) && parsed.criteria.length === 5
        && parsed.criteria.every((criterion, index) => criterion.id === INITIAL_DECISION.criteria[index].id && typeof criterion.evidence === 'string' && ['+', '±', '−', '?'].includes(criterion.symbol))
      if (valid) return {
        confirmed: typeof parsed.optionReviewed === 'boolean' ? parsed.optionReviewed : parsed.option === 'B',
        draft: { ...parsed, goal: typeof parsed.goal === 'string' ? parsed.goal : INITIAL_DECISION.goal, criteria: parsed.criteria.map((criterion, index) => ({ ...INITIAL_DECISION.criteria[index], symbol: criterion.symbol, evidence: criterion.evidence, source: restoredCriterionSource(criterion.source, INITIAL_DECISION.criteria[index].source) })) },
      }
    }
  } catch { /* Local storage is optional, including in private browsing. */ }
  return { draft: structuredClone(INITIAL_DECISION), confirmed: true }
}

interface DecisionProps {
  input: Input
  result: Result
  onSource: (id: string) => void
}

const symbols: { value: Verdict; label: string }[] = [
  { value: '+', label: '+ spricht für Förderung' },
  { value: '±', label: '± nur unter Bedingungen' },
  { value: '−', label: '− spricht dagegen' },
  { value: '?', label: '? Daten fehlen' },
]

const optionComparison: Record<'A' | 'B' | 'C', { symbol: Verdict; evidence: string; source: string }[]> = {
  A: [
    { symbol: '±', evidence: 'Salatbeitrag möglich; Umfang für die Stadt offen.', source: 'dlr2019' },
    { symbol: '?', evidence: 'Für einen breiten Ausbau fehlt die Standort-Ökobilanz.', source: 'scenario' },
    { symbol: '?', evidence: 'Investition, Vollkosten und Absatz sind nicht belegt.', source: 'scenario' },
    { symbol: '?', evidence: 'Bezahlbarer Zugang und Einkommenswirkungen sind offen.', source: 'material' },
    { symbol: '?', evidence: 'Netz, Gebäude und Abnehmer sind vor Ausbau zu prüfen.', source: 'fraunhofer' },
  ],
  B: INITIAL_DECISION.criteria.map(criterion => ({ symbol: criterion.symbol, evidence: criterion.evidence, source: criterion.source ?? 'scenario' })),
  C: [
    { symbol: '±', evidence: 'Andere Kulturen und Versorgungswege möglich; lokale Mengen offen.', source: 'fraunhofer' },
    { symbol: '±', evidence: 'Sonnenlicht nutzbar; Heizenergie und Saison entscheiden mit.', source: 'regional' },
    { symbol: '?', evidence: 'Förderkosten und betrieblicher Absatz auch hier ungeprüft.', source: 'scenario' },
    { symbol: '?', evidence: 'Verteilung von Nutzen, Einkommen und Zugang offen.', source: 'material' },
    { symbol: '±', evidence: 'Vorhandene Betriebe und Logistik auf Eignung prüfen.', source: 'scenario' },
  ],
}

export function Decision({ input, result, onSource }: DecisionProps) {
  const editor = useRef<HTMLElement>(null)
  const [initial] = useState(initialState)
  const [state, setState] = useState(initial.draft)
  const [confirmed, setConfirmed] = useState(initial.confirmed)
  const [showPreview, setShowPreview] = useState(false)
  const [saved, setSaved] = useState(true)
  const [layoutHeight, setLayoutHeight] = useState<number | null>(null)
  const words = countWords(briefText(state, input, result))
  const sentences = recommendationSentences(state)
  const requiredTexts = [state.goal, state.recommendation, ...state.conditions, ...state.pros, ...state.cons, state.priorityReason, state.counterargument, state.response, state.uncertainty, state.conflictQuestion, state.comparisonQuestion, ...state.criteria.map(criterion => criterion.evidence)]
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(state.date) && Number.isFinite(Date.parse(state.date)) && new Date(state.date).toISOString().slice(0, 10) === state.date
  const contentValid = confirmed && [...state.pros, ...state.cons].every(t => /\[(?:P|S|D|F|M|A|B|U|R|AZ)(?:,\s*(?:P|S|D|F|M|A|B|U|R|AZ))*\]/.test(t)) && words <= 450 && sentences <= 3 && sentences > 0 && state.priorities.length === 2 && requiredTexts.every(text => text.trim().length > 0) && state.names.trim().length > 0 && validDate
  const fitsPage = layoutHeight !== null && layoutHeight <= MAX_BRIEF_HEIGHT
  const valid = contentValid && fitsPage

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, optionReviewed: confirmed })); setSaved(true) }
    catch { setSaved(false) }
  }, [state, confirmed])

  useEffect(() => {
    setLayoutHeight(null)
    const frame = requestAnimationFrame(() => setLayoutHeight(measureBrief()))
    return () => cancelAnimationFrame(frame)
  }, [state, input, result])

  useLayoutEffect(() => {
    const section = editor.current
    const resize = () => editor.current?.querySelectorAll('textarea').forEach(field => {
      field.style.height = 'auto'
      field.style.height = `${field.scrollHeight + 2}px`
    })
    resize()
    window.addEventListener('resize', resize)
    section?.addEventListener('toggle', resize, true)
    return () => {
      window.removeEventListener('resize', resize)
      section?.removeEventListener('toggle', resize, true)
    }
  }, [state])

  function printBrief() {
    const height = measureBrief()
    setLayoutHeight(height)
    if (contentValid && height !== null && height <= MAX_BRIEF_HEIGHT) window.print()
  }

  function update<K extends keyof DecisionState>(key: K, value: DecisionState[K]) {
    setState(previous => ({ ...previous, [key]: value }))
  }

  function togglePriority(id: CriterionId) {
    update('priorities', state.priorities.includes(id) ? state.priorities.filter(value => value !== id) : state.priorities.length < 2 ? [...state.priorities, id] : state.priorities)
  }

  function editList(key: 'pros' | 'cons' | 'conditions', index: number, value: string) {
    const updated = [...state[key]]
    updated[index] = value
    setState(previous => ({ ...previous, [key]: updated }))
  }

  return <div className="atlas-decision-grid">
    <section ref={editor} className="decision-panel no-print" aria-labelledby="decision-heading" data-print-height={layoutHeight ?? undefined}>
      <h2 id="decision-heading" className="visually-hidden">Förderurteil bearbeiten</h2>
      <label className="decision-field atlas-goal">Öffentliches Förderziel<textarea rows={2} maxLength={160} value={state.goal} onChange={event => update('goal', event.target.value)} /></label>

      <fieldset className="decision-options"><legend>Welche Förderung empfiehlst du?</legend>{OPTIONS.map(option => <label key={option.id} className={state.option === option.id ? 'decision-option selected' : 'decision-option'}><input type="radio" name="funding-option" value={option.id} checked={state.option === option.id} onChange={() => { update('option', option.id); setConfirmed(false) }} /><span className="option-letter">{option.id}</span><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</fieldset>

      {!confirmed && <p role="alert">Förderoption geändert. Prüfe Empfehlung, Bedingungen und Kriterien. <button type="button" onClick={() => setConfirmed(true)}>Begründung geprüft</button></p>}
      <details className="decision-details option-comparison"><summary>Förderoptionen anhand der fünf Kriterien vergleichen</summary><p>Beispielurteile als Diskussionsgrundlage. Standortdaten fehlen; die Symbole ergeben keine Rangliste.</p><div className="option-comparison-scroll" tabIndex={0} role="region" aria-label="Vergleich der Förderoptionen, horizontal scrollbar"><table><caption>Qualitativer Vergleich von A, B und C</caption><thead><tr><th scope="col">Kriterium</th>{OPTIONS.map(option => <th key={option.id} scope="col">{option.id} · {option.label}</th>)}</tr></thead><tbody>{INITIAL_DECISION.criteria.map((criterion, index) => <tr key={criterion.id}><th scope="row">{criterion.label}</th>{OPTIONS.map(option => { const assessment = optionComparison[option.id][index]; return <td key={option.id}><strong className="comparison-verdict" aria-label={symbols.find(symbol => symbol.value === assessment.symbol)?.label}>{assessment.symbol}</strong><p>{assessment.evidence}</p><button type="button" className="source-button" onClick={() => onSource(assessment.source)}>Beleg / Grenze</button></td> })}</tr>)}</tbody></table></div><p className="decision-hint">+ dafür · ± nur unter Bedingungen · − dagegen · ? Daten fehlen</p></details>

      <details className="decision-details decision-priorities" open><summary>Zwei wichtigste Kriterien <span>{state.criteria.filter(criterion => state.priorities.includes(criterion.id)).map(criterion => criterion.label).join(' · ') || 'Noch auswählen'}</span></summary><p>Wähle genau zwei und begründe ihre Priorität. Es gibt keine Gesamtnote.</p><div className="priority-choices">{state.criteria.map(criterion => <label key={criterion.id} className={state.priorities.includes(criterion.id) ? 'priority-choice chosen' : 'priority-choice'}><input type="checkbox" checked={state.priorities.includes(criterion.id)} onChange={() => togglePriority(criterion.id)} disabled={state.priorities.length === 2 && !state.priorities.includes(criterion.id)} /><span>{criterion.label}</span></label>)}</div><label className="decision-field">Warum diese beiden?<textarea aria-label="Warum diese beiden?" rows={2} maxLength={300} value={state.priorityReason} onChange={event => update('priorityReason', event.target.value)} /></label></details>

      <div className="atlas-criteria-strip" aria-label="Kriterienübersicht">{state.criteria.map(criterion => <div key={criterion.id} className={state.priorities.includes(criterion.id) ? 'is-priority' : undefined}><b>{criterion.symbol}</b><span>{criterion.label}</span></div>)}</div>
      <details className="decision-details decision-criteria"><summary>Bewertung und Belege <span>5 Kriterien</span></summary><p className="symbol-help">+ dafür · ± nur unter Bedingungen · − dagegen · ? Daten fehlen</p>
        <p className="decision-hint">Die Quelle muss deinen Belegtext stützen. Kurzbeleg und Druckreferenz folgen deiner Auswahl.</p>
        {state.criteria.map((criterion, index) => {
          const source = criterion.source ? getSource(criterion.source) : undefined
          return <div className="criterion-editor" key={criterion.id}>
            <label htmlFor={`verdict-${criterion.id}`}>{criterion.label}</label>
            <select id={`verdict-${criterion.id}`} value={criterion.symbol} onChange={event => update('criteria', state.criteria.map((item, itemIndex) => itemIndex === index ? { ...item, symbol: event.target.value as Verdict } : item))}>{symbols.map(symbol => <option key={symbol.value} value={symbol.value}>{symbol.label}</option>)}</select>
            <label className="criterion-evidence"><span className="visually-hidden">Beleg für {criterion.label}</span><textarea aria-label={'Beleg für ' + criterion.label} rows={2} maxLength={180} value={evidenceWithoutCitation(criterion.evidence)} onChange={event => update('criteria', state.criteria.map((item, itemIndex) => itemIndex === index ? { ...item, evidence: event.target.value } : item))} /></label>
            <div className="criterion-source">
              <label htmlFor={`source-${criterion.id}`}>Quelle für {criterion.label}</label>
              <select id={`source-${criterion.id}`} value={criterion.source ?? ''} onChange={event => update('criteria', state.criteria.map((item, itemIndex) => itemIndex === index ? selectCriterionSource(item, event.target.value) : item))}>
                {!criterion.source && <option value="" disabled>Quelle auswählen</option>}
                {sources.map(item => <option key={item.id} value={item.id}>{citationMarker(item.id)} {item.short}</option>)}
              </select>
              {source && <><details className="criterion-reference-detail"><summary>Fundstelle</summary><p className="criterion-reference" aria-live="polite"><strong>{citationMarker(source.id)} {source.short}</strong><span>{source.locator}</span></p></details><button className="source-button" type="button" onClick={() => onSource(source.id)}>Quelle und Grenzen lesen</button></>}
            </div>
          </div>
        })}
      </details>


      <section className="atlas-recommendation"><h2>Empfehlung und Bedingungen</h2><div className="decision-details-content"><label className="decision-field">Empfehlung mit wichtigster Begründung<textarea aria-label="Empfehlung mit wichtigster Begründung" rows={2} maxLength={350} value={state.recommendation} onChange={event => update('recommendation', event.target.value)} /></label>{state.conditions.map((condition, index) => <label className="decision-field" key={index}>Bedingung {index + 1}<textarea aria-label={'Bedingung ' + (index + 1)} rows={2} maxLength={260} value={condition} onChange={event => editList('conditions', index, event.target.value)} /></label>)}<p className={sentences <= 3 ? 'decision-hint' : 'decision-hint invalid'}>Empfehlung und Bedingungen: {sentences} / höchstens 3 Sätze. Pro Feld ist ein Satz vorgesehen.</p>{state.option === 'C' && <p className="decision-hint">Begründe bei C, weshalb der andere Ansatz das öffentliche Förderziel besser erreicht.</p>}</div></section>

      <details className="decision-details"><summary>Drei Argumente dafür, drei dagegen</summary><div className="decision-arguments-editor"><div><h3>Dafür</h3>{state.pros.map((argument, index) => <label className="decision-field" key={index}>Argument {index + 1}<textarea aria-label={'Argument ' + (index + 1) + ' dafür'} rows={2} maxLength={190} value={argument} onChange={event => editList('pros', index, event.target.value)} /></label>)}</div><div><h3>Dagegen</h3>{state.cons.map((argument, index) => <label className="decision-field" key={index}>Argument {index + 1}<textarea aria-label={'Argument ' + (index + 1) + ' dagegen'} rows={2} maxLength={190} value={argument} onChange={event => editList('cons', index, event.target.value)} /></label>)}</div><p className="decision-hint">Kurzbelege [P], [S], [D], [F] und [M] werden im Brief aufgelöst. Prüfe bei eigenen Argumenten, ob der Beleg die Aussage tatsächlich trägt.</p><div className="decision-source-links"><button type="button" onClick={() => onSource('pennisi2025')}>[P] Pennisi</button><button type="button" onClick={() => onSource('stanghellini2024')}>[S] Stanghellini/Katzin</button><button type="button" onClick={() => onSource('dlr2019')}>[D] DLR</button><button type="button" onClick={() => onSource('fraunhofer')}>[F] Fraunhofer</button></div></div></details>

      <details className="decision-details"><summary>Gegenargument, Unsicherheit und Diskussionsfragen</summary><div className="decision-details-content">{([
        ['counterargument', 'Stärkstes Gegenargument'], ['response', 'Antwort darauf'], ['uncertainty', 'Größte verbleibende Unsicherheit'], ['conflictQuestion', 'Offene Frage zu einem Zielkonflikt'], ['comparisonQuestion', 'Offene Frage zum Vergleich mit einem anderen Ansatz'],
      ] as const).map(([key, label]) => <label className="decision-field" key={key}>{label}<textarea aria-label={label} rows={2} maxLength={240} value={state[key]} onChange={event => update(key, event.target.value)} /></label>)}</div></details>

      <details className="decision-details"><summary>Name, Datum und Beispiel zurücksetzen</summary><div className="decision-details-content"><div className="decision-identification"><label className="decision-field">Name(n)<input type="text" maxLength={100} value={state.names} onChange={event => update('names', event.target.value)} /></label><label className="decision-field">Datum<input type="date" value={state.date} onChange={event => update('date', event.target.value)} /></label></div><button type="button" className="secondary-button" onClick={() => (setState(structuredClone(INITIAL_DECISION)), setConfirmed(true))}>Beispielposition wiederherstellen</button><small>{saved ? 'Deine Position wird nur in diesem Browser auf diesem Gerät gespeichert.' : 'Speichern im Browser ist nicht möglich. Änderungen gelten für diese Sitzung.'}</small></div></details>

      {!valid && <p className="decision-validation" role="status">Vor dem Export: höchstens 450 Wörter, höchstens drei Empfehlungssätze, genau zwei Prioritäten, Name und Datum sowie alle Pflichtfelder ausfüllen. Das Layout muss auf eine A4-Seite passen.</p>}
      <div className="atlas-counter-summary"><strong>Stärkstes Gegenargument</strong><p>{state.counterargument} {state.response}</p></div>
      <details className="atlas-details atlas-environment"><summary>Umwelt am Standort prüfen</summary><p>Klima braucht eine Vollbilanz. Bei Boden und Biodiversität zählen Versiegelung und Lebensräume. Beim Wasser gehören Abwasser und Nährstoffverluste zur Prüfung. Für eine Anlagenbilanz fehlen außerdem Material- und Gebäudedaten.</p></details>
      {!valid && <p className="decision-validation" role="status">Für den Export müssen Ziel, Name, Datum, Pflichtfelder und sechs Kurzbelege vorliegen. Wähle zwei Prioritäten und kürze die Empfehlung bei Bedarf auf drei Sätze.</p>}
    </section>

    <aside className={`atlas-preview ${showPreview ? 'atlas-preview-open' : ''}`} aria-label="Decision Brief">
      <div className="atlas-preview-header no-print">
        <div><h2>Decision Brief</h2><span aria-live="polite">{words} / 450 Wörter · {layoutHeight === null ? 'Drucklayout wird geprüft' : fitsPage ? 'A4' : 'Text kürzen'}</span></div>
        <button type="button" className="atlas-outline atlas-preview-toggle" onClick={() => setShowPreview(value => !value)} aria-expanded={showPreview}>{showPreview ? 'Vorschau schließen' : 'Vorschau öffnen'}</button>
        <button type="button" className="atlas-primary atlas-print" onClick={printBrief} disabled={!valid}>PDF drucken</button>
      </div>
      <div className="atlas-paper"><Brief state={state} input={input} result={result} valid={valid} /></div>
    </aside>
  </div>
}

export default Decision
