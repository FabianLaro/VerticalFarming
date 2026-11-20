import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, MonitorPlay, X } from '@phosphor-icons/react'
import { BASE_INPUT, PARAMS, applyPreset, calculate, validateInput } from './lib/model'
import type { Input } from './lib/model'
import { sources, dataCatalog, RESULT_META } from './data/catalog'
import { number } from './lib/format'
import { SiteStudy } from './components/SiteStudy'
import { ComparePanel } from './components/ComparePanel'
import Decision from './components/Decision'
import { Conflicts } from './components/Conflicts'
import './atlas.css'

const stages = [
  { id: 'standort', label: 'Standort' },
  { id: 'vergleich', label: 'Vergleich' },
  { id: 'entscheidung', label: 'Entscheidung' },
] as const
type Stage = typeof stages[number]['id']

const tour: { stage: Stage; title: string; text: string }[] = [
  { stage: 'standort', title: 'Die Frage der Stadt', text: 'Welches öffentliche Ziel soll Dinslaken verfolgen?' },
  { stage: 'standort', title: 'Die Versorgung der Farm', text: 'Zeigt am Schnittbild, wo Wasser und Strom gebraucht werden und wo die Ernte die Farm verlässt.' },
  { stage: 'vergleich', title: 'Drei Systeme, eine Bezugsgröße', text: 'Schaltet zwischen gleicher Fläche und gleicher Jahresernte um. Erklärt die Grenzen der niederländischen Referenzfälle.' },
  { stage: 'vergleich', title: 'Was ändert sich im Modell?', text: 'Lasst das Publikum erst schätzen. Ändert die Ebenenzahl oder den Strommix und erklärt den Unterschied zwischen Gesamtmenge und Wert je kg.' },
  { stage: 'entscheidung', title: 'Wer profitiert und wer trägt das Risiko?', text: 'Vergleicht A, B und C anhand eurer zwei wichtigsten Kriterien. Nennt die betroffenen Gruppen.' },
  { stage: 'entscheidung', title: 'Das Urteil', text: 'Begründet eure Empfehlung und nennt zwei prüfbare Bedingungen. Welche Information könnte euer Urteil ändern?' },
]

function currentStage(): Stage {
  const id = window.location.hash.slice(1)
  return stages.find(stage => stage.id === id)?.id ?? 'standort'
}

function readScenario(): Input {
  try {
    const saved = JSON.parse(localStorage.getItem('stadtlabor-input-v1') ?? 'null') as Input | null
    if (saved) {
      validateInput(saved)
      if (PARAMS.every(param => saved[param.key] >= param.min && saved[param.key] <= param.max)) return saved
    }
  } catch { /* Invalid or unavailable local storage. */ }
  return { ...BASE_INPUT }
}

export default function App() {
  const [stage, setStage] = useState(currentStage)
  const [input, setInput] = useState(readScenario)
  const [source, setSource] = useState<string | null>(null)
  const [step, setStep] = useState<number | null>(null)
  const result = calculate(input)

  useEffect(() => {
    const followHash = () => {
      if (window.location.hash !== '#main') setStage(currentStage())
    }
    window.addEventListener('hashchange', followHash)
    return () => window.removeEventListener('hashchange', followHash)
  }, [])
  useEffect(() => {
    try { localStorage.setItem('stadtlabor-input-v1', JSON.stringify(input)) }
    catch { /* Scenario remains usable for the current session. */ }
  }, [input])

  function navigate(next: Stage) {
    if (stage !== next || window.location.hash !== '#' + next) {
      window.location.hash = next
      setStage(next)
    }
    window.scrollTo(0, 0)
  }

  function goToStep(next: number) {
    const bounded = Math.max(0, Math.min(tour.length - 1, next))
    setStep(bounded)
    navigate(tour[bounded].stage)
  }

  useEffect(() => {
    if (step === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest('input, textarea, select, button, dialog')) return
      if (event.key === 'Escape') setStep(null)
      if (event.key === 'ArrowRight') goToStep(step + 1)
      if (event.key === 'ArrowLeft') goToStep(step - 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [step, stage])

  return <div className={step === null ? 'app atlas-app' : 'app atlas-app presenting'}>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus() }}>Zum Inhalt</a>
    <header className="atlas-header no-print">
      <div className="atlas-header-inner">
        <button className="atlas-brand" type="button" onClick={() => { setStep(null); navigate('standort') }} aria-label="Stadtlabor 2040 Startseite">
          <span className="atlas-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Stadtlabor <b>2040</b></span>
        </button>
        <nav aria-label="Bereiche">{stages.map(item => <button type="button" key={item.id} onClick={() => { setStep(null); navigate(item.id) }} aria-current={stage === item.id ? 'page' : undefined}>{item.label}</button>)}</nav>
        <div className="atlas-actions">
          <button type="button" aria-label="Quellen" onClick={() => setSource('all')}><BookOpen size={18} /><span>Quellen</span></button>
          <button type="button" className="atlas-primary atlas-tour-button" onClick={() => step === null ? goToStep(0) : setStep(null)}><MonitorPlay size={18} /><span>{step === null ? 'Vortrag starten' : 'Vortrag beenden'}</span></button>
        </div>
      </div>
    </header>
    <main className="atlas-main" id="main" tabIndex={-1}>
      {step !== null && <aside className="atlas-tour no-print" aria-label="Vortragsnotizen"><b>{step + 1} / {tour.length}</b><div><strong>{tour[step].title}</strong><p>{tour[step].text}</p></div><div className="atlas-tour-controls"><button type="button" className="atlas-outline" aria-label="Vorheriger Vortragsschritt" disabled={step === 0} onClick={() => goToStep(step - 1)}><ArrowLeft size={18} /></button><button type="button" className="atlas-primary" onClick={() => step === tour.length - 1 ? setStep(null) : goToStep(step + 1)}>{step === tour.length - 1 ? 'Abschließen' : 'Weiter'} <ArrowRight size={18} /></button></div></aside>}
      {stage === 'standort' && <SiteStudy input={input} result={result} onSource={setSource} onCompare={() => navigate('vergleich')} />}
      {stage === 'vergleich' && <ComparePanel input={input} result={result} onSource={setSource} onDecide={() => navigate('entscheidung')} update={(key, value) => setInput(previous => ({ ...previous, [key]: value }))} selectPreset={id => setInput(applyPreset(id))} />}
      {stage === 'entscheidung' && <>
        <div className="atlas-page-heading no-print"><h1>Wie soll Dinslaken fördern?</h1><p>Wählt ein öffentliches Ziel und begründet eure Entscheidung anhand von fünf Kriterien.</p></div>
        <Decision input={input} result={result} onSource={setSource} />
        <Conflicts onSource={setSource} />
      </>}
      <footer className="atlas-footer no-print"><span>Geographieprojekt · Dinslaken · Szenariohorizont 2040</span><button type="button" className="atlas-text" onClick={() => setSource('all')}>Quellen und Modellgrenzen <ArrowRight size={16} /></button></footer>
    </main>
    <SourceDialog source={source} input={input} onClose={() => setSource(null)} />
  </div>
}

function SourceDialog({ source, input, onClose }: { source: string | null; input: Input; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { if (source && !ref.current?.open) ref.current?.showModal(); else if (!source) ref.current?.close() }, [source])
  const visible = sources.filter(item => source === 'all' || source === 'assumptions' || item.id === source)
  return <dialog className="source-dialog no-print" ref={ref} onCancel={onClose} onClose={() => { if (!ref.current?.open) onClose() }} onClick={e => { if (e.target === e.currentTarget) onClose() }} aria-labelledby="source-title"><div className="dialog-inner"><div className="dialog-header"><div><h2 id="source-title">Quellen und Annahmen</h2></div><button className="icon-button" onClick={onClose} aria-label="Belege schließen"><X size={23} /></button></div>
    {(source === 'all' || source === 'assumptions' || source === 'scenario') && <details className="assumption-summary" id="modellgrenzen" open={source === 'assumptions' || source === 'scenario'}><summary>Basiswerte und Modellgrenzen</summary><p>Keine Kalibrierung für einen konkreten Betrieb. Annahmen beziehen sich auf Salatfrischmasse und ein vollständiges Betriebsjahr. Szenariohorizont 2040, keine Vorhersage der Technik oder des Strommixes im Jahr 2040. Die folgenden Werte beschreiben die wiederherstellbare Basis.</p><div className="assumptions-grid">{PARAMS.map(param => <div key={param.key}><span>{param.label}</span><strong>{number(BASE_INPUT[param.key], 3)} {param.unit}</strong><small>{param.help}</small></div>)}</div><p>Referenzen und Annahmen werden unabhängig kombiniert. Daraus entsteht kein beobachteter Betrieb. Stromkosten enthalten weder Personal, Kapital, Miete, Saatgut noch Instandhaltung. Der Strombeitrag enthält keine Gebäude, Betriebsmittel, Transporte und Entsorgung.</p></details>}
    {(source === 'all' || source === 'assumptions' || source === 'scenario') && <button className="button" onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify({ sources, data: dataCatalog, results: RESULT_META, currentScenario: { input, result: calculate(input) } }, null, 2)], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'stadtlabor-daten-und-quellen.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }}>Strukturiertes Datenverzeichnis speichern</button>}
    {visible.map(item => <details className="source-card" key={item.id} open={source !== 'all' && source !== 'assumptions'}><summary><strong>{item.short}</strong><span>{item.label}</span></summary><h3>{item.title}</h3><p>{item.authors}</p>{item.id !== 'scenario' && <a href={item.url} target="_blank" rel="noreferrer">Originalquelle öffnen <ArrowRight size={15} /></a>}{item.fulltextUrl && <a className="mirror-link" href={item.fulltextUrl} target="_blank" rel="noreferrer">Frei zugänglicher Volltext <ArrowRight size={15} /></a>}<dl><div><dt>Fundstelle</dt><dd>{item.locator}</dd></div><div><dt>Methode / Zugang</dt><dd>{item.kind} · {item.access}</dd></div><div><dt>Produkt / Region / Zeitraum</dt><dd>{item.product} · {item.region} · {item.period}</dd></div><div><dt>Systemgrenze</dt><dd>{item.boundary}</dd></div></dl><h4>Nachprüfbarer Befund</h4><ul>{item.findings.map(text => <li key={text}>{text}</li>)}</ul><h4>Aussagegrenzen</h4><ul>{item.limitations.map(text => <li key={text}>{text}</li>)}</ul><small>Abruf: {item.accessed} · Vollständige Arbeitsnotizen im lokalen Ordner docs.</small></details>)}
    {!visible.length && <p>Die zugehörige Annahme ist im vollständigen Quellen- und Datenverzeichnis dokumentiert. <button onClick={() => ref.current?.close()}>Schließen</button></p>}
  </div></dialog>
}
