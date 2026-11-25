import { INITIAL_DECISION } from '../components/Brief'
import type { Criterion, CriterionId, DecisionState } from '../components/Brief'
import { amount, number } from './format'
import { applyPreset, BASE_INPUT, calculate } from './model'
import type { Input } from './model'

const hallSizes = { small: 500, medium: 1000, large: 2000 } as const
const powerSizes = { light: 100, medium: 200, strong: 400, high: 1200 } as const
const weeklyOrders = { small: 100, medium: 1000, large: 3000 } as const
const buyers = [
  { id: 'canteens', label: 'Schulmensen und Kantinen' },
  { id: 'shops', label: 'Supermärkte und Läden' },
  { id: 'mixed', label: 'Mehrere Kunden zusammen' },
  { id: 'unknown', label: 'Noch offen' },
] as const

function exampleChoices(values: Record<string, number>, unit: string) {
  return [
    ...Object.entries(values).map(([id, value]) => ({ id, label: amount(value, unit) })),
    { id: 'unknown', label: 'Noch offen' },
  ]
}

const goals = {
  supply: {
    label: 'Verlässliche lokale Versorgung',
    brief: 'Regionale Abnehmer auch außerhalb der Freilandsaison verlässlich mit Blattgemüse versorgen.',
  },
  environment: {
    label: 'Klima und Flächen schonen',
    brief: 'Blattgemüse mit möglichst geringen Umweltwirkungen und geringem Flächenbedarf bereitstellen.',
  },
  learning: {
    label: 'Erst Betriebsdaten gewinnen',
    brief: 'Belastbare Betriebsdaten für eine spätere Förderentscheidung gewinnen.',
  },
} as const

const costLimits = { one: 1, two: 2, three: 3 } as const
const costOptions = [
  ...Object.entries(costLimits).map(([id, limit]) => ({ id, label: `Bis ${limit} €/kg` })),
  { id: 'open', label: 'Keine Grenze ansetzen' },
] as const
const climateOptions = [
  { id: 'both', label: 'Beide Strommixe vergleichen' },
  { id: 'reference', label: 'Deutscher Referenzmix' },
  { id: 'lower', label: 'Emissionsärmerer Strom' },
  { id: 'custom', label: 'Eigener Strommix' },
] as const
const alternativeOptions = [
  { id: 'available', label: 'Ja, das wäre möglich' },
  { id: 'open', label: 'Weiß ich noch nicht' },
  { id: 'unavailable', label: 'Nein, sie reichen dafür nicht aus' },
] as const
const scaleOptions = [
  { id: 'measured', label: 'Ja, der Test lief gut' },
  { id: 'failed', label: 'Nein, es hat nicht geklappt' },
  { id: 'unknown', label: 'Noch offen' },
] as const

export const editableAnswers = {
  building: { values: hallSizes, unit: 'm²', label: 'Eigene Hallengröße', min: 1 },
  power: { values: powerSizes, unit: 'kW', label: 'Eigene Anschlussleistung', min: 1 },
  sales: { values: weeklyOrders, unit: 'kg/Woche', label: 'Eigene Abnahmemenge', min: 0 },
  cost: { values: costLimits, unit: '€/kg', label: 'Eigene Kostengrenze', min: 0 },
} as const
type EditableQuestionId = keyof typeof editableAnswers

export const fundingQuestions = [
  { id: 'goal', topic: 'Ziel der Stadt', statement: 'Was soll Dinslaken mit der Förderung erreichen?', context: 'Entscheidet euch für ein Ziel. Daran könnt ihr später eure Argumente messen.', options: Object.entries(goals).map(([id, goal]) => ({ id, label: goal.label })) },
  { id: 'building', topic: 'Platz für die Farm', statement: 'In welche Halle soll die Farm passen?', context: 'Wählt eine Beispielhalle. Die Anzeige zeigt, ob dort genug Platz für Pflanzen, Gänge und Technik wäre.', options: exampleChoices(hallSizes, 'm²') },
  { id: 'power', topic: 'Strom für Licht und Kühlung', statement: 'Wie viel Leistung kann der Stromanschluss liefern?', context: 'Lampen, Kühlung und Pumpen brauchen Strom. Wählt einen Beispielanschluss. Je höher der Wert in kW, desto mehr Geräte kann er gleichzeitig versorgen.', options: exampleChoices(powerSizes, 'kW') },
  { id: 'demand', topic: 'Kunden für den Salat', statement: 'Wer könnte den Salat aus der Farm kaufen?', context: 'Wähle eine Kundengruppe für dein Beispiel. Im nächsten Schritt probierst du aus, wie viel Salat sie abnehmen könnte.', options: buyers },
  { id: 'sales', topic: 'Salat pro Woche', statement: 'Wie viel Salat könnten deine Kunden pro Woche abnehmen?', context: 'Teste eine Abnahmemenge und vergleiche sie mit der durchschnittlichen Ernte pro Woche.', options: exampleChoices(weeklyOrders, 'kg') },
  { id: 'cost', topic: 'Stromkosten je Kilogramm', statement: 'Wie viel darf der Strom für ein Kilogramm Salat kosten?', context: 'Lege für dein Planspiel eine Kostengrenze fest. Dazu kommen später zum Beispiel noch Personal- und Baukosten.', options: costOptions },
  { id: 'climate', topic: 'CO₂-Beitrag des Stroms', statement: 'Mit welchem Strom soll die Farm laufen?', context: 'Je nachdem, wie der Strom erzeugt wird, entstehen unterschiedlich viele Treibhausgase. Vergleicht die beiden Beispiele, wenn ihr euch unsicher seid.', options: climateOptions },
  { id: 'alternative', topic: 'Gewächshaus und Freiland', statement: 'Könnten Gewächshäuser oder Felder das gleiche Ziel erreichen?', context: 'Denk an das Ziel aus Frage 1. Für die Versorgung kommt es zum Beispiel darauf an, ob genug Salat zur richtigen Jahreszeit verfügbar wäre.', options: alternativeOptions },
  { id: 'scale', topic: 'Ergebnis des Farmtests', statement: 'Hat die Farm im Test gut funktioniert?', context: 'Stellt euch einen Testbetrieb vor. Hat er genug Salat geliefert, die Kostengrenze eingehalten und das Klimaziel erreicht? Wenn ihr dazu keine Annahme habt, wählt „Noch offen“.', options: scaleOptions },
] as const

export type QuestionId = typeof fundingQuestions[number]['id']
type Goal = keyof typeof goals
export type Answers = Partial<{
  goal: Goal
  building: keyof typeof hallSizes | 'unknown' | number
  power: keyof typeof powerSizes | 'unknown' | number
  demand: typeof buyers[number]['id']
  sales: keyof typeof weeklyOrders | 'unknown' | number
  cost: keyof typeof costLimits | 'open' | number
  climate: typeof climateOptions[number]['id']
  alternative: typeof alternativeOptions[number]['id']
  scale: typeof scaleOptions[number]['id']
}>

export const openSiteAnswers: Answers = {
  building: 'unknown', power: 'unknown', demand: 'unknown', sales: 'unknown',
  cost: 'open', climate: 'both', alternative: 'open', scale: 'unknown',
}

export type FundingReview = {
  priorities: CriterionId[]
  priorityReason: string
  peakPower?: number
  climateResult?: 'meets' | 'misses'
  climateEvidence: string
}

export function restoreFundingReview(value: unknown): FundingReview {
  const entry = value && typeof value === 'object' ? value as Partial<FundingReview> : {}
  const priorities = Array.isArray(entry.priorities)
    ? [...new Set(entry.priorities)].filter(id => INITIAL_DECISION.criteria.some(criterion => criterion.id === id)).slice(0, 2)
    : []
  return {
    priorities,
    priorityReason: typeof entry.priorityReason === 'string' ? entry.priorityReason.trim().slice(0, 180) : '',
    peakPower: typeof entry.peakPower === 'number' && entry.peakPower > 0 && entry.peakPower <= Number.MAX_SAFE_INTEGER ? entry.peakPower : undefined,
    climateResult: entry.climateResult === 'meets' || entry.climateResult === 'misses' ? entry.climateResult : undefined,
    climateEvidence: typeof entry.climateEvidence === 'string' ? entry.climateEvidence.trim().slice(0, 100) : '',
  }
}

export function hasFundingPriorities(review: FundingReview) {
  return review.priorities.length === 2 && Boolean(review.priorityReason.trim())
}

const lowerGridFactor = applyPreset('power').gridFactor

function numericAnswer(field: EditableQuestionId, answer: string | number | undefined): number | null {
  if (typeof answer === 'number') return answer
  const values: Record<string, number> = editableAnswers[field].values
  return answer !== undefined && Object.hasOwn(values, answer) ? values[answer] : null
}

export function fundingAnswerLabel(question: typeof fundingQuestions[number], answer: Answers[QuestionId]) {
  if (typeof answer === 'number' && Object.hasOwn(editableAnswers, question.id)) {
    return amount(answer, editableAnswers[question.id as EditableQuestionId].unit, 2)
  }
  return question.options.find(option => option.id === answer)?.label
}

export function siteChecks(answers: Answers, input: Input, peakPower?: number) {
  const { energy, harvest } = calculate(input)
  const hall = numericAnswer('building', answers.building)
  const connection = numericAnswer('power', answers.power)
  const orders = numericAnswer('sales', answers.sales)
  const averagePower = energy / (365 * 24)
  const weeklyHarvest = harvest / 52
  return {
    hall, connection, orders, averagePower, weeklyHarvest,
    hallTooSmall: hall !== null && hall < input.footprint,
    connectionTooWeak: connection !== null && connection < averagePower,
    peakPower: peakPower !== undefined && peakPower >= averagePower ? peakPower : null,
    peakTooHigh: connection !== null && peakPower !== undefined && peakPower >= averagePower && peakPower > connection,
    unsoldPerWeek: orders === null ? null : Math.max(0, weeklyHarvest - orders),
    extraDemandPerWeek: orders === null ? null : Math.max(0, orders - weeklyHarvest),
  }
}

export function fundingChecks(answers: Answers, input: Input) {
  const { electricityPerKg } = calculate(input)
  const limit = numericAnswer('cost', answers.cost)
  const costExceeded = limit !== null && electricityPerKg > limit + 1e-9
  const referenceEmissions = input.energyPerKg * BASE_INPUT.gridFactor
  const lowerEmissions = input.energyPerKg * lowerGridFactor
  const customEmissions = input.energyPerKg * input.gridFactor
  const currency = (value: number) => amount(value, '€/kg', 2)
  const emissions = (value: number) => amount(value, 'kg CO₂eq/kg', 3)
  const costDetail = limit === null
    ? `Stromkosten ${currency(electricityPerKg)} ohne gewählte Prüfgrenze`
    : `Stromkosten ${currency(electricityPerKg)}, Prüfgrenze ${currency(limit)} ${costExceeded ? 'überschritten' : 'eingehalten'}`
  const climateDetail = answers.climate === 'custom'
    ? `Strombeitrag beim gewählten Mix ${emissions(customEmissions)} [M]`
    : answers.climate === 'reference'
    ? `Strombeitrag im Referenzmix ${emissions(referenceEmissions)} [U,M]`
    : answers.climate === 'lower'
      ? `Strombeitrag im emissionsärmeren Szenario ${emissions(lowerEmissions)} [M]`
      : `Strombeitrag ${number(referenceEmissions, 3)} (Referenzmix) und ${emissions(lowerEmissions)} (emissionsärmerer Mix) [U,M]`
  return { electricityPerKg, limit, costExceeded, referenceEmissions, lowerEmissions, lowerGridFactor, customEmissions, costDetail, climateDetail }
}

export function restoreAnswers(value: unknown): Answers {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(fundingQuestions.flatMap(({ id, options }) => {
    const answer: unknown = (value as Record<string, unknown>)[id]
    if (id === 'scale' && answer === 'missing') return [[id, 'unknown']]
    if (options.some(option => answer === option.id)) return [[id, answer]]
    if (typeof answer === 'number' && Number.isFinite(answer) && answer <= Number.MAX_SAFE_INTEGER && Object.hasOwn(editableAnswers, id)
      && answer >= editableAnswers[id as EditableQuestionId].min) return [[id, answer]]
    return []
  }))
}

const options: Record<DecisionState['option'], Pick<DecisionState, 'recommendation' | 'conditions'>> = {
  A: {
    recommendation: 'Nach erfolgreichem Test sollte Dinslaken prüfen, ob es weitere Farmen fördert.',
    conditions: [
      'Vor dem Bau prüft die Stadt Stromanschluss, Gesamtkosten und zugesagte Abnahmemengen.',
      'Die Stadt prüft jährlich Liefermengen, Kosten und Klimabilanz.',
    ],
  },
  B: {
    recommendation: 'Dinslaken sollte eine Farm für begrenzte Zeit testen, wenn Halle, Strom und Abnehmer gesichert sind.',
    conditions: [
      'Vor Förderung werden Gebäude, Netzanschluss und Abnahmemenge belegt.',
      'Nach zwölf Monaten prüft die Stadt Ernte, Gesamtkosten und Klimabilanz und entscheidet, ob der Test weiterläuft.',
    ],
  },
  C: {
    recommendation: 'Dinslaken sollte zuerst prüfen, ob Gewächshäuser oder regionale Felder das Ziel erreichen.',
    conditions: [
      'Die Alternativen werden bei gleicher Liefermenge und Saison verglichen.',
      'Eine Förderung setzt nachgewiesene Abnahme und tragfähige Vollkosten der gewählten Alternative voraus.',
    ],
  },
}

type Reason = { field: QuestionId; text: string }

function recommend(answers: Answers, site: ReturnType<typeof siteChecks>, checks: ReturnType<typeof fundingChecks>, climateResult: FundingReview['climateResult']): { option: DecisionState['option']; explanation: string; expansionGaps: Reason[] } {
  const blockers: Reason[] = []
  if (site.hallTooSmall) blockers.push({ field: 'building', text: 'Die Beispielhalle ist zu klein.' })
  if (site.connectionTooWeak) blockers.push({ field: 'power', text: 'Der Beispielanschluss reicht schon im Durchschnitt nicht aus.' })
  else if (site.peakTooHigh) blockers.push({ field: 'power', text: 'Die angegebene Spitzenlast übersteigt den Beispielanschluss.' })
  if (climateResult === 'misses') blockers.push({ field: 'climate', text: 'Die vergleichbare Klimabilanz verfehlt das gewählte Ziel.' })
  if (checks.costExceeded) blockers.push({ field: 'cost', text: 'Der Strom allein kostet mehr als im Planspiel angesetzt.' })
  if (answers.scale === 'failed') blockers.push({ field: 'scale', text: 'Im angenommenen Test hat die Farm ihre Ziele verfehlt.' })
  const expansionGaps = [...blockers]
  const hasBuyer = answers.demand !== undefined && answers.demand !== 'unknown'
  if (answers.goal === 'learning') expansionGaps.push({ field: 'goal', text: 'Euer Ziel ist, die Farm erst einmal zu testen.' })
  if (site.hall === null) expansionGaps.push({ field: 'building', text: 'Eine passende Halle ist offen.' })
  if (site.connection === null) expansionGaps.push({ field: 'power', text: 'Die Leistung des Stromanschlusses ist offen.' })
  else if (!site.connectionTooWeak && site.peakPower === null) expansionGaps.push({ field: 'power', text: 'Eine plausible Spitzenlast für Licht, Klima und Pumpen fehlt.' })
  if (!climateResult) expansionGaps.push({ field: 'climate', text: 'Eine vergleichbare Klimabilanz mit Prüfziel und Beleg fehlt.' })
  if (!hasBuyer) expansionGaps.push({ field: 'demand', text: 'Es fehlt eine Kundengruppe für den Salat.' })
  if (site.orders === null) expansionGaps.push({ field: 'sales', text: 'Die Abnahmemenge ist offen.' })
  else if (site.unsoldPerWeek && site.unsoldPerWeek > 1e-9) expansionGaps.push({ field: 'sales', text: `Für rund ${number(site.unsoldPerWeek, 2)} kg Salat pro Woche fehlen Kunden.` })
  if (checks.limit === null) expansionGaps.push({ field: 'cost', text: 'Es fehlt eine Grenze für die Stromkosten.' })
  if (answers.alternative === 'available') expansionGaps.push({ field: 'alternative', text: 'Gewächshaus oder Freiland könnten das gleiche Ziel erreichen.' })
  if (answers.alternative === 'open') expansionGaps.push({ field: 'alternative', text: 'Offen ist, ob Gewächshaus oder Freiland das gleiche Ziel erreichen.' })
  if (answers.scale === 'unknown') expansionGaps.push({ field: 'scale', text: 'Es ist offen, ob ein Testbetrieb erfolgreich wäre.' })

  if (blockers.length) return {
    option: 'C',
    explanation: blockers.map(reason => reason.text).join(' '),
    expansionGaps,
  }

  if (!expansionGaps.length) return {
    option: 'A',
    explanation: 'Im Planspiel passen Grundfläche, Spitzenlast und Abnahme. Die angegebene Klimabilanz erreicht das Ziel, der Test gelingt und die Alternativen erreichen das Förderziel nicht. Vor einer Förderung prüft die Stadt jeden Standort.',
    expansionGaps,
  }
  if (site.hall !== null || site.connection !== null || (hasBuyer && site.orders !== null)) return {
    option: 'B',
    explanation: 'Ein befristeter Pilot kommt infrage. Die offenen Nachweise entscheiden, ob die Farm das Förderziel erreicht und ein Ausbau vertretbar ist.',
    expansionGaps,
  }
  return {
    option: 'C',
    explanation: 'Für Halle, Stromanschluss und Abnahme fehlt eine konkrete Annahme. Prüfe zuerst Standorte und andere Bezugsquellen.',
    expansionGaps,
  }
}

function criteriaFor(answers: Answers, site: ReturnType<typeof siteChecks>, checks: ReturnType<typeof fundingChecks>, review: FundingReview, climateResult: FundingReview['climateResult']): Criterion[] {
  const buyersNamed = answers.demand !== 'unknown'
  return [
    { id: 'food', label: 'Ernährungsbeitrag', symbol: buyersNamed && site.orders !== null ? '±' : '?', evidence: 'Blattgemüse ergänzt das Angebot. Liefermengen vor Ort prüfen', source: 'dlr2019' },
    { id: 'environment', label: 'Umwelt', symbol: climateResult === 'misses' ? '−' : climateResult === 'meets' ? '±' : '?', evidence: climateResult ? 'Klimanachweis im Planspiel: ' + review.climateEvidence : 'Strom und Saison prägen die Bilanz. Vollständiger Vergleich offen', source: climateResult ? 'scenario' : 'stanghellini2024' },
    { id: 'economy', label: 'Wirtschaftlichkeit', symbol: checks.costExceeded ? '−' : checks.limit === null ? '?' : '±', evidence: 'Stromkosten lassen sich modellieren. Vollkosten vor Ort prüfen', source: 'scenario' },
    { id: 'society', label: 'Gesellschaft', symbol: buyersNamed ? '±' : '?', evidence: 'Zugang für Kundschaft und Wirkungen auf Betriebe prüfen', source: 'material' },
    { id: 'feasibility', label: 'Umsetzbarkeit', symbol: site.hallTooSmall || site.connectionTooWeak || site.peakTooHigh ? '−' : site.hall !== null && site.connection !== null && site.peakPower !== null ? '±' : '?', evidence: site.peakTooHigh ? 'Die angegebene Spitzenlast übersteigt den Anschluss' : 'Gebäude und Spitzenlast am Standort prüfen', source: 'scenario' },
  ]
}

export function evaluateFunding(answers: Answers, input: Input, review: FundingReview) {
  if (!hasFundingPriorities(review) || fundingQuestions.some(question => answers[question.id] === undefined)) return null
  const goal = goals[answers.goal!]
  const checks = fundingChecks(answers, input)
  const site = siteChecks(answers, input, review.peakPower)
  const climateResult = review.climateEvidence.trim() ? review.climateResult : undefined
  const judgement = recommend(answers, site, checks, climateResult)
  const unknown = fundingQuestions.filter(question => answers[question.id] === 'unknown' || question.id === 'alternative' && answers.alternative === 'open')
  const gaps = unknown.map(question => question.topic)
  const localDetails = [
    site.hall === null ? '' : `Halle ${amount(site.hall, 'm²')}${site.hallTooSmall ? ' (zu klein)' : ''}`,
    site.connection === null ? '' : `Anschluss ${amount(site.connection, 'kW')} (Ø Bedarf ${number(site.averagePower, 1)}${site.peakPower === null ? ', Spitze offen' : ', Spitze ' + amount(site.peakPower, 'kW', 1)})`,
    site.orders === null ? '' : `Mögliche Abnahme ${number(site.orders)} bei Ø ${amount(site.weeklyHarvest, 'kg/Woche')}`,
  ].filter(Boolean)
  const siteBasis = [
    localDetails.length ? localDetails.join(' · ') + ' [M].' : '',
    !localDetails.length ? 'Halle, Stromanschluss und Abnahmemenge sind offen.' : '',
    site.connection === null && localDetails.length ? 'Stromanschluss offen.' : '',
    judgement.option === 'A' ? 'Annahme: erfolgreicher Test, keine gleichwertige Alternative.' : '',
    answers.scale === 'failed' ? 'Im Szenario wurden die Ziele im Test verfehlt.' : '',
  ].filter(Boolean).join(' ')
  const draft: DecisionState = {
    ...structuredClone(INITIAL_DECISION), ...structuredClone(options[judgement.option]),
    option: judgement.option, goal: goal.brief, priorities: [...review.priorities], priorityReason: review.priorityReason.trim(),
    criteria: criteriaFor(answers, site, checks, review, climateResult), siteBasis,
    scenarioBasis: `${checks.costDetail} [M]. ${checks.climateDetail}.`,
    uncertainty: climateResult ? 'Vollkosten und die Nachweise aus dem Planspiel vor Ort prüfen.' : 'Vollkosten, Ökobilanz und die Beispielangaben vor Ort prüfen.',
  }
  return { ...judgement, draft, gaps, checks }
}
