import { useId } from 'react'
import { PARAMS } from '../lib/model'
import type { Input, InputKey } from '../lib/model'
import { number } from '../lib/format'

const controlLabels: Partial<Record<InputKey, string>> = {
  levels: 'Anbauebenen', energyPerKg: 'Strombedarf je kg', gridFactor: 'Strommix',
}

export function ScenarioControl({ field, input, update, label }: {
  field: InputKey
  input: Input
  update: (key: InputKey, value: number) => void
  label?: string
}) {
  const id = useId()
  const param = PARAMS.find(candidate => candidate.key === field)!
  const percentage = field === 'usable'
  const value = number(input[field] * (percentage ? 100 : 1), 3)
  const unit = percentage ? '%' : param.unit
  return <div className="atlas-slider" title={param.help}>
    <label htmlFor={id}>{label ?? controlLabels[field] ?? param.label}<output htmlFor={id} aria-hidden="true">{value} <small>{unit}</small></output></label>
    <input id={id} data-testid={`param-${field}`} type="range" min={param.min} max={param.max} step={param.step} value={input[field]} aria-valuetext={`${value} ${unit}`} onChange={event => update(field, event.currentTarget.valueAsNumber)} />
  </div>
}
