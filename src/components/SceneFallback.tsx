import { useId } from 'react'
import type { FarmSceneProps } from './FarmScene'
import './scene.css'

export function SceneFallback({ system, levels, footprint, onSelect }: Pick<FarmSceneProps, 'system' | 'levels' | 'footprint' | 'onSelect'>) {
  const markerId = useId()
  const vertical = system === 'vertical'
  const count = vertical ? levels : 1
  const height = 190 / Math.max(count, 3)
  return <div className="scene-fallback">
    <svg viewBox="0 0 760 400" role="img" aria-label={`Schematische Ersatzansicht ${system === 'vertical' ? 'Vertical Farm' : system === 'greenhouse' ? 'Gewächshaus' : 'Freiland'}, ${count} Anbauebene${count === 1 ? '' : 'n'}`}>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
        </marker>
      </defs>
      <rect x="50" y="60" width="660" height="280" rx="18" fill="#e1e7d5" />
      <path d="M90 320H675" stroke="#9fae91" strokeWidth="8" />
      {system === 'vertical' && <path d="M100 310V85H570V310 M115 85V310 M545 85V310" fill="none" stroke="#9aa997" strokeWidth="9" />}
      {system === 'greenhouse' && <path d="M100 310V170L335 70L570 170V310 M335 70V310" fill="#c4d9cb" fillOpacity=".4" stroke="#8ea58f" strokeWidth="6" />}
      {Array.from({ length: count }, (_, level) => {
        const y = 296 - level * height
        return <g key={level}>
          <rect x="125" y={y} width="400" height="8" rx="2" fill={vertical ? '#aab9a0' : '#88765b'} />
          {vertical && <>
            <path d={`M115 ${y + 3}H270H339`} stroke="#318f9a" strokeWidth="3" fill="none" markerMid={`url(#${markerId})`} />
            <path d={`M339 ${y + 3}H488H544`} stroke="#226453" strokeWidth="3" fill="none" markerMid={`url(#${markerId})`} />
          </>}
          {system === 'vertical' && <path d={`M130 ${y - height + 12}H520`} stroke="#82b9bc" strokeWidth="4" />}
          {Array.from({ length: 15 }, (_, i) => <g key={i} transform={`translate(${140 + i * 26},${y - 8})`}><ellipse rx="10" ry="6" fill={i % 2 ? '#659350' : '#80a25c'} /><ellipse rx="6" ry="10" fill="#74a35b" /></g>)}
        </g>
      })}
      {vertical ? <>
        <rect x="610" y="230" width="55" height="95" rx="13" fill="#98b9b2" />
        <text x="620" y="260" fontSize="15" fill="#294a42">Tank</text>
        <path d={`M665 290H682V331H115V${299 - (count - 1) * height}`} stroke="#318f9a" strokeWidth="4" fill="none" />
        <path d="M430 331H405M115 326V307" stroke="#318f9a" strokeWidth="4" markerEnd={`url(#${markerId})`} />
        <circle cx="682" cy="307" r="8" fill="#318f9a" /><text x="653" y="350" fontSize="14" fill="#294a42">Pumpe</text>
        <path d={`M544 ${299 - (count - 1) * height}V315H610`} stroke="#226453" strokeWidth="4" fill="none" markerEnd={`url(#${markerId})`} />
        <text x="589" y="200" fontSize="14" fill="#76569c">Entfeuchtung</text>
        <path d="M638 205V230" stroke="#76569c" strokeWidth="3" strokeDasharray="3 3" markerEnd={`url(#${markerId})`} />
      </> : <path d="M610 270H550V315H125" stroke="#579b9f" strokeWidth="5" fill="none" />}
      <text x="90" y="365" fontSize="16" fill="#435641">{vertical ? footprint.toLocaleString('de-DE') + ' m² Grundfläche · ' : ''}{count} {count === 1 ? 'Ebene' : 'Ebenen'} · Schema ohne Maßstab</text>
    </svg>
    <p>Technische Ersatzansicht. Alle Rechnungen und Erläuterungen bleiben verfügbar.</p>
    <div className="scene-fallback-parts">
      {[["plants", "Pflanzen"], ["water", vertical ? "Nährlösung" : "Bewässerung"], ...(vertical ? [["lights", "LED"], ["climate", "Klima"]] : []), ["harvest", "Ernte"]].map(([id, name]) => <button key={id} type="button" onClick={() => onSelect(id)}>{name} erklären</button>)}
    </div>
  </div>
}

export default SceneFallback
