import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, Check, Circle, ClipboardText, FileText, Minus, X } from '@phosphor-icons/react'
import { OPTIONS } from './Brief'
import { evaluateFunding, fundingChecks, fundingQuestions } from '../lib/funding-questionnaire'
import type { Answers, QuestionId } from '../lib/funding-questionnaire'
import { BASE_INPUT } from '../lib/model'
import type { Input } from '../lib/model'
import { number } from '../lib/format'
import './funding-questionnaire.css'

type QuestionnaireProps = {
  answers: Answers
  input: Input
  index: number
  onAnswer: (id: QuestionId, value: string) => void
  onGoTo: (index: number) => void
  onGenerate: () => void
  onManual: () => void
}

const icons = { yes: Check, unknown: Minus, no: X } as const

export function FundingQuestionnaire({ answers, input, index, onAnswer, onGoTo, onGenerate, onManual }: QuestionnaireProps) {
  const question = fundingQuestions[index]
  const last = index === fundingQuestions.length - 1
  const firstIncomplete = fundingQuestions.findIndex(item => !answers[item.id])
  const selected = answers[question.id]
  const checks = question.id === 'cost' || question.id === 'climate' ? fundingChecks(answers, input) : null
  const heading = useRef<HTMLHeadingElement>(null)
  const previous = useRef(index)
  useEffect(() => {
    if (index !== previous.current) heading.current?.focus()
    previous.current = index
  }, [index])

  function next() {
    if (!selected) return
    if (!last) onGoTo(index + 1)
    else if (firstIncomplete === -1) onGenerate()
    else onGoTo(firstIncomplete)
  }

  return <section className="funding-quiz no-print" aria-label="Fragenkatalog zur Förderung">
    <aside className="funding-quiz-sidebar">
      <ClipboardText size={31} weight="duotone" aria-hidden="true" />
      <h2>Fragenkatalog</h2>
      <p>Bewerte das Förderziel und die Gegebenheiten der Stadt. Aus deinen Antworten entsteht ein Decision Brief.</p>
      <p className="funding-note">Wähle „Unklar“, wenn dir ein lokaler Nachweis fehlt.</p>
      <button type="button" className="funding-manual-link" onClick={onManual}>Brief manuell bearbeiten <ArrowRight size={15} /></button>
    </aside>
    <div className="funding-question">
      <div className="funding-progress">
        <span>Frage {index + 1} von {fundingQuestions.length}</span>
        <div aria-label="Frage auswählen">{fundingQuestions.map((item, position) => <button type="button" key={item.id} className={answers[item.id] ? 'is-answered' : ''} disabled={firstIncomplete !== -1 && position > firstIncomplete} aria-current={position === index ? 'step' : undefined} aria-label={`Frage ${position + 1}: ${item.topic}`} onClick={() => onGoTo(position)} />)}</div>
      </div>
      <p className="funding-topic">{question.topic}</p>
      <h2 ref={heading} tabIndex={-1}>{question.statement}</h2>
      <p className="funding-context">{question.context}</p>
      {checks && <div className="funding-model-note">
        {question.id === 'cost' ? <>
          <p><strong>{number(checks.electricityPerKg, 2)} €/kg</strong> Stromkosten im aktuellen Modell</p>
          <p>{number(input.energyPerKg, 2)} kWh/kg × {number(input.electricityPrice, 3)} €/kWh. Investition, Personal und weitere Kosten kommen hinzu.</p>
        </> : <>
          <p><strong>{number(checks.referenceEmissions, 3)} kg CO₂eq/kg</strong> beim deutschen Referenzmix ({number(BASE_INPUT.gridFactor, 3)} kg CO₂eq/kWh)</p>
          <p><strong>{number(checks.lowerEmissions, 3)} kg CO₂eq/kg</strong> beim emissionsärmeren Modellmix ({number(checks.lowerGridFactor, 3)} kg CO₂eq/kWh)</p>
          <p>Beide Werte erfassen den Strom. Für einen Umweltvergleich fehlen unter anderem Anlage, Lieferwege und Daten der Alternativen.</p>
        </>}
        <a href="#vergleich">Modellannahmen im Vergleich ansehen</a>
      </div>}
      <div className="funding-answer-grid" data-four-options={question.options.length === 4 || undefined} role="group" aria-label="Antwort auswählen">{question.options.map(option => {
        const Icon = icons[option.id as keyof typeof icons] ?? Circle
        return <button type="button" className={`funding-answer funding-answer-${option.id}`} key={option.id} aria-pressed={selected === option.id} onClick={() => onAnswer(question.id, option.id)}><Icon size={21} weight="bold" aria-hidden="true" />{option.label}</button>
      })}</div>
      {question.id === 'cost' && checks && checks.limit !== null && selected && <p className="funding-limit-feedback" role="status">{checks.costExceeded
        ? 'Schon der Strom liegt über deiner Grenze.'
        : 'Der Strom liegt innerhalb deiner Grenze. Die Tragfähigkeit der Vollkosten bleibt offen.'}</p>}
      <div className="funding-question-actions">
        <button type="button" className="atlas-outline" disabled={index === 0} onClick={() => onGoTo(index - 1)}><ArrowLeft size={17} /> Zurück</button>
        <button type="button" className="atlas-primary" disabled={!selected} onClick={next}>{last && firstIncomplete === -1 ? 'Decision Brief erstellen' : 'Weiter'} {last && firstIncomplete === -1 ? <FileText size={17} /> : <ArrowRight size={17} />}</button>
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
        <p>Empfehlung aus euren Antworten</p>
        <h2 ref={heading} tabIndex={-1}>{option.label}</h2>
        <p>{outcome.explanation}</p>
      </div>
      <button type="button" className="atlas-outline" onClick={() => onEdit(0)}>Antworten ändern <ArrowRight size={17} /></button>
    </section>
    {onRecalculate && <div className="funding-model-note">
      <p>Der Brief verwendet das Szenario vom Zeitpunkt der Erstellung. Erneutes Berechnen aktualisiert die Empfehlung und setzt die bearbeiteten Texte auf den neuen Entwurf zurück.</p>
      <button type="button" className="atlas-text" onClick={onRecalculate}>Mit aktuellem Szenario neu berechnen</button>
    </div>}
    <div className="funding-result-details">
      <details className="atlas-details"><summary>Antworten und Entscheidungsregeln</summary>
        <div className="funding-rule-notes">
          <p>Eine überschrittene Stromkostengrenze oder fehlende Grundvoraussetzungen sprechen gegen das aktuelle Szenario. Bei einem erkennbaren Ansatz und offenen Nachweisen kommt ein Pilot infrage. Breite Förderung setzt zudem belastbare Messdaten und Prüfungen an mehreren Standorten voraus.</p>
          <p>Offene Angaben: {outcome.gaps.length ? outcome.gaps.join(', ') : 'Keine Antwort als unklar markiert.'}</p>
        </div>
        <ul className="funding-review-list">{fundingQuestions.map((question, index) => <li key={question.id}><button type="button" className="atlas-text" onClick={() => onEdit(index)}>{question.topic}</button><span>{question.options.find(option => option.id === answers[question.id])?.label}</span></li>)}</ul>
        <p>Erneutes Erstellen aktualisiert den Brief aus den Antworten. Name und Datum bleiben erhalten.</p>
      </details>
      <button type="button" className="atlas-text" onClick={onManual}>Manuellen Brief öffnen</button>
    </div>
  </div>
}
