import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { briefText, countWords, recommendationSentences } from '../src/components/Brief'
import { BASE_INPUT, calculate } from '../src/lib/model'
import { decisionReferences, hasCitation } from '../src/lib/citations'
import { evaluateFunding, fundingChecks, restoreAnswers, restoreFundingReview, siteChecks } from '../src/lib/funding-questionnaire'
import type { Answers, FundingReview } from '../src/lib/funding-questionnaire'

const allVerified: Answers = {
  goal: 'supply', building: 'medium', power: 'medium', demand: 'canteens', sales: 'large',
  cost: 'three', climate: 'both', alternative: 'unavailable', scale: 'measured',
}
const allUnknown: Answers = {
  goal: 'supply', building: 'unknown', power: 'unknown', demand: 'unknown', sales: 'unknown',
  cost: 'open', climate: 'both', alternative: 'open', scale: 'unknown',
}

const priorities: FundingReview = {
  priorities: ['food', 'society'], priorityReason: 'Mensen brauchen planbare Liefermengen.', climateEvidence: '',
}
const verified: FundingReview = {
  ...priorities, peakPower: 195, climateResult: 'meets', climateEvidence: '0,9 kg CO₂eq/kg unter 1; Planspielbilanz für Winterlieferung.',
}

const assess = (answers: Answers, input = BASE_INPUT, review = priorities) => evaluateFunding(answers, input, review)

describe('Standortfragebogen für die Förderentscheidung', () => {
  it('fragt alte Antworten auf geänderte Fragen erneut ab', () => {
    const restored = restoreAnswers({ ...allVerified, building: 'yes', power: 'yes', demand: 'no', cost: 'yes', climate: 'no', unsupported: 'yes' })
    assert.equal(restored.cost, undefined)
    assert.equal(restored.climate, undefined)
    assert.equal(restored.building, undefined)
    assert.equal(restored.power, undefined)
    assert.equal(restored.demand, undefined)
    assert.equal(Object.hasOwn(restored, 'unsupported'), false)
    assert.equal(assess(restored), null)
  })

  it('vergleicht Beispielhalle, Stromanschluss und Wochenabnahme mit dem Farmmodell', () => {
    const fitting = siteChecks(allVerified, BASE_INPUT)
    assert.equal(fitting.hallTooSmall, false)
    assert.equal(fitting.connectionTooWeak, false)
    assert.equal(fitting.weeklyHarvest, 3000)
    assert.equal(fitting.unsoldPerWeek, 0)
    assert.ok(Math.abs(fitting.averagePower - 178.0822) < 0.001)
    const smaller = siteChecks({ ...allVerified, building: 'small', power: 'light', sales: 'medium' }, BASE_INPUT)
    assert.equal(smaller.hallTooSmall, true)
    assert.equal(smaller.connectionTooWeak, true)
    assert.equal(smaller.unsoldPerWeek, 2000)
    assert.equal(siteChecks(allVerified, { ...BASE_INPUT, footprint: 500 }).extraDemandPerWeek, 1500)
    assert.equal(siteChecks(allUnknown, BASE_INPUT).unsoldPerWeek, null)
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
    const baseline = assess(allVerified)!
    assert.ok(Math.abs(baseline.checks.referenceEmissions - 4.06) < 1e-9)
    assert.equal(baseline.checks.lowerEmissions, 0.5)
    assert.match(baseline.draft.scenarioBasis!, /4,06.*0,5.*\[U,M\]/u)
    assert.match(decisionReferences(baseline.draft), /UBA 2026/u)
    const lower = assess({ ...allVerified, climate: 'lower' }, { ...BASE_INPUT, energyPerKg: 20 })!
    assert.match(lower.draft.scenarioBasis!, /1 kg CO₂eq\/kg.*\[M\]/u)
    assert.doesNotMatch(decisionReferences(lower.draft), /UBA 2026/u)
    assert.equal(lower.draft.criteria.find(criterion => criterion.id === 'environment')?.symbol, '?')
  })

  it('prüft breiten Ausbau erst mit Standortangaben und Messdaten', () => {
    assert.equal(assess(allVerified, BASE_INPUT, verified)?.option, 'A')
    const openTest = assess({ ...allVerified, scale: 'unknown' }, BASE_INPUT, verified)!
    assert.equal(openTest.option, 'B')
    assert.deepEqual(openTest.expansionGaps.map(gap => gap.field), ['scale'])
    assert.equal(assess({ ...allVerified, scale: 'failed' }, BASE_INPUT, verified)?.option, 'C')
    assert.equal(assess({ ...allVerified, goal: 'learning' }, BASE_INPUT, verified)?.option, 'B')
    assert.equal(assess({ ...allVerified, alternative: 'available' }, BASE_INPUT, verified)?.option, 'B')
  })

  it('verlangt zwei eigene Prioritäten und übernimmt ihre Begründung in den Brief', () => {
    assert.equal(evaluateFunding(allVerified, BASE_INPUT, restoreFundingReview(undefined)), null)
    assert.equal(assess(allVerified, BASE_INPUT, { ...priorities, priorityReason: '  ' }), null)
    const review = restoreFundingReview({ priorities: ['environment', 'environment', 'economy', 'bad'], priorityReason: 'Öffentliche Mittel und Klimabilanz prüfen.' })
    const { draft } = assess(allVerified, BASE_INPUT, review)!
    assert.deepEqual(draft.priorities, ['environment', 'economy'])
    assert.equal(draft.priorityReason, review.priorityReason)
  })

  it('unterscheidet Stromteilbilanz und Klimanachweis sowie Durchschnitt und Spitzenlast', () => {
    const answers = { ...allVerified, goal: 'environment', power: 180, climate: 'custom' } satisfies Answers
    for (const gridFactor of [0.05, 0.406, 1]) {
      const outcome = assess(answers, { ...BASE_INPUT, gridFactor })!
      assert.equal(outcome.option, 'B')
      assert.deepEqual(outcome.expansionGaps.map(gap => gap.field), ['power', 'climate'])
      assert.equal(outcome.draft.criteria[1].symbol, '?')
    }
    assert.equal(assess(answers, BASE_INPUT, { ...verified, peakPower: 175 })?.option, 'B')
    assert.equal(assess(answers, BASE_INPUT, verified)?.option, 'C')
    assert.equal(assess(allVerified, BASE_INPUT, { ...verified, climateEvidence: ' ' })?.option, 'B')
    assert.equal(assess(allVerified, BASE_INPUT, { ...verified, climateResult: 'misses' })?.option, 'C')
  })

  it('erreicht A auch mit eigener Abnahme und stärkerem Anschluss für eine größere Farm', () => {
    const input = { ...BASE_INPUT, footprint: 2000, levels: 6, electricityPrice: 0.2, gridFactor: 0.125 }
    const answers = restoreAnswers({ ...allVerified, building: 2100, power: 'high', sales: 9000, cost: 2.25, climate: 'custom' })
    assert.deepEqual(restoreAnswers({ building: 0, power: -1, sales: 0, cost: 0, goal: 1, scale: 'missing' }), { sales: 0, cost: 0, scale: 'unknown' })
    const site = siteChecks(answers, input)
    assert.equal(site.weeklyHarvest, 9000)
    assert.equal(site.connection, 1200)
    assert.ok(site.averagePower > 400 && site.averagePower < 1200)
    const review = { ...verified, peakPower: 700 }
    const result = assess(answers, input, review)!
    assert.equal(result.option, 'A')
    assert.match(result.draft.scenarioBasis!, /2,25 €\/kg eingehalten.*1,25 kg CO₂eq\/kg.*\[M\]/u)
    assert.equal(assess({ ...answers, power: 'strong' }, input, review)?.option, 'C')
    assert.equal(assess({ ...answers, power: 750 }, input, review)?.option, 'A')
  })

  it('empfiehlt bei Ansatz und offenen Nachweisen einen Pilot, über der Grenze dagegen eine Alternative', () => {
    const answers = { ...allUnknown, building: 'medium' } satisfies Answers
    const pilot = assess(answers)!
    assert.equal(pilot.option, 'B')
    assert.match(pilot.draft.siteBasis!, /Stromanschluss offen/u)
    assert.equal(assess({ ...answers, cost: 'two' })?.option, 'C')
    assert.equal(assess({ ...answers, cost: 'two' }, { ...BASE_INPUT, electricityPrice: 0.2 })?.option, 'B')
    assert.equal(assess({ ...allVerified, building: 'small' })?.option, 'C')
    assert.equal(assess({ ...allVerified, power: 'light' })?.option, 'C')
    assert.equal(assess({ ...allVerified, sales: 'medium' })?.option, 'B')
  })

  it('weist fehlende Vollkosten und Ökobilanz in jedem belegten Brief unter dem Wortlimit aus', () => {
    const result = calculate(BASE_INPUT)
    for (const answers of [allVerified, { ...allUnknown, power: 'medium' }, allUnknown, { ...allVerified, cost: 'two' }] satisfies Answers[]) {
      const { draft } = assess(answers, BASE_INPUT, answers === allVerified ? verified : priorities)!
      assert.equal(draft.priorities.length, 2)
      assert.equal(draft.criteria.length, 5)
      assert.equal(draft.pros.length + draft.cons.length, 6)
      assert.ok([...draft.pros, ...draft.cons].every(hasCitation))
      assert.equal(recommendationSentences(draft), 3)
      assert.match(draft.uncertainty, /Vollkosten.*vor Ort prüfen/u)
      const words = countWords(briefText(draft, BASE_INPUT, result))
      assert.ok(words <= 450, `Option ${draft.option}: ${words} Wörter`)
    }
  })
})
