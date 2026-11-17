import { Component, Suspense, lazy, useState } from 'react'
import type { ReactNode } from 'react'
import type { ComparisonRow, Input } from '../lib/model'
import { comparisonLayout } from '../lib/comparison-layout'
import { number } from '../lib/format'
import './comparison-graphic.css'

const ComparisonScene = lazy(() => import('./ComparisonScene'))
const colors = ['#486b46', '#8fa57c', '#b5bf95']

class GraphicBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export function ComparisonPlan({ rows, usable }: { rows: ComparisonRow[]; usable: number }) {
  const { plots, width, depth, gap, scaleMetres } = comparisonLayout(rows)
  const padding = Math.max(width * .025, 2)
  const annotation = Math.max(depth * .15, 4)
  const font = width / 40 + 1.5
  return <svg className="comparison-plan" viewBox={`${-width / 2 - padding} ${-depth - padding} ${width + padding * 2} ${depth + padding + annotation * 2}`} role="img" aria-label="Grundrisse aller drei Anbausysteme im gemeinsamen Längen- und Flächenmaßstab">
    <defs><pattern id="comparison-crops" width={depth / 22} height={depth / 22} patternUnits="userSpaceOnUse"><path d={`M0 ${depth / 44}H${depth / 22}`} stroke="#587c40" strokeWidth={depth / 150} opacity=".55" /></pattern></defs>
    {plots.map(({ row, side, x, z }, index) => <g key={row.system}>
      <rect className="comparison-footprint" data-system={row.system} x={x - side / 2} y={-side} width={side} height={side} fill={colors[index]} fillOpacity=".15" stroke={colors[index]} strokeWidth={depth / 350} />
      {side > 0 && <>
        {row.system !== 'vertical' && <rect x={x - side * .46} y={-side * .96} width={side * .92} height={side * .92} fill="url(#comparison-crops)" />}
        {row.system === 'vertical' ? Array.from({ length: 5 }, (_, i) => <rect key={i} x={x + (-.4 + i * .2) * side - side * usable / 10} y={z - side / 2} width={side * usable / 5} height={side} fill="#486b46" fillOpacity=".45" />) : row.system === 'greenhouse' && <>
          <path d={`M${x} ${-side}V0 M${x - side / 2} ${-side / 2}H${x + side / 2}`} stroke="#697f72" strokeWidth={depth / 400} />
          <path d={`M${x - side / 2} ${-side}L${x + side / 2} 0 M${x + side / 2} ${-side}L${x - side / 2} 0`} stroke="#a2b4ab" strokeWidth={depth / 500} />
        </>}
      </>}
      <text x={x} y={annotation * .75} textAnchor="middle" fontSize={font} fill="#223027">{['VF', 'GH', 'Freiland'][index]}</text>
    </g>)}
    <g transform={`translate(${-width / 2},${-depth + gap * .25})`}>
      <path d={`M0 0H${scaleMetres} M0 ${-depth / 100}V${depth / 100} M${scaleMetres} ${-depth / 100}V${depth / 100}`} fill="none" stroke="#223027" strokeWidth={depth / 220} />
      <text x={0} y={-depth / 30} fontSize={font} fill="#223027">{number(scaleMetres)} m</text>
    </g>
  </svg>
}

export function ComparisonGraphic({ rows, input }: { rows: ComparisonRow[]; input: Input }) {
  const [view, setView] = useState<'3d' | 'plan'>('3d')
  const maximum = Math.max(...rows.map(row => row.harvest), 1)
  const plan = <ComparisonPlan rows={rows} usable={input.usable} />
  return <figure className="comparison-graphic">
    <div className="comparison-graphic-toolbar"><span>Gemeinsamer Flächenmaßstab</span><div className="segmented" aria-label="Vergleichsansicht"><button aria-pressed={view === '3d'} onClick={() => setView('3d')}>3D-Modelle</button><button aria-pressed={view === 'plan'} onClick={() => setView('plan')}>Grundriss</button></div></div>
    <div className="comparison-stage" data-testid="comparison-graphic" data-view={view}>
      {view === 'plan' ? plan : <GraphicBoundary fallback={plan}><Suspense fallback={plan}><ComparisonScene rows={rows} input={input} fallback={plan} /></Suspense></GraphicBoundary>}
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
