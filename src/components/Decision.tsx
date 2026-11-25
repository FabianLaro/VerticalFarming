import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PARAMS, calculate } from '../lib/model'
import type { Input, InputKey, Result } from '../lib/model'
import type { Dispatch, SetStateAction } from 'react'
import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { Brief, INITIAL_DECISION, OPTIONS, argumentFocus, briefText, countWords, recommendationSentences } from './Brief'
import type { CriterionId, DecisionState, Verdict } from './Brief'
import { getSource, sources } from '../data/catalog'
import { citationMarker, citeArgument, hasCitation, evidenceWithoutCitation, restoredCriterionSource, selectCriterionSource, splitArgument } from '../lib/citations'
import { FundingQuestionnaire, FundingSummary } from './FundingQuestionnaire'
import { evaluateFunding, fundingQuestions, hasFundingPriorities, openSiteAnswers, restoreAnswers, restoreFundingReview } from '../lib/funding-questionnaire'
import type { Answers, FundingReview, QuestionId } from '../lib/funding-questionnaire'
import './decision.css'

const STORAGE_KEY = 'stadtlabor2040-decision-v1'
const GENERATED_KEY = 'stadtlabor2040-decision-generated-v1'
const QUESTIONNAIRE_KEY = 'stadtlabor2040-funding-answers-v1'
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

type StoredDecision = DecisionState & { optionReviewed?: boolean; farmArguments?: boolean }

const emptyArguments = (): DecisionState['pros'] => ['', '', '']

function newBrief(draft: DecisionState): DecisionState {
  return { ...draft, names: '', date: new Date().toLocaleDateString('sv-SE'), pros: emptyArguments(), cons: emptyArguments(), counterargument: '', response: '' }
}

function initialState(storageKey: string, fallback = INITIAL_DECISION): { draft: DecisionState; confirmed: boolean } {
  try {
    const raw = localStorage.getItem(storageKey)
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
      // Older generated briefs for C listed reasons for the alternative under "Dafür".
      const reverseArguments = storageKey === GENERATED_KEY && !parsed.farmArguments && fallback.option === 'C'
      if (valid) return {
        confirmed: typeof parsed.optionReviewed === 'boolean' ? parsed.optionReviewed : parsed.option === 'B',
        draft: { ...parsed, pros: reverseArguments ? parsed.cons : parsed.pros, cons: reverseArguments ? parsed.pros : parsed.cons, siteBasis: typeof parsed.siteBasis === 'string' ? parsed.siteBasis : undefined, scenarioBasis: typeof parsed.scenarioBasis === 'string' ? parsed.scenarioBasis : undefined, goal: typeof parsed.goal === 'string' ? parsed.goal : INITIAL_DECISION.goal, criteria: parsed.criteria.map((criterion, index) => ({ ...INITIAL_DECISION.criteria[index], symbol: criterion.symbol, evidence: criterion.evidence, source: restoredCriterionSource(criterion.source, INITIAL_DECISION.criteria[index].source) })) },
      }
    }
  } catch { /* Local storage is optional, including in private browsing. */ }
  return { draft: structuredClone(fallback), confirmed: true }
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

function FundingOptionComparison({ onSource }: Pick<DecisionProps, 'onSource'>) {
  return <details className="decision-details option-comparison"><summary>Förderoptionen anhand der fünf Kriterien vergleichen</summary><p>Beispielurteile als Diskussionsgrundlage. Standortdaten fehlen; die Symbole ergeben keine Rangliste.</p><div className="option-comparison-scroll" tabIndex={0} role="region" aria-label="Vergleich der Förderoptionen, horizontal scrollbar"><table><caption>Qualitativer Vergleich von A, B und C</caption><thead><tr><th scope="col">Kriterium</th>{OPTIONS.map(option => <th key={option.id} scope="col">{option.id} · {option.label}</th>)}</tr></thead><tbody>{INITIAL_DECISION.criteria.map((criterion, index) => <tr key={criterion.id}><th scope="row">{criterion.label}</th>{OPTIONS.map(option => { const assessment = optionComparison[option.id][index]; return <td key={option.id}><strong className="comparison-verdict" aria-label={symbols.find(symbol => symbol.value === assessment.symbol)?.label}>{assessment.symbol}</strong><p>{assessment.evidence}</p><button type="button" className="source-button" onClick={() => onSource(assessment.source)}>Beleg / Grenze</button></td> })}</tr>)}</tbody></table></div><p className="decision-hint">+ dafür · ± nur unter Bedingungen · − dagegen · ? Daten fehlen</p></details>
}

function DecisionEditor({ input, result, onSource, generated, onDraftChange }: DecisionProps & { generated?: DecisionState; onDraftChange?: (draft: DecisionState) => void }) {
  const storageKey = generated ? GENERATED_KEY : STORAGE_KEY
  const editor = useRef<HTMLElement>(null)
  const [initial] = useState(() => initialState(storageKey, generated))
  const [state, setState] = useState(initial.draft)
  const [confirmed, setConfirmed] = useState(initial.confirmed)
  const [showPreview, setShowPreview] = useState(false)
  const [saved, setSaved] = useState(true)
  const [layoutHeight, setLayoutHeight] = useState<number | null>(null)
  const words = countWords(briefText(state, input, result))
  const sentences = recommendationSentences(state)
  const focus = argumentFocus(state)
  const missingArguments = [...state.pros, ...state.cons].some(argument => !splitArgument(argument).text.trim() || !hasCitation(argument))
  const missingDetails = [state.goal, state.recommendation, ...state.conditions, state.priorityReason, state.uncertainty, state.conflictQuestion, state.comparisonQuestion, ...state.criteria.map(criterion => criterion.evidence)].some(text => !text.trim())
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(state.date) && Number.isFinite(Date.parse(state.date)) && new Date(state.date).toISOString().slice(0, 10) === state.date
  const missing = [
    !state.names.trim() || !validDate ? 'Tragt Namen und Datum ein.' : '',
    missingArguments ? 'Ergänzt je drei Argumente mit einer Quelle.' : '',
    !state.response.trim() ? 'Beantwortet den stärksten Einwand.' : '',
    state.priorities.length !== 2 || missingDetails ? 'Vervollständigt die Angaben unter „Brief fertig machen“.' : '',
    !confirmed ? 'Prüft die Begründung für eure neue Empfehlung.' : '',
    sentences > 3 ? 'Kürzt Empfehlung und Bedingungen auf zusammen drei Sätze.' : '',
    words > 450 ? 'Kürzt den Brief auf höchstens 450 Wörter.' : '',
  ].filter(Boolean)
  const contentValid = missing.length === 0
  const fitsPage = layoutHeight !== null && layoutHeight <= MAX_BRIEF_HEIGHT
  const valid = contentValid && fitsPage

  useEffect(() => {
    onDraftChange?.(state)
    try { localStorage.setItem(storageKey, JSON.stringify({ ...state, optionReviewed: confirmed, farmArguments: true })); setSaved(true) }
    catch { setSaved(false) }
  }, [state, confirmed, storageKey, onDraftChange])

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
    setState(previous => {
      const updated = [...previous[key]]
      updated[index] = value
      return { ...previous, [key]: updated }
    })
  }

  function addExamples() {
    setState(previous => {
      const fill = (side: 'pros' | 'cons') => previous[side].map((value, index) => value.trim() || INITIAL_DECISION[side][index]) as DecisionState['pros']
      return { ...previous, pros: fill('pros'), cons: fill('cons') }
    })
  }

  function argumentFields(side: 'pros' | 'cons', label: string) {
    const isPro = side === 'pros'
    return <fieldset className="argument-fields">
      <legend>{label}</legend>
      {state[side].map((argument, index) => {
        const field = `Argument ${index + 1} ${isPro ? 'dafür' : 'dagegen'}`
        const { text, sources: selected } = splitArgument(argument)
        return <div className="argument-field" key={index}>
          <label className="decision-field">{index === 0 ? 'Stärkstes Argument' : `Argument ${index + 1}`}
            <textarea aria-label={field} rows={2} maxLength={190} value={text}
              placeholder={index === 0 ? (isPro ? 'Ein Vorteil für die Stadt …' : 'Ein Risiko für die Stadt …') : undefined}
              onChange={event => editList(side, index, citeArgument(event.target.value, selected))} />
          </label>
          <div className="argument-source">
            <label>Quelle
              <select aria-label={`Quelle für ${field}`} value={selected.join(',')} onChange={event => {
                const value = event.target.value
                editList(side, index, citeArgument(text, value ? value.split(',') : []))
              }}>
                <option value="">Quelle auswählen</option>
                {selected.length > 1 && <option value={selected.join(',')}>{selected.map(id => getSource(id)?.short).join(' + ')}</option>}
                {sources.map(source => <option key={source.id} value={source.id}>{source.short}</option>)}
              </select>
            </label>
            {selected.map(id => <button key={id} type="button" className="atlas-text" onClick={() => onSource(id)} aria-label={`Quelle öffnen: ${getSource(id)?.short}`}>Beleg {citationMarker(id)} ansehen</button>)}
          </div>
        </div>
      })}
    </fieldset>
  }

  const identification = <div className="decision-identification"><label className="decision-field">Name(n)<input type="text" maxLength={100} value={state.names} onChange={event => update('names', event.target.value)} /></label><label className="decision-field">Datum<input type="date" value={state.date} onChange={event => update('date', event.target.value)} /></label></div>

  return <div className="atlas-decision-grid">
    <section ref={editor} className="decision-panel no-print" aria-labelledby="decision-heading" data-print-height={layoutHeight ?? undefined}>
      <h2 id="decision-heading">Euren Brief schreiben</h2>
      <section className="decision-step">
        <h3>1. Argumente sammeln</h3>
        <p>Was spricht für oder gegen eine Vertical Farm in Dinslaken? Setzt euer stärkstes Argument jeweils nach oben. Wählt zu jedem Punkt eine Quelle, die ihn stützt.</p>
        <button type="button" className="atlas-text" onClick={addExamples}>Freie Felder mit Beispielen füllen</button>
        <div className="decision-arguments-editor">{argumentFields('pros', 'Für die Förderung')}{argumentFields('cons', 'Gegen die Förderung')}</div>
      </section>
      <section className="decision-step">
        <h3>2. Argumente abwägen</h3>
        <fieldset className="decision-options"><legend>Was soll die Stadt tun?</legend>{OPTIONS.map(option => <label key={option.id} className={state.option === option.id ? 'decision-option selected' : 'decision-option'}><input type="radio" name="funding-option" value={option.id} checked={state.option === option.id} onChange={() => { update('option', option.id); setConfirmed(false) }} /><span className="option-letter">{option.id}</span><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</fieldset>
        <dl className="decision-weighing">
          <div><dt>Wichtigster Grund für eure Wahl</dt><dd>{splitArgument(focus.reasonText).text.trim() || 'Ergänzt das erste Argument auf der passenden Seite.'}</dd></div>
          <div><dt>Stärkster Einwand gegen eure Wahl</dt><dd>{splitArgument(focus.objectionText).text.trim() || 'Ergänzt das erste Argument auf der anderen Seite.'}</dd></div>
        </dl>
        {state.counterargument.trim() && <button type="button" className="atlas-text" onClick={() => update('counterargument', '')}>Erstes Argument als Einwand übernehmen</button>}
        <label className="decision-field">Unsere Antwort auf den Einwand
          <textarea rows={2} maxLength={240} value={state.response} onChange={event => update('response', event.target.value)}
            placeholder="Der Einwand ist wichtig. Wir empfehlen trotzdem …, weil …" />
        </label>
        {!confirmed && <p className="decision-hint">Prüft, ob eure Erklärung und die zwei Bedingungen zur neuen Wahl passen. <button type="button" className="atlas-text" onClick={() => setConfirmed(true)}>Begründung geprüft</button></p>}
      </section>
      <section className="decision-step">
        <h3>3. Brief fertig machen</h3>
        {identification}
        <details className="decision-details atlas-recommendation"><summary>Empfehlung und Bedingungen</summary>
          <label className="decision-field">Eure Empfehlung mit Begründung<textarea aria-label="Empfehlung mit wichtigster Begründung" rows={2} maxLength={350} value={state.recommendation} onChange={event => update('recommendation', event.target.value)} /></label>
          {state.conditions.map((condition, index) => <label className="decision-field" key={index}>Bedingung {index + 1}<textarea rows={2} maxLength={260} value={condition} onChange={event => editList('conditions', index, event.target.value)} /></label>)}
          <p className={sentences <= 3 ? 'decision-hint' : 'decision-hint invalid'}>{sentences} von 3 Sätzen. Schreibt je einen Satz pro Feld.</p>
        </details>
        <details className="decision-details"><summary>Ziel der Stadt und zwei wichtigste Kriterien</summary>
          <label className="decision-field atlas-goal">Ziel der Stadt<textarea rows={2} maxLength={160} value={state.goal} onChange={event => update('goal', event.target.value)} /></label>
          <div className="priority-choices">{state.criteria.map(criterion => <label key={criterion.id} className={state.priorities.includes(criterion.id) ? 'priority-choice chosen' : 'priority-choice'}><input type="checkbox" checked={state.priorities.includes(criterion.id)} onChange={() => togglePriority(criterion.id)} disabled={state.priorities.length === 2 && !state.priorities.includes(criterion.id)} /><span>{criterion.label}</span></label>)}</div>
          <label className="decision-field">Warum diese beiden?<textarea rows={2} maxLength={300} value={state.priorityReason} onChange={event => update('priorityReason', event.target.value)} /></label>
        </details>
        <details className="decision-details decision-criteria"><summary>Bewertung und Belege</summary><p className="symbol-help">+ dafür · ± nur unter Bedingungen · − dagegen · ? Daten fehlen</p>
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

        <details className="decision-details"><summary>Offene Fragen für die Diskussion</summary>
          {([
            ['uncertainty', 'Welche wichtige Information fehlt noch?'],
            ['conflictQuestion', 'Welche Ziele geraten aneinander?'],
            ['comparisonQuestion', 'Was wollt ihr mit Gewächshaus oder Freiland vergleichen?'],
          ] as const).map(([key, label]) => <label className="decision-field" key={key}>{label}<textarea rows={2} maxLength={240} value={state[key]} onChange={event => update(key, event.target.value)} /></label>)}
        </details>
        <FundingOptionComparison onSource={onSource} />
        {!generated && <details className="decision-details"><summary>Beispielbrief zurücksetzen</summary><button type="button" className="secondary-button" onClick={() => { setState(structuredClone(INITIAL_DECISION)); setConfirmed(true) }}>Beispielposition wiederherstellen</button></details>}
        {!saved && <p className="decision-hint" role="status">Der Browser konnte den Entwurf nicht speichern.</p>}
      </section>
      {missing.length > 0 && <ul className="decision-validation">{missing.map(message => <li key={message}>{message}</li>)}</ul>}

    </section>

    <aside className={`atlas-preview ${showPreview ? 'atlas-preview-open' : ''}`} aria-label="Decision Brief">
      <div className="atlas-preview-header no-print">
        <div><h2>Decision Brief</h2><span aria-live="polite">{words} / 450 Wörter · {layoutHeight === null ? 'Drucklayout wird geprüft' : fitsPage ? 'Eine A4-Seite' : 'Für eine A4-Seite kürzen'}</span></div>
        <button type="button" className="atlas-outline atlas-preview-toggle" onClick={() => setShowPreview(value => !value)} aria-expanded={showPreview}>{showPreview ? 'Vorschau schließen' : 'Vorschau öffnen'}</button>
        <button type="button" className="atlas-primary atlas-print" onClick={printBrief} disabled={!valid}>PDF drucken</button>
      </div>
      <div className="atlas-paper"><Brief state={state} input={input} result={result} valid={valid} onSource={onSource} /></div>
    </aside>
  </div>
}

type Session = { answers: Answers; review: FundingReview; index: number; complete: boolean; scenario?: Input; changes?: Partial<Input> }

function newSession(): Session {
  return { answers: {}, review: restoreFundingReview(null), index: 0, complete: false }
}

export function readFundingSession(): Session {
  try {
    const raw = JSON.parse(localStorage.getItem(QUESTIONNAIRE_KEY) ?? 'null')
    if (!raw || raw.complete !== true) return newSession()
    const answers = restoreAnswers(raw.answers)
    if (fundingQuestions.some(question => answers[question.id] === undefined)) return newSession()
    const index = Number.isInteger(raw.index) && raw.index >= 0 && raw.index < fundingQuestions.length ? raw.index : 0
    const scenario = raw.scenario as Input | undefined
    const validScenario = scenario && PARAMS.every(({ key, min, max }) => Number.isFinite(scenario[key]) && scenario[key] >= min && scenario[key] <= max) && Number.isInteger(scenario.levels)
    const review = restoreFundingReview(raw.review)
    const complete = hasFundingPriorities(review)
    return { answers, review, complete, index: complete ? index : 0, scenario: validScenario ? scenario : undefined }
  } catch {
    return newSession()
  }
}

export function Decision({ session, setSession, ...props }: DecisionProps & { session: Session; setSession: Dispatch<SetStateAction<Session>> }) {
  const [manual, setManual] = useState(false)
  const [latestDraft, setLatestDraft] = useState<DecisionState>()
  const evaluatedInput = session.scenario ?? props.input
  const questionInput = session.changes ? { ...evaluatedInput, ...session.changes } : evaluatedInput
  const outcome = session.complete ? evaluateFunding(session.answers, evaluatedInput, session.review) : null
  const changedScenario = PARAMS.some(({ key }) => props.input[key] !== evaluatedInput[key])

  function goTo(index: number) {
    setSession(current => ({ ...current, index, complete: false }))
  }

  function answer(id: QuestionId, value: string | number | undefined) {
    setSession(current => {
      const review = { ...current.review }
      if (id === 'goal' && current.answers.goal !== value) {
        review.priorities = []
        review.priorityReason = ''
      }
      if (id === 'climate' && current.answers.climate !== value) {
        review.climateResult = undefined
        review.climateEvidence = ''
      }
      return { ...current, review, answers: restoreAnswers({ ...current.answers, [id]: value }) }
    })
  }

  function updateReview(changes: Partial<FundingReview>) {
    setSession(current => ({ ...current, scenario: current.scenario ?? (changes.peakPower || changes.climateResult ? { ...props.input } : undefined), review: { ...current.review, ...changes } }))
  }

  function updateScenario(key: InputKey, value: number) {
    setSession(current => {
      if ((current.changes?.[key] ?? (current.scenario ?? props.input)[key]) === value) return current
      const review = { ...current.review }
      if (key !== 'electricityPrice') {
        review.climateResult = undefined
        review.climateEvidence = ''
      }
      if (key !== 'electricityPrice' && key !== 'gridFactor' && key !== 'waterPerKg') review.peakPower = undefined
      return { ...current, review, changes: { ...current.changes, [key]: value } }
    })
  }

  function reset() {
    try {
      localStorage.removeItem(QUESTIONNAIRE_KEY)
      localStorage.removeItem(GENERATED_KEY)
    } catch { /* The in-memory state can still be reset. */ }
    setLatestDraft(undefined)
    setSession(newSession())
    requestAnimationFrame(() => document.getElementById('funding-question-title')?.focus())
  }

  function generate(input: Input, review = session.review, answers = session.answers) {
    review = restoreFundingReview(review)
    const evaluation = evaluateFunding(answers, input, review)
    if (!evaluation) return
    const existing = initialState(GENERATED_KEY, latestDraft ?? (outcome?.draft ?? newBrief(evaluation.draft))).draft
    const draft = {
      ...evaluation.draft,
      names: existing.names, date: existing.date,
      pros: existing.pros, cons: existing.cons,
      counterargument: existing.counterargument, response: existing.response,
    }
    const completedSession: Session = { answers, review, index: session.index, complete: true, scenario: { ...input } }
    try {
      localStorage.setItem(GENERATED_KEY, JSON.stringify({ ...draft, optionReviewed: true, farmArguments: true }))
      localStorage.setItem(QUESTIONNAIRE_KEY, JSON.stringify(completedSession))
    } catch { /* The completed result is still available in memory. */ }
    setLatestDraft(draft)
    setSession(completedSession)
  }

  if (manual) return <>
    <div className="funding-manual-nav no-print"><button type="button" className="atlas-text" onClick={() => setManual(false)}>Zum Fragenkatalog</button></div>
    <DecisionEditor key="manual" {...props} />
  </>
  return <>
    {outcome ? <>
      <FundingSummary outcome={outcome} answers={session.answers} onEdit={goTo} onManual={() => setManual(true)} onRecalculate={changedScenario ? () => generate(props.input, { ...session.review, peakPower: undefined, climateResult: undefined, climateEvidence: '' }) : undefined} />
      <DecisionEditor key={`questionnaire-${JSON.stringify(evaluatedInput)}`} {...props} input={evaluatedInput} result={calculate(evaluatedInput)} generated={latestDraft ?? newBrief(outcome.draft)} onDraftChange={setLatestDraft} />
    </> : <FundingQuestionnaire input={questionInput} answers={session.answers} review={session.review} onReview={updateReview} index={session.index} onAnswer={answer} onGoTo={goTo} onGenerate={() => generate(questionInput)} onQuickStart={() => generate(questionInput, session.review, { ...openSiteAnswers, ...session.answers })} onManual={() => setManual(true)} onUpdateScenario={updateScenario} />}
    <div className="funding-reset no-print">
      <button type="button" className="atlas-outline" onClick={reset} disabled={!session.changes && Object.keys(session.answers).length === 0}>
        <ArrowCounterClockwise size={17} /> Fragebogen zurücksetzen
      </button>
    </div>
  </>
}

export default Decision
