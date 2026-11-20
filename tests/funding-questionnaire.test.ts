import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { briefText, countWords, recommendationSentences } from '../src/components/Brief'
import { BASE_INPUT, calculate } from '../src/lib/model'
import { decisionReferences, hasCitation } from '../src/lib/citations'
import { evaluateFunding, fundingQuestions, restoreAnswers } from '../src/lib/funding-questionnaire'
import type { Answers } from '../src/lib/funding-questionnaire'

const allVerified: Answers = {
  goal: 'supply', building: 'yes', power: 'yes', demand: 'yes',
  cost: 'yes', climate: 'yes', alternative: 'no', scale: 'yes',
}
const allUnknown = restoreAnswers(Object.fromEntries(fundingQuestions.map(({ id }) => [id, id === 'goal' ? 'supply' : 'unknown'])))

describe('Standortfragebogen für die Förderentscheidung', () => {
  it('wertet erst vollständige gültige Antworten aus', () => {
    const restored = restoreAnswers({ ...allVerified, building: 'neutral', unsupported: 'yes' })
    assert.equal(restored.building, undefined)
    assert.equal(Object.hasOwn(restored, 'unsupported'), false)
    assert.equal(evaluateFunding(restored), null)
  })

  it('empfiehlt A nur mit positiven Nachweisen und ohne nachweislich bessere Alternative', () => {
    assert.equal(evaluateFunding(allVerified)?.option, 'A')
    for (const field of ['building', 'power', 'demand', 'cost', 'climate', 'scale', 'alternative'] as const) {
      assert.notEqual(evaluateFunding({ ...allVerified, [field]: 'unknown' })?.option, 'A', field)
    }
  })

  it('empfiehlt bei einem erkennbarem Ansatz und offenen Nachweisen B mit prüfbaren Auflagen', () => {
    const outcome = evaluateFunding({ ...allUnknown, building: 'yes' })
    assert.equal(outcome?.option, 'B')
    assert.match(outcome?.draft.siteBasis ?? '', /Netzanschluss und Stromangebot noch nachweisen/u)
    assert.match(outcome?.draft.conditions[1] ?? '', /zwölf Monaten/u)
    assert.equal(evaluateFunding({ ...allVerified, goal: 'learning' })?.option, 'B')
  })

  it('gibt besseren Alternativen, fehlenden Grundvoraussetzungen und negativen Vollkosten Vorrang', () => {
    for (const override of [{ alternative: 'yes' }, { building: 'no' }, { power: 'no' }, { demand: 'no' }, { cost: 'no' }, { goal: 'environment', climate: 'no' }] satisfies Answers[]) {
      assert.equal(evaluateFunding({ ...allVerified, ...override })?.option, 'C')
    }
  })

  it('hält unbekannte Angaben ausdrücklich offen und behauptet keinen Nachweis für die Stadt', () => {
    const outcome = evaluateFunding(allUnknown)
    assert.equal(outcome?.option, 'C')
    assert.equal(outcome?.gaps.length, 7)
    assert.match(outcome?.draft.uncertainty ?? '', /Offen bleiben/u)
    assert.match(outcome?.draft.siteBasis ?? '', /Halle und Betreiber offen/u)
  })

  it('erstellt für jedes Ergebnis einen vollständigen, belegten Brief im Wortlimit', () => {
    const result = calculate(BASE_INPUT)
    for (const answers of [allVerified, { ...allUnknown, power: 'yes' }, allUnknown] satisfies Answers[]) {
      const { draft } = evaluateFunding(answers)!
      assert.equal(draft.priorities.length, 2)
      assert.equal(draft.criteria.length, 5)
      assert.equal(draft.pros.length + draft.cons.length, 6)
      assert.ok([...draft.pros, ...draft.cons].every(hasCitation))
      assert.equal(recommendationSentences(draft), 3)
      const words = countWords(briefText(draft, BASE_INPUT, result))
      assert.ok(words <= 450, `Option ${draft.option}: ${words} Wörter`)
      assert.match(decisionReferences(draft), /10\.1016\/j\.jclepro\.2022\.134443/u)
    }
  })
})
