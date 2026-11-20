import { Component, Suspense, lazy, useState } from 'react'
import type { ReactNode } from 'react'
import type { ComparisonMode, ComparisonRow, Input } from '../lib/model'
import { number } from '../lib/format'
import './comparison-graphic.css'

const ComparisonScene = lazy(() => import('./ComparisonScene'))

class GraphicBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export function ComparisonGraphic({ rows, input, mode }: { rows: ComparisonRow[]; input: Input; mode: ComparisonMode }) {
  const [show3d, setShow3d] = useState(false)
  const areas = mode === 'harvest'
  const maximum = Math.max(...rows.map(row => areas ? row.footprint : row.harvest), 1)
  const unavailable = <p className="atlas-3d-message">Auf diesem Gerät wird der Vergleich in 2D dargestellt.</p>
  const loading = <p className="atlas-3d-message" role="status">3D-Modelle werden geladen …</p>

  return <>
    <figure className={`atlas-comparison ${areas ? 'atlas-comparison-area' : 'atlas-comparison-yield'}`} data-testid="comparison-graphic">
      <figcaption>{areas ? 'Grundfläche für die gleiche Jahresernte' : 'Jahresernte auf gleicher Grundfläche'}</figcaption>
      <div className="atlas-comparison-rows">{rows.map(row => {
        const size = areas ? Math.sqrt(row.footprint / maximum) * 100 : row.harvest / maximum * 100
        return <div key={row.system} className={`atlas-comparison-item atlas-system-${row.system}`}>
          <div className="atlas-comparison-label"><span>{row.label}</span><strong>{number(areas ? row.footprint : row.harvest / 1000, areas ? 0 : 1)} <small>{areas ? 'm²' : 't/Jahr'}</small></strong></div>
          <div className="atlas-comparison-plot" aria-hidden="true">
            <div className={areas ? 'atlas-square-frame' : 'atlas-yield-track'}><div style={{ width: `${size}%` }} /></div>
          </div>
        </div>
      })}</div>
      <p>{areas ? 'Quadrate im selben Flächenmaßstab. Gezeigt wird die direkte Grundfläche.' : 'Balken mit gemeinsamer Skala ab null. Gezeigt wird Salatfrischmasse.'}</p>
    </figure>
    <details className="atlas-details atlas-compare-3d" onToggle={event => setShow3d(event.currentTarget.open)}>
      <summary>Vergleich zusätzlich in 3D ansehen</summary>
      <div className="comparison-stage">
        {show3d && <GraphicBoundary fallback={unavailable}><Suspense fallback={loading}><ComparisonScene rows={rows} input={input} fallback={unavailable} loading={loading} /></Suspense></GraphicBoundary>}
      </div>
      <p>Die Höhe der Modelle und die Pflanzen sind schematisch dargestellt.</p>
    </details>
  </>
}
