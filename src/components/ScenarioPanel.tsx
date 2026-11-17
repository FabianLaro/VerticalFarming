import { ArrowCounterClockwise, BookOpen } from '@phosphor-icons/react'
import { BASE_INPUT, PARAMS, PRESETS, calculate } from '../lib/model'
import type { Input, Result } from '../lib/model'
import { number, percentChange } from '../lib/format'

type Props = { input: Input; result: Result; preset: string; update: (key: keyof Input, value: number) => void; selectPreset: (id: string) => void; reset: () => void; onSource: (id: string) => void }
export function ScenarioPanel({ input, result, preset, update, selectPreset, reset, onSource }: Props) {
  const base = calculate(BASE_INPUT)
  const control = (key: keyof Input) => {
    const param = PARAMS.find(p => p.key === key)!
    const fraction = key === 'usable'
    return <div className="parameter" key={key}><label htmlFor={`param-${key}`}>{param.label}<output htmlFor={`param-${key}`}>{number(input[key] * (fraction ? 100 : 1), key === 'gridFactor' ? 3 : key === 'electricityPrice' ? 2 : 1)} <small>{fraction ? '%' : param.unit}</small></output></label><input id={`param-${key}`} data-testid={`param-${key}`} type="range" min={param.min} max={param.max} step={param.step} value={input[key]} onChange={e => update(key, e.currentTarget.valueAsNumber)} aria-describedby={`help-${key}`} /><details className="parameter-help"><summary>Annahme & Grenze</summary><small id={`help-${key}`}>{param.help}</small><button className="source-link" onClick={() => onSource(param.sourceId)}>Beleg / Annahme öffnen</button></details></div>
  }
  return <div className="scenario-panel"><h2>Parameter</h2><p className="scenario-scope">Alle Eingaben gelten für die Vertical Farm.</p><label className="preset-label" htmlFor="preset">Szenario wählen</label><select id="preset" data-testid="preset" value={preset} onChange={e => selectPreset(e.target.value)}>{PRESETS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}{preset === 'custom' && <option value="custom">Eigene Annahmen</option>}</select>{preset !== 'base' && <p className="preset-description">{PRESETS.find(p => p.id === preset)?.description ?? 'Eigene Parameter; alle nicht geänderten Werte bleiben konstant.'}</p>}
    {control('levels')}{control('footprint')}{control('energyPerKg')}
    <details className="more-controls"><summary>Fläche, Ertrag & Wasser</summary>{control('usable')}{control('yieldPerArea')}{control('waterPerKg')}</details>
    <details className="more-controls"><summary>Strompreis & Versorgung</summary>{control('electricityPrice')}{control('gridFactor')}</details>
    <div className="emission-result"><span>Strombedingter Emissionsbeitrag</span><strong>{number(result.emissions / 1000, 1)} <small>t CO₂eq/a</small></strong><p>{number(result.emissionsPerKg, 2)} kg CO₂eq/kg · {percentChange(result.emissions, base.emissions)} zur Basis</p><small>Strom einschließlich Vorketten. Keine vollständige Klimabilanz der Ernte.</small><button className="source-link" onClick={() => onSource('uba2026')}><BookOpen size={14} />UBA: Referenzmix 2025, geschätzt</button></div>
    <button className="reset-button" onClick={reset}><ArrowCounterClockwise size={17} />Basis vollständig wiederherstellen</button>
    <button className="source-link" onClick={() => onSource('assumptions')}>Annahmen, Einheiten & Grenzen</button>
  </div>
}
