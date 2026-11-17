import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { BASE_INPUT, calculate, compare } from '../src/lib/model'
import { comparisonLayout, comparisonScale } from '../src/lib/comparison-layout'

describe('Gemeinsamer Flächenmaßstab der Vergleichsgrafik', () => {
  it('zeigt bei gleicher Grundfläche drei gleich große Parzellen', () => {
    const { plots } = comparisonLayout(compare(BASE_INPUT, 'footprint', 1000))
    plots.forEach(plot => assert.ok(Math.abs(plot.side ** 2 - 1000) < 1e-8))
    assert.equal(new Set(plots.map(plot => plot.side)).size, 1)
  })

  it('rekonstruiert Flächen für 156 t unabhängig aus den Referenzerträgen', () => {
    const { plots } = comparisonLayout(compare(BASE_INPUT, 'harvest', 156000))
    const expected = [1000, 156000 / 29.05, 156000 / 8.9]
    plots.forEach((plot, index) => assert.ok(Math.abs(plot.side ** 2 - expected[index]) < 1e-8))
    assert.ok(plots[2].side / plots[0].side > 4)
    // A shared front edge and non-overlapping plots retain the common scale.
    plots.forEach(plot => assert.equal(plot.z + plot.side / 2, 0))
    for (let i = 1; i < plots.length; i++) assert.ok(plots[i].x - plots[i].side / 2 > plots[i - 1].x + plots[i - 1].side / 2)
  })

  it('passt die Grafik an sechs Ebenen und 234 t an, ohne Referenzerträge zu verändern', () => {
    const input = { ...BASE_INPUT, levels: 6 }
    const { plots } = comparisonLayout(compare(input, 'harvest', calculate(input).harvest))
    assert.ok(Math.abs(plots[0].side ** 2 - 1000) < 1e-8)
    assert.ok(Math.abs(plots[1].side ** 2 - 234000 / 29.05) < 1e-8)
    assert.ok(Math.abs(plots[2].side ** 2 - 234000 / 8.9) < 1e-8)
  })

  it('hält Nullflächen und minimale/maximale UI-Szenarien endlich', () => {
    for (const rows of [compare(BASE_INPUT, 'harvest', 0), compare({ ...BASE_INPUT, footprint: 100, levels: 1 }, 'footprint', 100), compare({ ...BASE_INPUT, footprint: 3000, levels: 10 }, 'harvest', calculate({ ...BASE_INPUT, footprint: 3000, levels: 10 }).harvest)]) {
      const layout = comparisonLayout(rows)
      assert.ok(layout.width > 0 && layout.depth > 0 && layout.scaleMetres > 0)
      layout.plots.forEach(plot => [plot.x, plot.z, plot.side].forEach(value => assert.ok(Number.isFinite(value))))
    }
  })
})

describe('Kalibrierter Maßstabsbalken', () => {
  it('bildet 10 Meter bei 8 Pixeln pro Meter als 80 Pixel ab', () => {
    assert.deepEqual(comparisonScale(8, 100), { metres: 10, pixels: 80 })
  })
  it('bleibt bei kleinen und großen Ansichten rund und innerhalb der verfügbaren Breite', () => {
    for (const projection of [.2, .8, 2.7, 6.1, 17, 40]) {
      const result = comparisonScale(projection, 80)
      assert.equal(result.pixels, result.metres * projection)
      assert.ok(result.pixels > 30 && result.pixels <= 80)
    }
  })
  it('weist ungültige Projektions- und Breitenwerte zurück', () => {
    for (const value of [0, -1, NaN, Infinity]) assert.throws(() => comparisonScale(value, 100), RangeError)
    assert.throws(() => comparisonScale(2, 0), RangeError)
  })
})
