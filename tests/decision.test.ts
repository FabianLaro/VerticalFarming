import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Brief, INITIAL_DECISION, argumentFocus, briefText, countWords } from '../src/components/Brief'
import { BASE_INPUT, calculate } from '../src/lib/model'
import { citationMarker, citeArgument, criterionEvidence, decisionReferences, evidenceWithoutCitation, restoredCriterionSource, selectCriterionSource, splitArgument } from '../src/lib/citations'

describe('Eigene Argumente im Brief', () => {
  it('ordnet Grund und Einwand passend zur Förderentscheidung zu', () => {
    const draft = structuredClone(INITIAL_DECISION)
    draft.pros[0] = 'Mensen könnten im Winter Salat beziehen [D].'
    draft.cons[0] = 'Die Beleuchtung braucht viel Strom [S].'
    assert.equal(argumentFocus(draft).reasonText, draft.pros[0])
    assert.equal(argumentFocus(draft).objectionText, draft.cons[0])
    draft.option = 'C'
    assert.equal(argumentFocus(draft).reasonText, draft.cons[0])
    assert.equal(argumentFocus(draft).objectionText, draft.pros[0])
    assert.match(briefText(draft, BASE_INPUT, calculate(BASE_INPUT)), /Stärkster Einwand Mensen könnten im Winter Salat beziehen/u)
  })

  it('erhält Texteingabe, Satzzeichen und bisherige Mehrfachbelege', () => {
    for (const text of ['Lampenkosten ', 'Lampenkosten.', '', 'Punkt 1\nPunkt 2']) {
      const sources = ['pennisi2025', 'stanghellini2024']
      assert.deepEqual(splitArgument(citeArgument(text, sources)), { text, sources })
    }
  })
})

describe('Quellenwahl im Förderurteil', () => {
  it('wechselt Quelle und Kurzbeleg, ohne den verfassten Aussageinhalt zu ersetzen', () => {
    const original = INITIAL_DECISION.criteria[1]
    const selected = selectCriterionSource(original, 'regional')
    assert.equal(selected.source, 'regional')
    assert.equal(selected.evidence, 'Hoher Strombedarf; Gesamtbilanz bleibt offen.')
    assert.equal(criterionEvidence(selected), 'Hoher Strombedarf; Gesamtbilanz bleibt offen [R].')
    assert.equal(original.source, 'stanghellini2024')
    assert.match(original.evidence, /\[P,S\]/u)
  })

  it('bewahrt benutzerdefinierte Hinweise und ersetzt nur bekannte alte Schlussmarker', () => {
    assert.equal(evidenceWithoutCitation('Mein Beleg [eigene Untersuchung].'), 'Mein Beleg [eigene Untersuchung].')
    assert.equal(evidenceWithoutCitation('Nach [P] bleibt meine eigene Folgerung offen.'), 'Nach [P] bleibt meine eigene Folgerung offen.')
    assert.equal(evidenceWithoutCitation('Zugang offen [A, M4 S.4].'), 'Zugang offen.')
  })

  it('behält eine gespeicherte gültige Quellenwahl und behandelt alte/ungültige Werte', () => {
    const selected = selectCriterionSource(INITIAL_DECISION.criteria[0], 'blom2022')
    const persisted = JSON.parse(JSON.stringify(selected))
    assert.equal(restoredCriterionSource(persisted.source, 'dlr2019'), 'blom2022')
    assert.equal(restoredCriterionSource('unbekannt', 'dlr2019'), 'dlr2019')
    assert.equal(restoredCriterionSource(null, 'scenario'), 'scenario')
    assert.throws(() => selectCriterionSource(selected, 'unbekannt'), RangeError)
    assert.equal(citationMarker('unbekannt'), '[Quelle offen]')
  })

  it('übernimmt die aktuelle Quelle sowohl im Brieftext als auch in der gerenderten Referenzliste', () => {
    const state = structuredClone(INITIAL_DECISION)
    state.criteria[1] = selectCriterionSource(state.criteria[1], 'regional')
    const result = calculate(BASE_INPUT)
    const text = briefText(state, BASE_INPUT, result)
    const markup = renderToStaticMarkup(createElement(Brief, { state, input: BASE_INPUT, result, valid: true }))
    assert.match(text, /Gesamtbilanz bleibt offen \[R\]/u)
    assert.match(markup, /Gesamtbilanz bleibt offen \[R\]/u)
    assert.match(decisionReferences(state), /\[R\] BLE/u)
    assert.match(markup, /\[R\] BLE/u)
  })

  it('entfernt eine abgewählte Quelle aus der Bibliografie, behält sonstige zitierte Quellen', () => {
    const state = structuredClone(INITIAL_DECISION)
    state.criteria[0] = selectCriterionSource(state.criteria[0], 'barbosa2015')
    assert.match(decisionReferences(state), /\[AZ\] Barbosa/u)
    state.criteria[0] = selectCriterionSource(state.criteria[0], 'blom2022')
    const references = decisionReferences(state)
    assert.doesNotMatch(references, /Barbosa/u)
    assert.match(references, /\[B\] Blom/u)
    assert.match(references, /\[D\] DLR/u, 'weiter im Pro-/Contra-Text verwendete Quelle bleibt erhalten')
  })

  it('hält Default und eine zusätzliche Vergleichsquelle unter der 450-Wort-Grenze', () => {
    const state = structuredClone(INITIAL_DECISION)
    const result = calculate(BASE_INPUT)
    assert.ok(countWords(briefText(state, BASE_INPUT, result)) <= 450)
    state.criteria[1] = selectCriterionSource(state.criteria[1], 'blom2022')
    assert.ok(countWords(briefText(state, BASE_INPUT, result)) <= 450)
  })
})
