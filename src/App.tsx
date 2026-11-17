import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowsOut, BookOpen, Check, Minus, MonitorPlay, Plus, X } from '@phosphor-icons/react'
import { BASE_INPUT, PARAMS, applyPreset, calculate } from './lib/model'
import type { Input } from './lib/model'
import { sources, dataCatalog, RESULT_META } from './data/catalog'
import { number, percentChange } from './lib/format'
import { ScenarioPanel } from './components/ScenarioPanel'
import { ComparePanel } from './components/ComparePanel'
import { Knowledge } from './components/Knowledge'
import { Sensitivity } from './components/Sensitivity'
import { Conflicts } from './components/Conflicts'
import { RenderGallery } from './components/RenderGallery'
import Decision from './components/Decision'
import SceneFallback from './components/SceneFallback'

const FarmScene = lazy(() => import('./components/FarmScene'))
const tabs = ['Erkunden', 'Szenarien', 'Vergleichen', 'Entscheiden'] as const
type Tab = typeof tabs[number]
type System = 'vertical' | 'greenhouse' | 'field'
const systems: { id: System; label: string; note: string }[] = [
  { id: 'vertical', label: 'Vertical Farm', note: 'Kunstlicht · mehrere Ebenen' },
  { id: 'greenhouse', label: 'Gewächshaus', note: 'Sonnenlicht · eine Ebene' },
  { id: 'field', label: 'Freiland', note: 'Saisonal · offenes System' },
]
const parts = {
  plants: { title: 'Anbau in mehreren Ebenen', text: 'Salat wächst in Regalen. Hydroponik bedeutet: Die Wurzeln erhalten Wasser und gelöste Nährstoffe ohne Ackerboden. Mehr Anbaufläche passt auf dieselbe Gebäudegrundfläche.', limit: 'Ertrag je Anbaufläche ist kein Ertrag je Gebäudegrundfläche. Wege und Technik brauchen Platz.', source: 'pennisi2025' },
  lights: { title: 'Licht wird zum Standortfaktor', text: 'LEDs liefern das Licht für die Photosynthese. Licht, Kühlung und Entfeuchtung brauchen Energie. Eine höhere Lichtleistung garantiert keinen proportional höheren Ertrag.', limit: 'Im Modell bleibt der Ertrag frei gewählt. Licht und Wachstum werden nicht unbelegt gekoppelt.', source: 'stanghellini2024' },
  water: { title: 'Ein Kreislauf mit Zuflüssen', text: 'Eine Pumpe führt Nährlösung zu den Wurzeln. Rückleitungen sammeln überschüssige Lösung. Wasser und Nährsalze werden geprüft und ergänzt; Ernte und Reinigung führen Stoffe aus.', limit: 'Rückführung spart Ressourcen, macht die Farm aber nicht unabhängig von Wasser, Dünger und Betriebsmitteln.', source: 'dlr2019' },
  climate: { title: 'Klima ist technische Arbeit', text: 'Lüftung, Kühlung und Entfeuchtung regeln Temperatur und Luftfeuchte. Sensoren helfen beim Steuern. Ausfälle gefährden eng belegte Kulturen; Ersatzteile und Fachkräfte bleiben nötig.', limit: 'Der eingegebene Energiebedarf enthält im Szenario Licht, Klima und Pumpen gemeinsam. Es wird nichts zusätzlich aufgeschlagen.', source: 'pennisi2025' },
  harvest: { title: 'Von der Farm in die Stadt', text: 'Geerntet, sortiert und verpackt wird außerhalb der Regale. Kurze Wege können Frische und planbare Lieferungen erleichtern. Preis, erreichbare Abnehmer und bezahlbarer Zugang entscheiden über den Versorgungsnutzen.', limit: 'Blattgemüse ergänzt die Ernährung. Es ersetzt weder Grundnahrungsmittel noch eine vielfältige Landwirtschaft.', source: 'dlr2019' },
  shell: { title: 'Gebäude und Stadt zusammendenken', text: 'Ein geeigneter Standort braucht verlässlichen Strom, Wasser, Logistik und Genehmigungen. Abwärme und vorhandene Gebäude können interessant sein, wenn ihre tatsächliche Nutzbarkeit belegt wird.', limit: 'Der ALTMARKTgarten nutzt Sonnenlicht auf einem Dach. Er ist kein Leistungsnachweis für eine vollständig künstlich beleuchtete Pflanzenfabrik.', source: 'fraunhofer' },
} as const
type Part = keyof typeof parts
const partLabels: Record<Part, string> = { plants: 'Anbau', lights: 'Licht', water: 'Wasser', climate: 'Klima', harvest: 'Ernte', shell: 'Gebäude' }
const tour = [
  { tab: 'Erkunden' as Tab, title: 'Die Frage der Stadt', time: '1 Minute', text: 'Soll die Stadt Vertical Farming fördern? Nennt zuerst das öffentliche Ziel: Versorgung, Umwelt oder technisches Lernen.' },
  { tab: 'Erkunden' as Tab, title: 'So funktioniert die Farm', time: '2 Minuten', text: 'Öffnet die Schnittansicht. Verfolgt Wasser, Licht und Ernte. Welche Ressourcen kommen von außen?' },
  { tab: 'Vergleichen' as Tab, title: 'Eine faire Bezugsgröße', time: '2 Minuten', text: 'Wechselt zwischen gleicher Grundfläche und gleicher Ernte. Erklärt, warum die Referenzen keine NRW-Prognose sind.' },
  { tab: 'Szenarien' as Tab, title: 'Was ändert das Ergebnis?', time: '2 Minuten', text: 'Lasst das Publikum Strompreis oder Ebenenzahl wählen. Trennt Änderungen je Kilogramm von Änderungen der Gesamtmenge.' },
  { tab: 'Entscheiden' as Tab, title: 'Wer trägt Nutzen und Risiko?', time: '2 Minuten', text: 'Besprecht zwei Zielkonflikte. Wählt die zwei wichtigsten Kriterien und erklärt eure Wertentscheidung.' },
  { tab: 'Entscheiden' as Tab, title: 'Eine überprüfbare Empfehlung', time: '2 Minuten', text: 'Formuliert eine Förderentscheidung mit zwei prüfbaren Bedingungen. Welche neue Information könnte euer Urteil ändern?' },
]

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('Erkunden')
  const [input, setInput] = useState<Input>({ ...BASE_INPUT })
  const [preset, setPreset] = useState('base')
  const [system, setSystem] = useState<System>('vertical')
  const [part, setPart] = useState<Part>('plants')
  const [view, setView] = useState<'cutaway' | 'closed' | 'exploded'>('cutaway')
  const [camera, setCamera] = useState<'perspective' | 'top' | 'front'>('perspective')
  const [resetKey, setResetKey] = useState(0)
  const [command, setCommand] = useState<{ action: 'left' | 'right' | 'in' | 'out'; seq: number }>()
  const [quality, setQuality] = useState<'low' | 'high'>('high')
  const [fallback, setFallback] = useState(false)
  const [source, setSource] = useState<string | null>(null)
  const [step, setStep] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const result = calculate(input)
  const base = calculate(BASE_INPUT)
  const selectedPart = parts[part]
  const showScene = tab === 'Erkunden' || tab === 'Szenarien'
  const sceneProps = { system, levels: input.levels, footprint: input.footprint, view, cameraView: camera, resetKey, quality, cameraCommand: command, onSelect: (id: string) => { if (id in parts) setPart(id as Part) } }
  const reset = () => { setInput({ ...BASE_INPUT }); setPreset('base'); setSystem('vertical'); setView('cutaway'); setCamera('perspective'); setResetKey(k => k + 1); setNotice('Basisszenario und Standardansicht wiederhergestellt.') }
  const update = (key: keyof Input, value: number) => { setInput(current => ({ ...current, [key]: value })); setPreset('custom') }
  const go = (next: number) => { const n = Math.max(0, Math.min(tour.length - 1, next)); setStep(n); setTab(tour[n].tab); if (n === 1) { setSystem('vertical'); setView('cutaway'); setPart('water') } window.scrollTo({ top: 0, behavior: 'instant' }) }
  useEffect(() => {
    if (step === null) return
    const handler = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest('input,textarea,select,button,dialog')) return
      if (event.key === 'ArrowRight') go(step + 1)
      if (event.key === 'ArrowLeft') go(step - 1)
      if (event.key === 'Escape') setStep(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step])
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(timer) }, [notice])

  return <div className={step !== null ? 'app presenting' : 'app'}>
    <a className="skip-link" href="#main">Zum Inhalt</a>
    <header className="site-header no-print">
      <button className="brand" aria-label="Stadtlabor 2040 Startseite" onClick={() => { setTab('Erkunden'); setStep(null) }}>Stadtlabor <span className="brand-year">2040</span></button>
      <nav className="main-nav no-print" aria-label="Bereiche">{tabs.map(name => <button key={name} onClick={() => setTab(name)} aria-current={tab === name ? 'page' : undefined}>{name}</button>)}</nav>
      <div className="header-actions"><button className="text-button" onClick={() => setSource('all')}><BookOpen size={19} /><span>Belege</span></button><button className="button button-dark" onClick={() => step === null ? go(0) : setStep(null)}><MonitorPlay size={18} />{step === null ? 'Vortrag starten' : 'Vortrag beenden'}</button></div>
    </header>
    <main id="main">
      <div className={tab === 'Erkunden' || tab === 'Szenarien' ? 'page-heading no-print' : 'visually-hidden no-print'}><h1>{tab === 'Erkunden' ? 'Soll unsere Stadt Vertical Farming fördern?' : tab === 'Szenarien' ? 'Szenariorechner' : tab === 'Vergleichen' ? 'Anbau vergleichen' : 'Förderentscheidung'}</h1><span>Szenariomodell</span></div>
      {step !== null && <aside className="tour-note no-print" aria-label="Vortragsnotizen"><span>{step + 1} / 6 · {tour[step].time}</span><strong>{tour[step].title}</strong><p>{tour[step].text}</p></aside>}

      {showScene && <section className="explore-grid no-print" aria-label={tab === 'Erkunden' ? 'Anbausysteme erkunden' : 'Szenariomodell verändern'}>
        <div className="visual-column">
          <div className="system-switch" aria-label="Anbausystem">{systems.map(item => <button key={item.id} aria-pressed={system === item.id} onClick={() => setSystem(item.id)}><span>{item.label}</span><small>{item.note}</small></button>)}</div>
          <div className="scene-shell" data-testid="scene" data-system={system} data-levels={input.levels} data-footprint={input.footprint}>
            <div className="scene-heading"><span>{systems.find(s => s.id === system)?.label}</span><span className="scene-live">{fallback ? 'Ersatzschema' : 'Interaktives Modell'}</span></div>
            <div className="scene-canvas">
              {fallback ? <SceneFallback {...sceneProps} /> : <SceneBoundary key={`${quality}-${resetKey}`} fallback={<SceneFallback {...sceneProps} />}><Suspense fallback={<div className="scene-loading">Das räumliche Modell wird aufgebaut …</div>}><FarmScene {...sceneProps} /></Suspense></SceneBoundary>}
            </div>
            <div className="scene-scale">Schematische Geometrie · Ansichten jeweils eingepasst<span>{number(input.footprint)} m² Grundfläche{system === 'vertical' ? ` · ${input.levels} Anbauebenen` : ' · eine Anbauebene'}</span></div>
            <div className="scene-controls"><div className="segmented" aria-label="Gebäudeansicht">{([['cutaway', 'Schnitt'], ['closed', 'Hülle'], ['exploded', 'Aufbau']] as const).map(([id, label]) => <button key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div><div className="camera-tools"><button title="Nach links drehen" aria-label="Nach links drehen" onClick={() => setCommand(c => ({ action: 'left', seq: (c?.seq ?? 0) + 1 }))}><ArrowLeft /></button><button title="Nach rechts drehen" aria-label="Nach rechts drehen" onClick={() => setCommand(c => ({ action: 'right', seq: (c?.seq ?? 0) + 1 }))}><ArrowRight /></button><button title="Vergrößern" aria-label="Vergrößern" onClick={() => setCommand(c => ({ action: 'in', seq: (c?.seq ?? 0) + 1 }))}><Plus /></button><button title="Verkleinern" aria-label="Verkleinern" onClick={() => setCommand(c => ({ action: 'out', seq: (c?.seq ?? 0) + 1 }))}><Minus /></button><button title="Kamera zurücksetzen" aria-label="Kamera zurücksetzen" onClick={() => { setCamera('perspective'); setResetKey(k => k + 1) }}><ArrowsOut /></button></div></div>
          </div>
          <div className="scene-options"><span>Ziehen zum Drehen · Scrollen / zwei Finger zum Zoomen</span><div><label className="select-compact">Kamera <select value={camera} onChange={e => setCamera(e.target.value as typeof camera)}><option value="perspective">Räumlich</option><option value="top">Von oben</option><option value="front">Von vorn</option></select></label><label className="select-compact">Grafik <select value={fallback ? 'fallback' : quality} onChange={e => { setFallback(e.target.value === 'fallback'); if (e.target.value !== 'fallback') setQuality(e.target.value as typeof quality) }}><option value="high">Detail</option><option value="low">Sparsam</option><option value="fallback">Ersatzschema</option></select></label></div></div>
        </div>
      {showScene && <section className="metrics no-print" aria-label="Ergebnisse des Vertical-Farm-Szenarios" aria-live="polite"><div className="metric-intro"><span>VF · ein Jahr</span><p>Eigene Annahmen</p></div><div className="metric"><span>Jährliche Ernte</span><strong data-testid="harvest">{number(result.harvest / 1000, 1)} <small>t</small></strong><small>{percentChange(result.harvest, base.harvest)} zur Basis</small></div><div className="metric"><span>Energiebedarf¹</span><strong data-testid="energy">{number(result.energy / 1000)} <small>MWh</small></strong><small>{number(input.energyPerKg, 1)} kWh je kg</small></div><div className="metric"><span>Frischwasserzusatz²</span><strong>{number(result.water / 1000)} <small>m³</small></strong><small>{number(input.waterPerKg, 1)} Liter je kg</small></div><div className="metric"><span>Stromkosten¹</span><strong data-testid="cost">{number(result.electricityCost / 1000, 1)} <small>Tsd. €</small></strong><small>{number(result.electricityPerKg, 2)} € je kg · Teilkosten</small></div></section>}
      {showScene && <details className="metric-footnote no-print"><summary>Bilanzgrenzen und Annahmen</summary><p>¹ Gesamtenergie vereinfachend als Strom; enthält Licht, Klima und Pumpen. ² Frischwasserzusatz im Anbau, ohne Reinigung und Vorketten. Keine vollständigen Produktionskosten oder Klimabilanz. Alle Werte: aktuelles Szenario.</p><button className="source-link" onClick={() => setSource('assumptions')}>Annahmen öffnen</button></details>}


        <aside className="inspector">
          {tab === 'Szenarien' ? <ScenarioPanel input={input} result={result} preset={preset} update={update} selectPreset={id => { setInput(applyPreset(id)); setPreset(id); setSystem('vertical') }} reset={reset} onSource={setSource} /> : <>
            <div className="inspector-heading">Bauteile</div>
            <div className="part-buttons" aria-label="Bauteil auswählen">{(Object.keys(parts) as Part[]).map((id, i) => <button key={id} aria-label={parts[id].title} aria-pressed={part === id} onClick={() => setPart(id)}><span>{i + 1}</span>{partLabels[id]}</button>)}</div>
            <div className="part-copy"><h2>{selectedPart.title}</h2><p>{selectedPart.text}</p><details className="boundary-note"><summary>Einordnung</summary><p>{selectedPart.limit}</p></details><button className="source-link" onClick={() => setSource(selectedPart.source)}><BookOpen size={15} />Beleg und Grenzen <ArrowRight size={14} /></button></div>
            <div className="area-equation"><span>Grundfläche ≠ Anbaufläche</span><strong>{number(input.footprint)} <small>m²</small> <span>×</span> {number(input.usable * 100)}<small>%</small> <span>×</span> {input.levels}</strong><div><ArrowDown size={17} /><b>{number(result.cultivationArea)} m²</b> Anbaufläche im VF-Szenario</div></div>
            {system !== 'vertical' && <p className="system-caveat">Die Kennzahlen unten gehören weiterhin zum VF-Szenario. Die Vergleichswerte für {system === 'greenhouse' ? 'Gewächshaus' : 'Freiland'} stehen unter „Vergleichen“.</p>}
          </>}
        </aside>
      </section>}

      {tab === 'Erkunden' && <><details className="render-archive no-print"><summary>Gerenderte Ansichten und Nahaufnahme</summary><RenderGallery system={system} onSystemChange={setSystem} /></details><Knowledge onSource={setSource} onScenario={() => { setTab('Szenarien'); setSystem('vertical') }} /></>}
      {tab === 'Szenarien' && <><details className="scenario-method no-print"><summary>Rechenweg und Modellgrenzen</summary><section className="scenario-explanation"><div><p>Das Jahresmodell hält Ertrag und Energie je Kilogramm konstant, bis du diese Annahmen selbst änderst. Es bildet weder Pflanzenwachstum noch Marktpreise oder Gewinne ab.</p></div><div className="formula-list"><p><span>Anbaufläche</span>Grundfläche × Nutzanteil × Ebenen</p><p><span>Ernte</span>Anbaufläche × Jahresertrag</p><p><span>Energie</span>Ernte × Energiebedarf je kg</p><p><span>Strombeitrag</span>Energie × Emissionsfaktor</p><p className="note">Einheiten: m² · kg/a · kWh/a · kg CO₂eq/a. Geringere Emissionen aus Strom sind keine vollständige Klimaneutralität.</p></div></section></details><details className="sensitivity-section no-print"><summary>Annahmen prüfen (±20 %)</summary><Sensitivity input={input} /></details></>}
      {tab === 'Vergleichen' && <ComparePanel input={input} onSource={setSource} />}
      {tab === 'Entscheiden' && <><Decision input={input} result={result} onSource={setSource} /><Conflicts onSource={setSource} /></>}
      <div className="page-end no-print"><span>Szenariomodell, keine Betriebsprognose.</span><button className="text-button" onClick={() => setSource('all')}>Quellen und Annahmen <ArrowRight size={16} /></button></div>
    </main>
    {step !== null && <div className="tour-bar no-print"><button className="button" disabled={step === 0} onClick={() => go(step - 1)}><ArrowLeft />Zurück</button><div className="tour-progress" aria-label={`Schritt ${step + 1} von 6`}>{tour.map((item, i) => <button key={item.title} aria-current={step === i ? 'step' : undefined} aria-label={`${i + 1}. ${item.title}`} onClick={() => go(i)} />)}</div><span>{step + 1} / 6</span><button className="button button-dark" onClick={() => step === 5 ? setStep(null) : go(step + 1)}>{step === 5 ? 'Vortrag abschließen' : 'Weiter'}<ArrowRight /></button></div>}
    <div className="toast no-print" role="status">{notice && <><Check />{notice}</>}</div>
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
