import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { briefText, countWords, recommendationSentences } from '../src/components/Brief'
import { BASE_INPUT, calculate } from '../src/lib/model'
import { decisionReferences, hasCitation } from '../src/lib/citations'
import { evaluateFunding, fundingChecks, restoreAnswers } from '../src/lib/funding-questionnaire'
import type { Answers } from '../src/lib/funding-questionnaire'

const allVerified: Answers = {
  goal: 'supply', building: 'yes', power: 'yes', demand: 'yes',
  cost: 'three', climate: 'both', alternative: 'unavailable', scale: 'measured',
}
const allUnknown: Answers = {
  goal: 'supply', building: 'unknown', power: 'unknown', demand: 'unknown',
  cost: 'open', climate: 'both', alternative: 'open', scale: 'unknown',
}

describe('Standortfragebogen für die Förderentscheidung', () => {
  it('fragt alte Antworten auf geänderte Fragen erneut ab', () => {
    const restored = restoreAnswers({ ...allVerified, cost: 'yes', climate: 'no', unsupported: 'yes' })
    assert.equal(restored.cost, undefined)
    assert.equal(restored.climate, undefined)
    assert.equal(restored.building, 'yes')
    assert.equal(Object.hasOwn(restored, 'unsupported'), false)
    assert.equal(evaluateFunding(restored, BASE_INPUT), null)
  })

  it('berechnet Stromteilkosten und vergleicht die gewählte Grenze mit dem aktuellen Szenario', () => {
    const baseline = fundingChecks({ cost: 'two' }, BASE_INPUT)
    assert.equal(baseline.electricityPerKg, 2.5)
    assert.equal(baseline.costExceeded, true)
    assert.equal(fundingChecks({ cost: 'three' }, { ...BASE_INPUT, electricityPrice: 0.3 }).costExceeded, false)
    const lowPrice = fundingChecks({ cost: 'two' }, { ...BASE_INPUT, electricityPrice: 0.15 })
    assert.equal(lowPrice.electricityPerKg, 1.5)
    assert.equal(lowPrice.costExceeded, false)
    assert.equal(fundingChecks({ cost: 'open' }, BASE_INPUT).limit, null)
  })

  it('vergleicht beide modellierten Strommixe bei demselben Strombedarf und belegt den Referenzwert', () => {
    const baseline = evaluateFunding(allVerified, BASE_INPUT)!
    assert.ok(Math.abs(baseline.checks.referenceEmissions - 4.06) < 1e-9)
    assert.equal(baseline.checks.lowerEmissions, 0.5)
    assert.match(baseline.draft.scenarioBasis!, /4,06.*0,5.*\[U,M\]/u)
    assert.match(decisionReferences(baseline.draft), /UBA 2026/u)
    const lower = evaluateFunding({ ...allVerified, climate: 'lower' }, { ...BASE_INPUT, energyPerKg: 20 })!
    assert.match(lower.draft.scenarioBasis!, /1 kg CO₂eq\/kg.*\[M\]/u)
    assert.doesNotMatch(decisionReferences(lower.draft), /UBA 2026/u)
    assert.equal(lower.draft.criteria.find(criterion => criterion.id === 'environment')?.symbol, '?')
  })

  it('prüft breiten Ausbau erst mit Standortangaben und Messdaten', () => {
    assert.equal(evaluateFunding(allVerified, BASE_INPUT)?.option, 'A')
    assert.equal(evaluateFunding({ ...allVerified, scale: 'unknown' }, BASE_INPUT)?.option, 'B')
    assert.equal(evaluateFunding({ ...allVerified, goal: 'learning' }, BASE_INPUT)?.option, 'B')
    assert.equal(evaluateFunding({ ...allVerified, alternative: 'available' }, BASE_INPUT)?.option, 'B')
  })

  it('empfiehlt bei Ansatz und offenen Nachweisen einen Pilot, über der Grenze dagegen eine Alternative', () => {
    const answers = { ...allUnknown, building: 'yes' } satisfies Answers
    const pilot = evaluateFunding(answers, BASE_INPUT)!
    assert.equal(pilot.option, 'B')
    assert.match(pilot.draft.siteBasis!, /Netzanschluss und Stromangebot noch nachweisen/u)
    assert.equal(evaluateFunding({ ...answers, cost: 'two' }, BASE_INPUT)?.option, 'C')
    assert.equal(evaluateFunding({ ...answers, cost: 'two' }, { ...BASE_INPUT, electricityPrice: 0.2 })?.option, 'B')
    for (const field of ['building', 'power', 'demand'] as const) {
      assert.equal(evaluateFunding({ ...allVerified, [field]: 'no' }, BASE_INPUT)?.option, 'C')
    }
  })

  it('weist fehlende Vollkosten und Ökobilanz in jedem belegten Brief unter dem Wortlimit aus', () => {
    const result = calculate(BASE_INPUT)
    for (const answers of [allVerified, { ...allUnknown, power: 'yes' }, allUnknown, { ...allVerified, cost: 'two' }] satisfies Answers[]) {
      const { draft } = evaluateFunding(answers, BASE_INPUT)!
      assert.equal(draft.priorities.length, 2)
      assert.equal(draft.criteria.length, 5)
      assert.equal(draft.pros.length + draft.cons.length, 6)
      assert.ok([...draft.pros, ...draft.cons].every(hasCitation))
      assert.equal(recommendationSentences(draft), 3)
      assert.match(draft.uncertainty, /Vollkosten und eine vergleichbare Ökobilanz/u)
      const words = countWords(briefText(draft, BASE_INPUT, result))
      assert.ok(words <= 450, `Option ${draft.option}: ${words} Wörter`)
    }
  })
})
