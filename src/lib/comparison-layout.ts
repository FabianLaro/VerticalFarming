import type { ComparisonRow } from './model'

export interface ComparisonPlot {
  row: ComparisonRow
  side: number
  x: number
  z: number
}

/** One metre in every variant uses the same scene unit and the same projection. */
export function comparisonLayout(rows: ComparisonRow[]) {
  const sides = rows.map(row => Math.sqrt(Math.max(0, row.footprint)))
  const depth = Math.max(...sides, 1)
  const gap = Math.max(depth * .13, 3)
  const width = sides.reduce((sum, side) => sum + side, 0) + gap * Math.max(0, rows.length - 1)
  let left = -width / 2
  const plots: ComparisonPlot[] = rows.map((row, index) => {
    const side = sides[index]
    const plot = { row, side, x: left + side / 2, z: -side / 2 }
    left += side + gap
    return plot
  })
  // A useful round distance in the shared scene units.
  const rawScale = depth / 4
  const magnitude = 10 ** Math.floor(Math.log10(rawScale))
  const scaleMetres = [1, 2, 5, 10].map(value => value * magnitude).find(value => value >= rawScale)!
  return { plots, width: Math.max(width, 1), depth, gap, scaleMetres }
}

/** A round 1/2/5 distance calibrated to the actual projected ground edge. */
export function comparisonScale(pixelsPerMetre: number, maxPixels: number) {
  if (!(pixelsPerMetre > 0) || !(maxPixels > 0) || !Number.isFinite(pixelsPerMetre + maxPixels)) throw new RangeError('Ungültiger Maßstab.')
  const idealMetres = maxPixels / pixelsPerMetre
  const magnitude = 10 ** Math.floor(Math.log10(idealMetres))
  const metres = [1, 2, 5, 10].map(value => value * magnitude).filter(value => value <= idealMetres).at(-1)!
  return { metres, pixels: metres * pixelsPerMetre }
}
