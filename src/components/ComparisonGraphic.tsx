import { Component, Suspense, lazy } from 'react'
import type { ReactNode } from 'react'
import type { ComparisonRow, Input } from '../lib/model'
import { number } from '../lib/format'
import './comparison-graphic.css'

const ComparisonScene = lazy(() => import('./ComparisonScene'))
const colors = ['#486b46', '#8fa57c', '#b5bf95']

class GraphicBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export function ComparisonGraphic({ rows, input }: { rows: ComparisonRow[]; input: Input }) {
  const maximum = Math.max(...rows.map(row => row.harvest), 1)
  const loading = <div className="comparison-placeholder" role="status">3D-Modelle werden geladen …</div>
  const unavailable = <div className="comparison-placeholder">3D ist auf diesem Gerät nicht verfügbar. Die Vergleichswerte stehen unten.</div>
  return <figure className="comparison-graphic">
    <div className="comparison-graphic-toolbar"><span>Gemeinsamer Flächenmaßstab</span></div>
    <div className="comparison-stage" data-testid="comparison-graphic">
      <GraphicBoundary fallback={unavailable}><Suspense fallback={loading}><ComparisonScene rows={rows} input={input} fallback={unavailable} loading={loading} /></Suspense></GraphicBoundary>
    </div>
    <figcaption className="comparison-values">{rows.map((row, index) => <div key={row.system}>
      <strong><i style={{ background: colors[index] }} />{row.label}</strong>
      <span>{number(row.footprint)} m² Grundfläche</span>
      <b>{number(row.harvest / 1000, 1)} <small>t Salat / Jahr</small></b>
      <div className="harvest-track"><div style={{ width: `${row.harvest / maximum * 100}%`, background: colors[index] }} /></div>
    </div>)}</figcaption>
    <p className="comparison-geometry-note">Quadratische Grundflächen im selben Maßstab. Gebäudehöhen und Pflanzen schematisch; Balken zeigen die Jahresernte.</p>
  </figure>
}
