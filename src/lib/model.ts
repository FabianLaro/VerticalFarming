import { evidenceData, inputData } from '../data/catalog';

export type Input = { [K in keyof typeof inputData]: number };
export type InputKey = keyof Input;
export type System = 'vertical' | 'greenhouse' | 'field';

export const BASE_INPUT: Readonly<Input> = Object.freeze(
  Object.fromEntries(Object.entries(inputData).map(([key, datum]) => [key, datum.value])) as Input,
);

export interface Parameter {
  key: InputKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  group: 'Fläche & Anbau' | 'Energie & Wasser';
  sourceId: string;
  help: string;
}

const parameter = (key: InputKey, min: number, max: number, step: number, group: Parameter['group']): Parameter => ({
  key, label: inputData[key].label, unit: inputData[key].unit, min, max, step, group,
  sourceId: inputData[key].sourceId, help: `${inputData[key].boundary} ${inputData[key].uncertainty}`,
});

export const PARAMS: readonly Parameter[] = [
  parameter('footprint', 100, 3000, 100, 'Fläche & Anbau'),
  parameter('usable', 0.1, 0.9, 0.05, 'Fläche & Anbau'),
  parameter('levels', 1, 10, 1, 'Fläche & Anbau'),
  parameter('yieldPerArea', 10, 120, 5, 'Fläche & Anbau'),
  parameter('energyPerKg', 2, 30, 0.5, 'Energie & Wasser'),
  parameter('electricityPrice', 0.05, 0.8, 0.01, 'Energie & Wasser'),
  parameter('gridFactor', 0, 1, 0.001, 'Energie & Wasser'),
  parameter('waterPerKg', 1, 30, 0.5, 'Energie & Wasser'),
];

export interface Result {
  cultivationArea: number;
  harvest: number;
  energy: number;
  water: number;
  electricityCost: number;
  electricityPerKg: number;
  emissions: number;
  emissionsPerKg: number;
}

/** Mathematical domain includes zero for independent boundary checks; UI uses PARAMS. */
export function validateInput(input: Input): void {
  for (const key of Object.keys(BASE_INPUT) as InputKey[]) {
    if (!Number.isFinite(input[key]) || input[key] < 0) throw new RangeError(`${key}: endliche, nicht negative Zahl erforderlich.`);
  }
  if (input.usable > 1) throw new RangeError('usable: Anteil muss zwischen 0 und 1 liegen.');
  if (!Number.isInteger(input.levels)) throw new RangeError('levels: ganze Ebenenzahl erforderlich.');
}

/** Linear year model; energy includes climate/pumps and is treated entirely as electricity. */
export function calculate(input: Input): Result {
  validateInput(input);
  const cultivationArea = input.footprint * input.usable * input.levels;
  const harvest = cultivationArea * input.yieldPerArea;
  const energy = harvest * input.energyPerKg;
  const result = {
    cultivationArea, harvest, energy,
    water: harvest * input.waterPerKg,
    electricityCost: energy * input.electricityPrice,
    electricityPerKg: input.energyPerKg * input.electricityPrice,
    emissions: energy * input.gridFactor,
    emissionsPerKg: input.energyPerKg * input.gridFactor,
  };
  // Per-kg values are the input-derived marginal intensities, also for a zero-area model.
  if (Object.values(result).some((value) => !Number.isFinite(value))) throw new RangeError('Eingabekombination überschreitet den berechenbaren Zahlenbereich.');
  return result;
}

export interface Preset {
  id: string;
  label: string;
  description: string;
  changes: Partial<Input>;
}

export const PRESETS: readonly Preset[] = [
  { id: 'base', label: 'Basisszenario', description: 'Alle acht Eingaben auf die vollständig dokumentierte Basis zurücksetzen.', changes: {} },
  { id: 'levels', label: 'Mehr Anbauebenen', description: 'Nur Ebenen: 4 → 6. Alle übrigen Eingaben entsprechen der Basis.', changes: { levels: 6 } },
  { id: 'price', label: 'Höherer Strompreis', description: 'Nur Strompreis: 0,25 → 0,40 €/kWh. Ernte und Energie bleiben unverändert.', changes: { electricityPrice: 0.4 } },
  { id: 'power', label: 'Anderer Strommix', description: 'Nur Stromfaktor: 0,406 → 0,05 kg CO₂eq/kWh. Explorative Annahme mit Vorketten, kein Stromliefernachweis.', changes: { gridFactor: 0.05 } },
  { id: 'efficiency', label: 'Weniger Energie je kg', description: 'Nur Energiebedarf: 10 → 7 kWh/kg. Unbelegte Verbesserungsannahme zur Sensitivität; keine Ertragsänderung.', changes: { energyPerKg: 7 } },
];

/** A preset always starts from the complete basis, never from a previous scenario. */
export function applyPreset(id: string): Input {
  const preset = PRESETS.find((item) => item.id === id);
  if (!preset) throw new RangeError(`Unbekanntes Szenario: ${id}`);
  return { ...BASE_INPUT, ...preset.changes };
}

export function changedParameters(input: Input): InputKey[] {
  return (Object.keys(BASE_INPUT) as InputKey[]).filter((key) => Math.abs(input[key] - BASE_INPUT[key]) > 1e-10);
}

export type ComparisonMode = 'footprint' | 'harvest';
export interface ComparisonRow {
  system: System;
  label: string;
  footprint: number;
  cultivationArea: number | null;
  harvest: number;
  energy: number | null;
  water: number;
  energyPerKg: number | null;
  waterPerKg: number;
  electricityCost: number | null;
  emissions: number | null;
  sourceIds: string[];
  boundary: string;
  limitations: string;
  referenceYear: string;
  region: string;
}

const evidence = (id: string): number => {
  const datum = evidenceData.find((item) => item.id === id);
  if (!datum) throw new Error(`Fehlender Quellenwert: ${id}`);
  return datum.value;
};

/** Same gross footprint or same annual crop mass; reference intensities are never mixed. */
export function compare(input: Input, mode: ComparisonMode, target: number): ComparisonRow[] {
  validateInput(input);
  if (mode !== 'footprint' && mode !== 'harvest') throw new RangeError('Unbekannte Vergleichsperspektive.');
  if (!Number.isFinite(target) || target < 0) throw new RangeError('Vergleichsziel muss endlich und nicht negativ sein.');

  const verticalYield = input.usable * input.levels * input.yieldPerArea;
  if (mode === 'harvest' && target > 0 && verticalYield === 0) throw new RangeError('Positive Zielernte erfordert einen positiven Flächenertrag.');
  const verticalFootprint = mode === 'footprint' ? target : target === 0 ? 0 : target / verticalYield;
  const vertical = calculate({ ...input, footprint: verticalFootprint });
  const rows: ComparisonRow[] = [{
    system: 'vertical', label: 'Vertical Farm', footprint: verticalFootprint,
    cultivationArea: vertical.cultivationArea, harvest: vertical.harvest, energy: vertical.energy,
    water: vertical.water, energyPerKg: input.energyPerKg, waterPerKg: input.waterPerKg,
    electricityCost: vertical.electricityCost, emissions: vertical.emissions,
    sourceIds: ['scenario', 'pennisi2025', 'uba2026'],
    boundary: 'Eigene Salatannahmen; gesamte angenommene Energie als Strom inklusive Klima/Pumpen. Wasser: Frischwasserzusatz nur für den Anbau.',
    limitations: 'Unabhängige Eingabeannahmen; kein beobachteter oder validierter Betrieb. Salattypen stimmen nicht vollständig mit der NL-Kopfsalatreferenz überein.',
    referenceYear: 'Szenario 2040; Annahmen 2026, Strommix 2025', region: 'Hypothetischer Standort in NRW',
  }];

  for (const system of ['greenhouse', 'field'] as const) {
    const yieldPerFootprint = evidence(system === 'greenhouse' ? 'gh-yield' : 'field-yield');
    const waterPerKg = evidence(system === 'greenhouse' ? 'gh-water' : 'field-water');
    const footprint = mode === 'footprint' ? target : target / yieldPerFootprint;
    const harvest = mode === 'harvest' ? target : footprint * yieldPerFootprint;
    rows.push({
      system, label: system === 'greenhouse' ? 'Gewächshaus' : 'Freiland', footprint,
      cultivationArea: null, harvest, energy: null, water: harvest * waterPerKg,
      energyPerKg: null, waterPerKg, electricityCost: null, emissions: null,
      sourceIds: ['blom2022'],
      boundary: system === 'greenhouse'
        ? 'NL-Kopfsalat: bodengebundenes, erdgasbeheiztes Gewächshaus ohne Zusatzlicht. Ertrag je Bruttogrundfläche; Bewässerungszufuhr.'
        : 'NL-Kopfsalat: drei jährliche Freilandzyklen. Ertrag je Bruttogrundfläche; Bewässerungszufuhr ausdrücklich ohne Regen.',
      limitations: 'Keine harmonisierte Energie-/Klimabilanz mit dem VF-Szenario; deshalb Datenlücken. Netto-Anbaufläche unbekannt; kein weiterer Nutzflächenabzug.',
      referenceYear: system === 'greenhouse' ? 'Datenbasis 2019; Veröffentlichung 2022' : 'Ertrag 1985/2009, Wasser 2014; Veröffentlichung 2022',
      region: 'Niederlande',
    });
  }
  if (rows.some((row) => [row.footprint, row.harvest, row.water].some((value) => !Number.isFinite(value)))) throw new RangeError('Vergleich überschreitet den berechenbaren Zahlenbereich.');
  return rows;
}

/** One-at-a-time sensitivity: every unselected input is held at the current value. */
export function sensitivity(input: Input, key: InputKey, low: number, high: number): { low: Result; current: Result; high: Result } {
  return { low: calculate({ ...input, [key]: low }), current: calculate(input), high: calculate({ ...input, [key]: high }) };
}
