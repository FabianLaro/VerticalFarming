export const number = (value: number, digits = 0) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value)
export const amount = (value: number | null, unit: string, digits = 0) => value === null ? 'Datenlücke' : `${number(value, digits)} ${unit}`
export const percentChange = (value: number, base: number) => base === 0 ? 'keine Basis' : `${value >= base ? '+' : ''}${number((value / base - 1) * 100, 0)} %`
