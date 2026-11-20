import { Component, lazy, Suspense, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Cube, Eye, Minus, Plus } from '@phosphor-icons/react'
import { partLabels, parts } from '../data/farm-parts'
import type { Part } from '../data/farm-parts'
import type { Input, Result, System } from '../lib/model'
import { number } from '../lib/format'
import { Knowledge } from './Knowledge'
import { RenderGallery } from './RenderGallery'
import SceneFallback from './SceneFallback'

const FarmScene = lazy(() => import('./FarmScene'))
const sites: { id: System; label: string; place: string; requirement: string; poster: string }[] = [
  { id: 'vertical', label: 'Vertical Farm', place: 'Industriehalle', requirement: 'Für die Umnutzung zählen Netzanschluss, Hallenhöhe und gesicherter Absatz.', poster: 'vertical-farm' },
  { id: 'greenhouse', label: 'Gewächshaus', place: 'Dach oder Stadtrand', requirement: 'Sonnenlicht, Tragfähigkeit und nutzbare Abwärme entscheiden über die Eignung. Oberhausen liefert einen regionalen Referenzfall.', poster: 'greenhouse' },
  { id: 'field', label: 'Freiland', place: 'Niederrheinisches Umland', requirement: 'Boden, saisonale Ernte, Bewässerung und Lieferlogistik prägen das Angebot.', poster: 'field' },
]

class ModelBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

type StudyProps = { input: Input; result: Result; onSource: (id: string) => void; onCompare: () => void }

export function SiteStudy({ input, result, onSource, onCompare }: StudyProps) {
  const [system, setSystem] = useState<System>('vertical')
  const [part, setPart] = useState<Part>('plants')
  const [interactive, setInteractive] = useState(false)
  const [view, setView] = useState<'cutaway' | 'closed' | 'exploded'>('cutaway')
  const [camera, setCamera] = useState<'perspective' | 'top' | 'front'>('perspective')
  const [resetKey, setResetKey] = useState(0)
  const [cameraCommand, setCameraCommand] = useState<{ action: 'left' | 'right' | 'in' | 'out'; seq: number }>()
  const [quality, setQuality] = useState<'low' | 'high' | 'fallback'>(() => window.matchMedia('(pointer: coarse)').matches ? 'low' : 'high')
  const site = sites.find(item => item.id === system)!
  const selected = parts[part]
  const sceneProps = { system, levels: input.levels, footprint: input.footprint, usable: input.usable, selectedPart: part, view, cameraView: camera, resetKey, cameraCommand, quality: quality === 'fallback' ? 'low' as const : quality, onSelect: (id: string) => { if (Object.hasOwn(parts, id)) setPart(id as Part) } }
  const fallback = <SceneFallback {...sceneProps} />

  return <section className="site-study no-print">
    <div className="atlas-hero">
      <div className="atlas-hero-copy">
        <p className="atlas-location">Dinslaken <span /> Niederrhein</p>
        <h1>Soll Dinslaken Vertical Farming fördern?</h1>
        <p>Was braucht eine Stadtfarm, und wann liefert sie einen Vorteil gegenüber Gewächshaus oder Freiland?</p>
        <button type="button" className="atlas-primary" onClick={onCompare}>Systeme vergleichen <ArrowRight size={19} /></button>
      </div>
      <figure className="atlas-model" data-testid="scene" data-system={system} data-levels={input.levels}>
        <div className="atlas-model-picture">
          {interactive ? <ModelBoundary key={system + quality} fallback={fallback}><Suspense fallback={<p className="atlas-loading" role="status">3D-Modell wird geladen …</p>}>{quality === 'fallback' ? fallback : <FarmScene {...sceneProps} />}</Suspense></ModelBoundary> :
            <img width="1200" height="820" alt={site.label + ' als räumliches Schaubild'} src={`./renders/${site.poster}-poster.webp`} fetchPriority="high" />}
          {!interactive && system === 'vertical' && <div className="atlas-notes" aria-label="Bauteile in der Darstellung">
            {(['plants', 'lights', 'water'] as const).map(id => <button type="button" className={`atlas-note atlas-note-${id}`} key={id} onClick={() => setPart(id)} aria-pressed={part === id}><span />{partLabels[id]}</button>)}
          </div>}
        </div>
        <figcaption className="atlas-model-caption">
          <span>{site.label} <small>· {interactive ? 'Schematische Geometrie' : 'Feste Renderansicht'}</small></span>
          <button type="button" className="atlas-outline" onClick={() => setInteractive(value => !value)}>{interactive ? <Eye size={17} /> : <Cube size={17} />}{interactive ? 'Renderansicht' : '3D öffnen'}</button>
        </figcaption>
        {interactive && <div className="atlas-camera-controls">
          <div className="segmented" aria-label="Gebäudeansicht">{([['cutaway', 'Schnitt'], ['closed', 'Hülle'], ['exploded', 'Aufbau']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div>
          <label>Kamera <select value={camera} onChange={event => setCamera(event.target.value as typeof camera)}><option value="perspective">Räumlich</option><option value="top">Von oben</option><option value="front">Von vorn</option></select></label>
          <label>Grafik <select value={quality} onChange={event => setQuality(event.target.value as typeof quality)}><option value="high">Detail</option><option value="low">Sparsam</option><option value="fallback">Ersatzschema</option></select></label>
          {quality !== 'fallback' && <div className="atlas-camera-keys" aria-label="Kamera bewegen">{([
            ['left', 'Nach links drehen', ArrowLeft], ['right', 'Nach rechts drehen', ArrowRight], ['in', 'Vergrößern', Plus], ['out', 'Verkleinern', Minus],
          ] as const).map(([action, label, Icon]) => <button type="button" className="atlas-icon" title={label} aria-label={label} key={action} onClick={() => setCameraCommand(previous => ({ action, seq: (previous?.seq ?? 0) + 1 }))}><Icon size={17} /></button>)}</div>}
          <button type="button" className="atlas-text" onClick={() => { setCamera('perspective'); setResetKey(value => value + 1) }}>Kamera zurücksetzen</button>
        </div>}
      </figure>
    </div>

    <div className="atlas-site-grid" aria-label="Standorttypen">
      {sites.map(item => <button type="button" key={item.id} onClick={() => setSystem(item.id)} aria-pressed={system === item.id} className={`atlas-site atlas-system-${item.id}`}>
        <small>{item.label}</small><strong>{item.place}</strong><ArrowRight size={18} />
      </button>)}
    </div>
    <section className="atlas-site-detail" aria-label="Standort und Bauteile">
      <div><h2>Was der Standort braucht</h2><p>{site.requirement}</p><small>Standorttypen im Szenario, ohne geprüftes Grundstück.</small>{system === 'greenhouse' && <button type="button" className="atlas-text" onClick={() => onSource('fraunhofer')}>ALTMARKTgarten Oberhausen <ArrowRight size={15} /></button>}</div>
      {system === 'vertical' && <div>
        <div className="atlas-parts" aria-label="Bauteil auswählen">{(Object.keys(parts) as Part[]).map(id => <button type="button" key={id} onClick={() => setPart(id)} aria-pressed={part === id}>{partLabels[id]}</button>)}</div>
        <div aria-live="polite"><h2>{selected.title}</h2><p>{selected.text}</p></div>
        <button type="button" className="atlas-text" onClick={() => onSource(selected.source)}>Beleg und Grenzen <ArrowRight size={15} /></button><details className="atlas-part-limit"><summary>Aussagegrenze</summary><p>{selected.limit}</p></details>
      </div>}
      <div className="atlas-land-key"><span>Grundfläche → Anbaufläche</span><strong>{number(input.footprint)} → {number(result.cultivationArea)} <small>m²</small></strong><p>Vertical Farm · {number(input.usable * 100)} % nutzbar · {input.levels} Ebenen</p></div>
    </section>

    <details className="render-archive atlas-details"><summary>Gerenderte Ansichten und Nahaufnahme</summary><RenderGallery system={system} onSystemChange={setSystem} /></details>
    <Knowledge onSource={onSource} />
  </section>
}
