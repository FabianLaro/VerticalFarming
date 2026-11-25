import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, Check, Circle, ClipboardText, FileText, Minus, X } from '@phosphor-icons/react'
import { INITIAL_DECISION, OPTIONS } from './Brief'
import { editableAnswers, evaluateFunding, fundingAnswerLabel, fundingChecks, fundingQuestions, hasFundingPriorities, siteChecks } from '../lib/funding-questionnaire'
import type { Answers, FundingReview, QuestionId } from '../lib/funding-questionnaire'
import { BASE_INPUT } from '../lib/model'
import type { Input, InputKey } from '../lib/model'
import { number } from '../lib/format'
import { ScenarioControl } from './ScenarioControl'
import './funding-questionnaire.css'

type QuestionnaireProps = {
  answers: Answers
  review: FundingReview
  onReview: (values: Partial<FundingReview>) => void
  input: Input
  index: number
  onAnswer: (id: QuestionId, value: string | number | undefined) => void
  onUpdateScenario: (key: InputKey, value: number) => void
  onGoTo: (index: number) => void
  onGenerate: () => void
  onQuickStart: () => void
  onManual: () => void
}

const icons = { yes: Check, unknown: Minus, no: X } as const
const fieldsByQuestion: Partial<Record<QuestionId, InputKey[]>> = {
  building: ['footprint'],
  power: ['energyPerKg', 'levels'],
  sales: ['levels', 'usable', 'yieldPerArea'],
  cost: ['electricityPrice', 'energyPerKg'],
  climate: ['energyPerKg'],
}
const fieldLabels: Partial<Record<InputKey, string>> = {
  footprint: 'Bodenfläche der Farm', usable: 'Fläche für den Anbau', yieldPerArea: 'Jahresernte je m² Anbaufläche',
  electricityPrice: 'Strompreis', gridFactor: 'Treibhausgase je kWh',
}

function ModelComparison({ rows, unit }: { rows: { label: string; value: number }[]; unit: string }) {
  const max = Math.max(...rows.map(row => row.value), 1)
  return <dl className="funding-model-bars">
    {rows.map(({ label, value }) => <div key={label}>
      <dt>{label}</dt>
      <dd><strong>{number(value, 1)} {unit}</strong><span aria-hidden="true" style={{ width: `${value / max * 100}%` }} /></dd>
    </div>)}
  </dl>
}

export function FundingQuestionnaire({ answers, review, onReview, input, index, onAnswer, onGoTo, onGenerate, onQuickStart, onManual, onUpdateScenario }: QuestionnaireProps) {
  const question = fundingQuestions[index]
  const last = index === fundingQuestions.length - 1
  const prioritiesReady = hasFundingPriorities(review)
  const firstIncomplete = fundingQuestions.findIndex(item => answers[item.id] === undefined || (item.id === 'goal' && !prioritiesReady))
  const selected = answers[question.id]
  const canContinue = selected !== undefined && (question.id !== 'goal' || prioritiesReady)
  const custom = Object.hasOwn(editableAnswers, question.id) ? editableAnswers[question.id as keyof typeof editableAnswers] : undefined
  const fields = fieldsByQuestion[question.id]
  const checks = question.id === 'cost' || question.id === 'climate' ? fundingChecks(answers, input) : null
  const site = question.id === 'building' || question.id === 'power' || question.id === 'sales' ? siteChecks(answers, input, review.peakPower) : null
  const chosenBuyers = question.id === 'sales'
    ? fundingQuestions.find(item => item.id === 'demand')?.options.find(option => option.id === answers.demand)?.label
    : undefined
  const heading = useRef<HTMLHeadingElement>(null)
  const numericInput = useRef<HTMLInputElement>(null)
  const previous = useRef(index)
  useEffect(() => {
    if (index !== previous.current) heading.current?.focus()
    previous.current = index
  }, [index])

  function next() {
    if (!canContinue) return
    if (!last) onGoTo(index + 1)
    else if (firstIncomplete === -1) onGenerate()
    else onGoTo(firstIncomplete)
  }

  return <section className="funding-quiz no-print" aria-label="Fragenkatalog zur Förderung">
    <aside className="funding-quiz-sidebar">
      <ClipboardText size={31} weight="duotone" aria-hidden="true" />
      <h2>Ihr entscheidet für Dinslaken</h2>
      <p>In einer Vertical Farm wächst Salat drinnen auf mehreren Ebenen unter Lampen. Soll die Stadt mehrere Farmen fördern, erst eine testen oder eine andere Versorgung unterstützen?</p>
      <p className="funding-note">Wählt Beispielwerte oder „Noch offen“, wenn ihr etwas nicht wisst. Danach begründet ihr eure Wahl mit eigenen Argumenten.</p>
      <button type="button" className="funding-manual-link" onClick={onManual}>Beispielbrief öffnen <ArrowRight size={15} /></button>
    </aside>
    <div className="funding-question">
      <div className="funding-progress">
        <span>Frage {index + 1} von {fundingQuestions.length}</span>
        <div aria-label="Frage auswählen">{fundingQuestions.map((item, position) => <button type="button" key={item.id} className={answers[item.id] !== undefined && (item.id !== 'goal' || prioritiesReady) ? 'is-answered' : ''} disabled={firstIncomplete !== -1 && position > firstIncomplete} aria-current={position === index ? 'step' : undefined} aria-label={`Frage ${position + 1}: ${item.topic}`} onClick={() => onGoTo(position)} />)}</div>
      </div>
      <p className="funding-topic">{question.topic}</p>
      <h2 id="funding-question-title" ref={heading} tabIndex={-1}>{question.statement}</h2>
      <p className="funding-context">{question.context}</p>
      {question.id === 'alternative' && <p className="funding-limit-feedback">Dein Ziel: {fundingAnswerLabel(fundingQuestions[0], answers.goal)}</p>}
      {site && <div className="funding-model-note">
        {question.id === 'building' ? <ModelComparison unit="m²" rows={[
          { label: 'Platzbedarf auf dem Boden', value: input.footprint },
          ...(site.hall === null ? [] : [{ label: 'Deine Beispielhalle', value: site.hall }]),
        ]} /> : question.id === 'power' ? <>
          <ModelComparison unit="kW" rows={[
            { label: 'Durchschnittliche Leistung der Farm', value: site.averagePower },
            ...(site.connection === null ? [] : [{ label: 'Dein Beispielanschluss', value: site.connection }]),
          ]} />
          <p>Für den Netzanschluss zählt die höchste gleichzeitige Leistung von Licht, Klimatisierung und Pumpen. Gib einen Wert aus dem Planspiel ein, wenn er bekannt ist.</p>
        </> : <>
          {chosenBuyers && <p>Kunden im Beispiel: {answers.demand === 'unknown' ? 'noch offen' : chosenBuyers}</p>}
          <ModelComparison unit="kg/Woche" rows={[
            { label: 'Durchschnittliche Ernte', value: site.weeklyHarvest },
            ...(site.orders === null ? [] : [{ label: 'Mögliche Abnahme', value: site.orders }]),
          ]} />
          <p>Die Jahresernte wird durch 52 geteilt. Die Ernte kann von Woche zu Woche schwanken.</p>
        </>}
      </div>}
      {checks && <div className="funding-model-note">
        {question.id === 'cost' ? <>
          <p><strong>{number(checks.electricityPerKg, 2)} €/kg</strong> Stromkosten im aktuellen Modell</p>
          <p>{number(input.energyPerKg, 2)} kWh/kg × {number(input.electricityPrice, 3)} €/kWh. Investition, Personal und weitere Kosten kommen hinzu.</p>
        </> : <>
          <p><strong>{number(checks.referenceEmissions, 3)} kg CO₂eq/kg</strong> beim deutschen Referenzmix ({number(BASE_INPUT.gridFactor, 3)} kg CO₂eq/kWh)</p>
          <p><strong>{number(checks.lowerEmissions, 3)} kg CO₂eq/kg</strong> beim emissionsärmeren Modellmix ({number(checks.lowerGridFactor, 3)} kg CO₂eq/kWh)</p>
          <p>Beide Werte erfassen den Strom. Für einen Umweltvergleich fehlen unter anderem Anlage, Lieferwege und Daten der Alternativen.</p>
        </>}
      </div>}
      <div className="funding-answer-grid" data-many-options={question.options.length >= 4 || undefined} role="group" aria-label="Antwort auswählen">{question.options.map(option => {
        const Icon = icons[option.id as keyof typeof icons] ?? Circle
        return <button type="button" className={`funding-answer funding-answer-${option.id}`} key={option.id} aria-pressed={selected === option.id} onClick={() => {
          if (numericInput.current) numericInput.current.value = ''
          onAnswer(question.id, option.id)
        }}>{question.id === 'goal' ? <span className="funding-goal-dot" aria-hidden="true" /> : <Icon size={21} weight="bold" aria-hidden="true" />}{option.label}</button>
      })}</div>
      {question.id === 'goal' && selected && <>
        <fieldset className="funding-priorities">
          <legend>Zwei wichtigste Kriterien</legend>
          <p>Was ist euch bei der Entscheidung besonders wichtig? Wählt zwei Punkte.</p>
          <div className="priority-choices">{INITIAL_DECISION.criteria.map(({ id, label }) => {
            const checked = review.priorities.includes(id)
            return <label className={checked ? 'priority-choice chosen' : 'priority-choice'} key={id}>
              <input type="checkbox" checked={checked} disabled={!checked && review.priorities.length === 2}
                onChange={() => onReview({ priorities: checked ? review.priorities.filter(value => value !== id) : [...review.priorities, id] })} />
              <span>{label}</span>
            </label>
          })}</div>
          <label className="decision-field">Warum diese beiden?
            <textarea rows={2} maxLength={180} placeholder="Uns sind diese beiden Punkte wichtig, weil …" value={review.priorityReason}
              onChange={event => onReview({ priorityReason: event.target.value })} />
          </label>
        </fieldset>
      </>}
      {(fields || custom) && <details key={question.id} className="atlas-details funding-adjustments">
        <summary>{question.id === 'climate' ? 'Genauer prüfen und Werte ändern' : 'Eigene Werte eingeben'}</summary>
        {fields && <div className="funding-scenario-controls" role="group" aria-label="Modellwerte anpassen">
          {fields.map(field => <ScenarioControl key={field} field={field} input={input} update={onUpdateScenario} label={fieldLabels[field]} />)}
        </div>}
        {custom && <label className="funding-custom-value" key={question.id}>
          <span>{custom.label} ({custom.unit})</span>
          <input type="number" ref={numericInput} min={custom.min} max={Number.MAX_SAFE_INTEGER} step="any" inputMode="decimal" placeholder="Wert eingeben" defaultValue={typeof selected === 'number' ? selected : ''} onChange={event => {
            const field = event.currentTarget
            onAnswer(question.id, field.value && field.validity.valid ? field.valueAsNumber : undefined)
          }} />
        </label>}
        {question.id === 'power' && <label className="funding-custom-value">
          <span>Spitzenlast im Planspiel (kW)</span>
          <input type="number" step="any" min="0" max={Number.MAX_SAFE_INTEGER} inputMode="decimal" placeholder="Noch offen" value={review.peakPower ?? ''}
            onChange={event => onReview({ peakPower: event.currentTarget.validity.valid && event.currentTarget.valueAsNumber > 0 ? event.currentTarget.valueAsNumber : undefined })} />
        </label>}
        {question.id === 'climate' && selected === 'custom' && checks && <div className="funding-model-note">
          <ScenarioControl field="gridFactor" input={input} update={onUpdateScenario} label={fieldLabels.gridFactor} />
          <p role="status"><strong>{number(checks.customEmissions, 3)} kg CO₂eq/kg</strong> mit deinem Strommix</p>
        </div>}
        {question.id === 'climate' && selected && <fieldset className="funding-priorities">
          <legend>Klimabilanz prüfen</legend>
          <p>Vergleicht dieselbe Salatmenge in derselben Jahreszeit. Rechnet bei beiden Varianten die gleichen Schritte mit ein, etwa Anbau und Transport.</p>
          <label className="decision-field">Ergebnis der Klimaprüfung
            <select value={review.climateResult ?? ''} onChange={event => {
              const value = event.target.value
              onReview({ climateResult: value === 'meets' || value === 'misses' ? value : undefined, climateEvidence: '' })
            }}>
              <option value="">Noch offen</option>
              <option value="meets">Klimaziel erreicht</option>
              <option value="misses">Klimaziel verfehlt</option>
            </select>
          </label>
          {review.climateResult && <label className="decision-field">Prüfwert und Beleg aus dem Planspiel
            <input type="text" maxLength={100} value={review.climateEvidence} onChange={event => onReview({ climateEvidence: event.target.value })} />
          </label>}
        </fieldset>}
      </details>}
      {question.id === 'building' && site && site.hall !== null && <p className="funding-limit-feedback" role="status">{site.hallTooSmall
        ? `Die Halle ist ${number(input.footprint - site.hall, 1)} m² zu klein für diese Farm.`
        : 'Die Grundfläche reicht im Modell. Hallenhöhe und Anschlüsse musst du vor Ort prüfen.'}</p>}
      {question.id === 'power' && site && site.connection !== null && <p className="funding-limit-feedback" role="status">{site.connectionTooWeak
        ? 'Der Anschluss reicht schon für den durchschnittlichen Bedarf nicht aus.'
        : site.peakTooHigh
          ? 'Die Spitzenlast übersteigt den Anschluss.'
          : site.peakPower !== null
            ? 'Der Anschluss deckt die angegebene Spitzenlast im Planspiel.'
            : review.peakPower !== undefined
              ? 'Die Spitzenlast muss mindestens so hoch wie der Durchschnitt sein.'
              : 'Der Anschluss reicht im Durchschnitt. Prüfe noch den höchsten gleichzeitigen Strombedarf.'}</p>}
      {question.id === 'demand' && selected && <p className="funding-limit-feedback" role="status">{selected === 'unknown'
        ? 'Du kannst die Mengen im nächsten Schritt trotzdem ausprobieren.'
        : 'Als Nächstes kannst du testen, ob diese Kundengruppe die Ernte abnehmen könnte.'}</p>}
      {question.id === 'sales' && site && site.orders !== null && <p className="funding-limit-feedback" role="status">{site.unsoldPerWeek
        ? `Für rund ${number(site.unsoldPerWeek, 1)} kg pro Woche müssten weitere Kunden gefunden werden.`
        : site.extraDemandPerWeek
          ? `Die Ernte liegt rund ${number(site.extraDemandPerWeek, 1)} kg pro Woche unter der Beispielnachfrage.`
          : 'Im Wochendurchschnitt passen Ernte und Beispielnachfrage zusammen.'}</p>}
      {question.id === 'cost' && checks && checks.limit !== null && <p className="funding-limit-feedback" role="status">{checks.costExceeded
        ? 'Schon der Strom liegt über deiner Grenze.'
        : 'Der Strom liegt innerhalb deiner Grenze. Dazu kommen die übrigen Kosten.'}</p>}
      <div className="funding-question-actions">
        {index > 0 && <button type="button" className="atlas-outline" onClick={() => onGoTo(index - 1)}><ArrowLeft size={17} /> Zurück</button>}
        {index === 0 && canContinue && firstIncomplete >= 1 &&
          <button type="button" className="atlas-text" onClick={onQuickStart}>Ohne Standortdaten zum Brief</button>}
        <button type="button" className="atlas-primary" disabled={!canContinue} onClick={next}>{last && firstIncomplete === -1 ? 'Decision Brief erstellen' : 'Weiter'} {last && firstIncomplete === -1 ? <FileText size={17} /> : <ArrowRight size={17} />}</button>
      </div>
    </div>
  </section>
}

type SummaryProps = {
  outcome: NonNullable<ReturnType<typeof evaluateFunding>>
  answers: Answers
  onEdit: (index: number) => void
  onManual: () => void
  onRecalculate?: () => void
}

export function FundingSummary({ outcome, answers, onEdit, onManual, onRecalculate }: SummaryProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  const option = OPTIONS.find(item => item.id === outcome.option)!
  return <div className="funding-summary no-print">
    <section className="funding-result">
      <div className="funding-result-option" aria-hidden="true">{option.id}</div>
      <div>
        <p>Vorschlag aus dem Fragebogen</p>
        <h2 ref={heading} tabIndex={-1}>{option.label}</h2>
        <p>{outcome.explanation}</p>
      </div>
      <button type="button" className="atlas-outline" onClick={() => onEdit(0)}>Antworten ändern <ArrowRight size={17} /></button>
    </section>
    {outcome.expansionGaps.length > 0 && <details className="atlas-details funding-expansion-gaps">
      <summary>Was fehlt für die Förderung mehrerer Farmen?</summary>
      <ul>{outcome.expansionGaps.map(({ field, text }) => <li key={field}>
        <button type="button" className="atlas-text" onClick={() => onEdit(fundingQuestions.findIndex(question => question.id === field))}>{text} <ArrowRight size={14} aria-hidden="true" /></button>
      </li>)}</ul>
    </details>}
    {onRecalculate && <div className="funding-model-note">
      <p>Der Brief verwendet die Modellwerte aus diesem Durchlauf. Du kannst die Werte aus „Vergleich“ übernehmen und einen neuen Entwurf erstellen.</p>
      <button type="button" className="atlas-text" onClick={onRecalculate}>Mit Werten aus „Vergleich“ neu berechnen</button>
    </div>}
    <div className="funding-result-details">
      <details className="atlas-details"><summary>Eure Antworten ansehen</summary>
        <ul className="funding-review-list">{fundingQuestions.map((question, index) => <li key={question.id}><button type="button" className="atlas-text" onClick={() => onEdit(index)}>{question.topic}</button><span>{fundingAnswerLabel(question, answers[question.id])}</span></li>)}</ul>
        <p>Wenn ihr neu rechnet, bleiben eure Argumente und eure Antwort auf den Einwand im Brief. Prüft beides, falls sich der Vorschlag ändert.</p>
      </details>
      <button type="button" className="atlas-text" onClick={onManual}>Beispielbrief öffnen</button>
    </div>
  </div>
}
