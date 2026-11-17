import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  BASE_INPUT, PARAMS, PRESETS, applyPreset, calculate, changedParameters, compare, sensitivity,
} from '../src/lib/model'
import type { ComparisonMode, Input, InputKey } from '../src/lib/model'

function close(actual: number, expected: number, label: string, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${label}: ${actual} statt ${expected}`)
}

describe('Jahresmodell: unabhängig nachrechenbare Größen und Einheiten', () => {
  it('rechnet ein kleines Beispiel mit 200 m², 50 % und drei Ebenen vollständig', () => {
    // 100 m² je Ebene, zusammen 300 m², je 20 kg im ganzen Jahr.
    const input: Input = {
      footprint: 200, usable: 0.5, levels: 3, yieldPerArea: 20,
      energyPerKg: 5, electricityPrice: 0.2, gridFactor: 0.4, waterPerKg: 4,
    }
    const result = calculate(input)
    assert.deepEqual(result, {
      cultivationArea: 300, harvest: 6000, energy: 30000, water: 24000,
      electricityCost: 6000, electricityPerKg: 1, emissions: 12000, emissionsPerKg: 2,
    })
    assert.equal(result.water / 1000, 24, '24.000 Liter sind 24 m³')
    assert.equal(result.energy / 1000, 30, '30.000 kWh sind 30 MWh')
    assert.equal(result.emissions / 1000, 12, '12.000 kg CO₂eq sind 12 t')
    assert.equal(result.harvest / 1000, 6, '6.000 kg Frischmasse sind 6 t')
  })

  it('liefert für die dokumentierte Basis 156 t Ernte, 390.000 € Teilkosten und 633,36 t Strombeitrag', () => {
    const result = calculate({ ...BASE_INPUT })
    assert.equal(result.cultivationArea, 2600)
    assert.equal(result.harvest, 156000)
    assert.equal(result.energy, 1560000)
    assert.equal(result.water / 1000, 1092)
    assert.equal(result.electricityCost, 390000)
    assert.equal(result.electricityPerKg, 2.5)
    close(result.emissions / 1000, 633.36, 'Tonnen CO₂eq')
    close(result.emissionsPerKg, 4.06, 'kg CO₂eq je kg')
  })

  it('berücksichtigt Klima und Pumpen nicht nochmals als Zuschlag', () => {
    const result = calculate({ ...BASE_INPUT, energyPerKg: 2 })
    assert.equal(result.energy, 312000)
    assert.equal(result.electricityPerKg, 0.5)
  })
})

describe('Kausale Trennung der Stellgrößen', () => {
  it('ändert durch einen höheren Strompreis ausschließlich die Stromteilkosten', () => {
    const before = calculate({ ...BASE_INPUT })
    const after = calculate({ ...BASE_INPUT, electricityPrice: 0.4 })
    assert.equal(after.electricityCost, 624000)
    assert.equal(after.electricityPerKg, 4)
    const { electricityCost: _beforeCost, electricityPerKg: _beforeIntensity, ...unchangedBefore } = before
    const { electricityCost: _afterCost, electricityPerKg: _afterIntensity, ...unchangedAfter } = after
    assert.deepEqual(unchangedAfter, unchangedBefore)
  })

  it('ändert durch den Stromfaktor weder Pflanzenproduktion noch Strombedarf oder Kosten', () => {
    const before = calculate({ ...BASE_INPUT })
    const after = calculate({ ...BASE_INPUT, gridFactor: 0.05 })
    assert.equal(after.emissions, 78000)
    assert.equal(after.emissionsPerKg, 0.5)
    const { emissions: _beforeEmissions, emissionsPerKg: _beforeIntensity, ...unchangedBefore } = before
    const { emissions: _afterEmissions, emissionsPerKg: _afterIntensity, ...unchangedAfter } = after
    assert.deepEqual(unchangedAfter, unchangedBefore)
  })

  it('erhöht bei sechs statt vier Ebenen Gesamtmengen um 50 %, ohne Intensitäten zu verbessern', () => {
    const before = calculate({ ...BASE_INPUT })
    const after = calculate({ ...BASE_INPUT, levels: 6 })
    assert.equal(after.cultivationArea, 3900)
    assert.equal(after.harvest, 234000)
    assert.equal(after.energy, 2340000)
    assert.equal(after.water, 1638000)
    assert.equal(after.electricityCost, 585000)
    close(after.emissions, before.emissions * 1.5, 'Gesamtstrombeitrag')
    assert.equal(after.energy / after.harvest, before.energy / before.harvest)
    assert.equal(after.electricityPerKg, before.electricityPerKg)
    assert.equal(after.emissionsPerKg, before.emissionsPerKg)
  })

  it('reduziert bei geringerem Energiebedarf Kosten und Strombeitrag, aber nicht Ernte und Wasser', () => {
    const before = calculate({ ...BASE_INPUT })
    const after = calculate({ ...BASE_INPUT, energyPerKg: 7 })
    assert.equal(after.harvest, before.harvest)
    assert.equal(after.water, before.water)
    assert.equal(after.energy, 1092000)
    assert.equal(after.electricityCost, 273000)
    close(after.emissions, 443352, 'Strombeitrag')
  })
})

describe('Reproduzierbare Szenarien und Sensitivität', () => {
  it('stellt jedes Szenario aus der vollständigen Basis her, unabhängig von vorherigen Änderungen', () => {
    const first = applyPreset('levels')
    first.gridFactor = 1
    first.electricityPrice = 0.8
    first.waterPerKg = 30
    const price = applyPreset('price')
    assert.deepEqual(price, { ...BASE_INPUT, electricityPrice: 0.4 })
    assert.deepEqual(applyPreset('base'), BASE_INPUT)
    assert.deepEqual(applyPreset('levels'), { ...BASE_INPUT, levels: 6 })
    assert.deepEqual(applyPreset('power'), { ...BASE_INPUT, gridFactor: 0.05 })
    assert.deepEqual(applyPreset('efficiency'), { ...BASE_INPUT, energyPerKg: 7 })
    assert.notEqual(applyPreset('base'), applyPreset('base'), 'Jeder Aufruf liefert eine eigene Eingabekopie')
    assert.equal(BASE_INPUT.waterPerKg, 7, 'Die Basis bleibt unverändert')
    assert.equal(new Set(PRESETS.map(preset => preset.id)).size, PRESETS.length)
    assert.throws(() => applyPreset('unbekannt'), RangeError)
  })

  it('meldet alle und nur tatsächlich abweichenden Eingaben', () => {
    assert.deepEqual(changedParameters({ ...BASE_INPUT }), [])
    assert.deepEqual(changedParameters(applyPreset('levels')), ['levels'])
    const keys = changedParameters({ ...BASE_INPUT, footprint: 500, electricityPrice: 0.4 })
    assert.deepEqual(new Set(keys), new Set(['footprint', 'electricityPrice']))
    assert.deepEqual(changedParameters({ ...BASE_INPUT, gridFactor: BASE_INPUT.gridFactor + 1e-12 }), [])
  })

  it('hält bei der Ein-Faktor-Sensitivität alle anderen aktuellen Werte konstant', () => {
    const custom: Input = { ...BASE_INPUT, footprint: 200, usable: 0.5, levels: 3, yieldPerArea: 20, electricityPrice: 0.4 }
    const original = structuredClone(custom)
    const values = sensitivity(custom, 'energyPerKg', 5, 15)
    assert.equal(values.low.harvest, 6000)
    assert.equal(values.current.harvest, 6000)
    assert.equal(values.high.harvest, 6000)
    assert.equal(values.low.energy, 30000)
    assert.equal(values.current.energy, 60000)
    assert.equal(values.high.energy, 90000)
    assert.equal(values.low.electricityCost, 12000)
    assert.equal(values.high.electricityCost, 36000)
    assert.deepEqual(custom, original, 'Sensitivität verändert die aktuelle Eingabe nicht')
  })
})

describe('Vergleich auf gleicher Grundfläche oder gleicher Jahresernte', () => {
  it('verwendet bei 1.000 m² die NL-Bruttoerträge ohne weiteren Nutzflächenabzug', () => {
    const rows = compare({ ...BASE_INPUT }, 'footprint', 1000)
    assert.deepEqual(rows.map(row => row.footprint), [1000, 1000, 1000])
    assert.deepEqual(rows.map(row => row.harvest), [156000, 29050, 8900])
    assert.deepEqual(rows.map(row => row.cultivationArea), [2600, null, null])
    assert.deepEqual(rows.map(row => row.water), [1092000, 551950, 134390])
    assert.equal(rows[1].water / rows[1].harvest, 19)
    assert.equal(rows[2].water / rows[2].harvest, 15.1)
  })

  it('ändert die Referenzernten nicht durch Änderung des VF-Nutzanteils', () => {
    const rows = compare({ ...BASE_INPUT, usable: 0.1 }, 'footprint', 1000)
    assert.equal(rows[0].harvest, 24000)
    assert.equal(rows[1].harvest, 29050)
    assert.equal(rows[2].harvest, 8900)
  })

  it('hält 29.050 kg/a in allen drei Systemen gleich und berechnet die dafür erforderlichen Flächen', () => {
    const rows = compare({ ...BASE_INPUT }, 'harvest', 29050)
    rows.forEach(row => close(row.harvest, 29050, `${row.label} Zielernte`))
    close(rows[0].footprint, 186.21794871794873, 'VF-Grundfläche')
    assert.equal(rows[1].footprint, 1000, '29,05 kg/m² ergeben für 29.050 kg genau 1.000 m²')
    close(rows[2].footprint, 3264.0449438202247, 'Freilandfläche')
    assert.equal(rows[1].water, 551950)
    assert.equal(rows[2].water, 438655)
    close(rows[0].energy!, 290500, 'VF-Energie für Zielernte')
  })

  it('macht Energie-, Kosten- und Klima-Datenlücken der Referenzen nicht zu Nullwerten', () => {
    for (const mode of ['footprint', 'harvest'] as const) {
      const rows = compare({ ...BASE_INPUT }, mode, 1000)
      for (const reference of rows.slice(1)) {
        assert.equal(reference.energy, null)
        assert.equal(reference.energyPerKg, null)
        assert.equal(reference.electricityCost, null)
        assert.equal(reference.emissions, null)
        assert.deepEqual(reference.sourceIds, ['blom2022'])
      }
      assert.notEqual(rows[0].energy, null)
    }
  })

  it('liefert bei Rückwechsel der Perspektive dieselben Ressourcenintensitäten', () => {
    const byFootprint = compare({ ...BASE_INPUT }, 'footprint', 1000)
    const byHarvest = compare({ ...BASE_INPUT }, 'harvest', 156000)
    for (let index = 0; index < 3; index++) {
      assert.equal(byFootprint[index].waterPerKg, byHarvest[index].waterPerKg)
      assert.equal(byFootprint[index].energyPerKg, byHarvest[index].energyPerKg)
      assert.deepEqual(byFootprint[index].sourceIds, byHarvest[index].sourceIds)
      close(byHarvest[index].harvest / byHarvest[index].footprint, byFootprint[index].harvest / byFootprint[index].footprint, 'Ertrag je Grundfläche')
    }
  })
})

describe('Nullfälle, UI-Grenzen und ungültige Eingaben', () => {
  it('gibt bei Nullfläche keine Jahresmengen und keine NaN-Werte aus', () => {
    const result = calculate({ ...BASE_INPUT, footprint: 0 })
    assert.equal(result.cultivationArea, 0)
    assert.equal(result.harvest, 0)
    assert.equal(result.energy, 0)
    assert.equal(result.water, 0)
    assert.equal(result.electricityCost, 0)
    assert.equal(result.emissions, 0)
    assert.equal(result.electricityPerKg, 2.5, 'Pro-kg-Feld bezeichnet auch ohne Produktion die gewählte marginale Intensität')
    close(result.emissionsPerKg, 4.06, 'Gewählte Stromintensität')
    assert.ok(Object.values(result).every(Number.isFinite))
  })

  it('erlaubt physikalische Nullfaktoren ohne Division durch Null', () => {
    const result = calculate({ ...BASE_INPUT, energyPerKg: 0, waterPerKg: 0, electricityPrice: 0, gridFactor: 0 })
    assert.equal(result.harvest, 156000)
    for (const key of ['energy', 'water', 'electricityCost', 'electricityPerKg', 'emissions', 'emissionsPerKg'] as const) assert.equal(result[key], 0)
    assert.equal(calculate({ ...BASE_INPUT, levels: 0 }).harvest, 0)
    assert.equal(calculate({ ...BASE_INPUT, usable: 0 }).harvest, 0)
    assert.equal(calculate({ ...BASE_INPUT, yieldPerArea: 0 }).harvest, 0)
  })

  it('berechnet alle zulässigen UI-Minima und -Maxima endlich', () => {
    for (const boundary of ['min', 'max'] as const) {
      const input = Object.fromEntries(PARAMS.map(parameter => [parameter.key, parameter[boundary]])) as Input
      const result = calculate(input)
      assert.ok(Object.values(result).every(value => Number.isFinite(value) && value >= 0))
      for (const mode of ['footprint', 'harvest'] as const) assert.ok(compare(input, mode, boundary === 'min' ? 100 : 3000).every(row => Number.isFinite(row.footprint)))
    }
  })

  it('weist für jede Eingabe negative und nicht endliche Werte zurück', () => {
    for (const key of Object.keys(BASE_INPUT) as InputKey[]) {
      for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
        assert.throws(() => calculate({ ...BASE_INPUT, [key]: value }), RangeError, `${key}=${value}`)
      }
    }
    assert.throws(() => calculate({ ...BASE_INPUT, usable: 1.01 }), RangeError)
    assert.throws(() => calculate({ ...BASE_INPUT, levels: 2.5 }), RangeError)
    assert.throws(() => calculate({ ...BASE_INPUT, footprint: Number.MAX_VALUE }), RangeError)
  })

  it('behandelt Vergleichsziel Null und unmögliche positive Zielernte eindeutig', () => {
    for (const mode of ['footprint', 'harvest'] as const) {
      const rows = compare({ ...BASE_INPUT, levels: 0 }, mode, 0)
      rows.forEach(row => {
        assert.equal(row.footprint, 0)
        assert.equal(row.harvest, 0)
        assert.equal(row.water, 0)
      })
      for (const target of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_VALUE]) assert.throws(() => compare({ ...BASE_INPUT }, mode, target), RangeError)
    }
    assert.throws(() => compare({ ...BASE_INPUT, levels: 0 }, 'harvest', 1000), RangeError)
    assert.throws(() => compare({ ...BASE_INPUT, usable: 0 }, 'harvest', 1000), RangeError)
    assert.throws(() => compare({ ...BASE_INPUT, yieldPerArea: 0 }, 'harvest', 1000), RangeError)
    assert.throws(() => compare({ ...BASE_INPUT }, 'unbekannt' as ComparisonMode, 1000), RangeError)
  })
})
