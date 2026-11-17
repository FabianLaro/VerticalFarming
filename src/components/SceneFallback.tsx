import type { FarmSceneProps } from './FarmScene'

export function SceneFallback({ system, levels, footprint, onSelect }: Pick<FarmSceneProps, 'system' | 'levels' | 'footprint' | 'onSelect'>) {
  const count = system === 'vertical' ? levels : 1
  const height = 190 / Math.max(count, 3)
  return <div className="scene-fallback">
    <svg viewBox="0 0 760 400" role="img" aria-label={`Schematische Ersatzansicht ${system === 'vertical' ? 'Vertical Farm' : system === 'greenhouse' ? 'Gewächshaus' : 'Freiland'}, ${count} Anbauebene${count === 1 ? '' : 'n'}`}>
      <rect x="50" y="60" width="660" height="280" rx="18" fill="#e1e7d5" />
      <path d="M90 320H675" stroke="#9fae91" strokeWidth="8" />
      {system === 'vertical' && <path d="M100 310V85H570V310 M115 85V310 M545 85V310" fill="none" stroke="#9aa997" strokeWidth="9" />}
      {system === 'greenhouse' && <path d="M100 310V170L335 70L570 170V310 M335 70V310" fill="#c4d9cb" fillOpacity=".4" stroke="#8ea58f" strokeWidth="6" />}
      {Array.from({ length: count }, (_, level) => {
        const y = 296 - level * height
        return <g key={level}>
          <rect x="125" y={y} width="400" height="8" rx="2" fill={system === 'field' ? '#88765b' : '#aab9a0'} />
          {system === 'vertical' && <path d={`M130 ${y - height + 12}H520`} stroke="#82b9bc" strokeWidth="4" />}
          {Array.from({ length: 15 }, (_, i) => <g key={i} transform={`translate(${140 + i * 26},${y - 8})`}><ellipse rx="10" ry="6" fill={i % 2 ? '#659350' : '#80a25c'} /><ellipse rx="6" ry="10" fill="#74a35b" /></g>)}
        </g>
      })}
      <rect x="610" y="230" width="55" height="75" rx="13" fill="#98b9b2" />
      <path d="M610 270H550V315H115V298" stroke="#579b9f" strokeWidth="5" fill="none" />
      <path d="M125 307H540V285H610" stroke="#397778" strokeWidth="3" fill="none" />
      <text x="90" y="365" fontSize="16" fill="#435641">{footprint.toLocaleString('de-DE')} m² Grundfläche · {count} {count === 1 ? 'Ebene' : 'Ebenen'} · Schema ohne Maßstab</text>
    </svg>
    <p>Technische Ersatzansicht. Alle Rechnungen und Erläuterungen bleiben verfügbar.</p>
    <div className="scene-fallback-parts">
      {[["plants", "Pflanzen"], ["water", "Nährlösung"], ...(system === 'vertical' ? [["lights", "LED"], ["climate", "Klima"]] : []), ["harvest", "Ernte"]].map(([id, name]) => <button key={id} type="button" onClick={() => onSelect(id)}>{name} erklären</button>)}
    </div>
  </div>
}

export default SceneFallback
