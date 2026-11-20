import { INITIAL_DECISION } from '../components/Brief'
import type { Criterion, DecisionState } from '../components/Brief'
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
    priorities: ['food', 'society'],
    reason: 'Entscheidend sind verfügbare Mengen und bezahlbarer Zugang für lokale Abnehmer.',
  },
  environment: {
    label: 'Klima und Flächen schonen',
    brief: 'Blattgemüse mit möglichst geringen Umweltwirkungen und geringem Flächenbedarf bereitstellen.',
    priorities: ['environment', 'economy'],
    reason: 'Ökobilanz und Vollkosten zeigen den Nutzen pro eingesetztem Euro.',
  },
  learning: {
    label: 'Erst Betriebsdaten gewinnen',
    brief: 'Belastbare Betriebsdaten für eine spätere Förderentscheidung gewinnen.',
    priorities: ['feasibility', 'economy'],
    reason: 'Die Erprobung braucht einen umsetzbaren Standort und ein begrenztes öffentliches Risiko.',
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
  { id: 'goal', topic: 'Öffentliches Förderziel', statement: 'Was soll die Förderung für die Stadt in erster Linie erreichen?', context: 'Wähle das Ziel, an dem du die drei Förderoptionen messen möchtest.', options: Object.entries(goals).map(([id, goal]) => ({ id, label: goal.label })) },
  { id: 'building', topic: 'Platz für die Farm', statement: 'In welche Halle soll die Farm passen?', context: 'Teste eine Hallengröße. Vergleiche sie mit dem Bodenplatz, den die Farm für Pflanzen, Gänge und Technik braucht.', options: exampleChoices(hallSizes, 'm²') },
  { id: 'power', topic: 'Strom für Licht und Kühlung', statement: 'Wie viel Leistung kann der Stromanschluss liefern?', context: 'Der Anschluss wird in Kilowatt (kW) angegeben. Kilowattstunden (kWh) geben an, wie viel Strom die Farm über einen Zeitraum verbraucht.', options: exampleChoices(powerSizes, 'kW') },
  { id: 'demand', topic: 'Kunden für den Salat', statement: 'Wer könnte den Salat aus der Farm kaufen?', context: 'Wähle eine Kundengruppe für dein Beispiel. Im nächsten Schritt probierst du aus, wie viel Salat sie abnehmen könnte.', options: buyers },
  { id: 'sales', topic: 'Salat pro Woche', statement: 'Wie viel Salat könnten deine Kunden pro Woche abnehmen?', context: 'Teste eine Abnahmemenge und vergleiche sie mit der durchschnittlichen Ernte pro Woche.', options: exampleChoices(weeklyOrders, 'kg') },
  { id: 'cost', topic: 'Stromkosten je Kilogramm', statement: 'Wie viel darf der Strom für ein Kilogramm Salat kosten?', context: 'Lege für dein Planspiel eine Kostengrenze fest. Dazu kommen später zum Beispiel noch Personal- und Baukosten.', options: costOptions },
  { id: 'climate', topic: 'CO₂-Beitrag des Stroms', statement: 'Mit welchem Strom soll die Farm laufen?', context: 'Teste zwei Beispielwerte oder gib an, wie viele Treibhausgase der Strom in deinem Szenario verursacht.', options: climateOptions },
  { id: 'alternative', topic: 'Gewächshaus und Freiland', statement: 'Könnten Gewächshäuser oder Felder das gleiche Ziel erreichen?', context: 'Denk an das Ziel aus Frage 1. Für die Versorgung kommt es zum Beispiel darauf an, ob genug Salat zur richtigen Jahreszeit verfügbar wäre.', options: alternativeOptions },
  { id: 'scale', topic: 'Ergebnis des Farmtests', statement: 'Hat die Farm im Test gut funktioniert?', context: 'Stell dir vor, die Stadt hat die Farm ausprobiert. Gab es genug Salat, blieben die Kosten im Rahmen und wurde das Klimaziel erreicht?', options: scaleOptions },
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

export function siteChecks(answers: Answers, input: Input) {
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

const options: Record<DecisionState['option'], Pick<DecisionState, 'recommendation' | 'conditions' | 'pros' | 'cons' | 'counterargument' | 'response'>> = {
  A: {
    recommendation: 'Wenn der Probebetrieb wie angenommen gelingt, sollte die Stadt eine breitere Förderung prüfen.',
    conditions: [
      'Förderung setzt je Standort geprüfte Anschlüsse, Vollkosten und Abnahmeverträge voraus.',
      'Die Stadt prüft jährlich Liefermengen, Vollkosten und Klimabilanz gegen vorab festgelegte Ziele.',
    ],
    pros: ['Gestapelte Ebenen erhöhen den potenziellen Flächenertrag [P].', 'Die Umweltbedingungen im Anbau lassen sich kontrollieren [D].', 'Gebäudekopplung eröffnet standortabhängige Synergien [F].'],
    cons: ['Kunstlicht erhöht den Strombedarf [S].', 'Modellstromkosten decken nur einen Teil der Vollkosten [M].', 'Ertragswerte einzelner Anlagen sind nur begrenzt übertragbar [P].'],
    counterargument: 'Ein breiter Ausbau setzt öffentliche Mittel langfristig fest.',
    response: 'Für jeden Standort gelten eigene Nachweise und überprüfbare Förderziele [A].',
  },
  B: {
    recommendation: 'Die Stadt sollte einen befristeten Pilotbetrieb fördern, sobald Standort, Stromversorgung und Absatz nachgewiesen sind.',
    conditions: [
      'Vor Förderung werden Gebäude, Netzanschluss und Abnahmemenge belegt.',
      'Nach zwölf Monaten entscheiden Liefermenge, Vollkosten und vergleichbare Klimabilanz über Fortführung oder Abbruch.',
    ],
    pros: ['Ein befristeter Pilot macht den Ausbau überprüfbar [A].', 'Messdaten erlauben Einordnung von Ertrag und Energiebedarf [P].', 'Gebäudeintegration kann am Standort erprobt werden [F].'],
    cons: ['Kunstlicht und Klimatisierung bleiben energieintensiv [S].', 'Szenariorechnungen ersetzen keine Betriebsmessung [M].', 'Gewächshaus und Freiland bleiben relevante Vergleichssysteme [B].'],
    counterargument: 'Der Pilot könnte zum Dauerzuschuss werden.',
    response: 'Befristung und vorher beschlossene Abbruchkriterien begrenzen das Risiko [A].',
  },
  C: {
    recommendation: 'Die Stadt sollte zuerst Gewächshaus oder regionalen Freilandanbau prüfen und die Vertical Farm vorerst zurückstellen.',
    conditions: [
      'Die Alternativen werden bei gleicher Liefermenge und Saison verglichen.',
      'Eine Förderung setzt nachgewiesene Abnahme und tragfähige Vollkosten der gewählten Alternative voraus.',
    ],
    pros: ['Freiland und Gewächshaus ohne Zusatzlicht nutzen Tageslicht [S].', 'Es gibt Vergleichsdaten für beide Anbausysteme [B].', 'Ein Dachgewächshaus in Oberhausen zeigt mögliche Gebäudekopplung [F].'],
    cons: ['Freiland bietet saisonale Liefermengen [B].', 'Heizung kann den Energiebedarf im Gewächshaus erhöhen [S].', 'Der potenziell hohe Flächenertrag im Stapelanbau entfällt [P].'],
    counterargument: 'Eine Vertical Farm könnte auch im Winter kontinuierlich liefern.',
    response: 'Prüfe, ob ein Gewächshaus oder mehrere Lieferanten dieselbe Versorgung erreichen [B].',
  },
}

type Reason = { field: QuestionId; text: string }

function recommend(answers: Answers, site: ReturnType<typeof siteChecks>, checks: ReturnType<typeof fundingChecks>): { option: DecisionState['option']; explanation: string; expansionGaps: Reason[] } {
  const blockers: Reason[] = []
  if (site.hallTooSmall) blockers.push({ field: 'building', text: 'Die Beispielhalle ist zu klein.' })
  if (site.connectionTooWeak) blockers.push({ field: 'power', text: 'Der Beispielanschluss reicht schon im Durchschnitt nicht aus.' })
  if (checks.costExceeded) blockers.push({ field: 'cost', text: 'Der Strom allein kostet mehr als im Planspiel angesetzt.' })
  if (answers.scale === 'failed') blockers.push({ field: 'scale', text: 'Im angenommenen Test hat die Farm ihre Ziele verfehlt.' })
  const expansionGaps = [...blockers]
  const hasBuyer = answers.demand !== undefined && answers.demand !== 'unknown'
  if (answers.goal === 'learning') expansionGaps.push({ field: 'goal', text: 'Euer Ziel ist, die Farm erst einmal zu testen.' })
  if (site.hall === null) expansionGaps.push({ field: 'building', text: 'Eine passende Halle ist offen.' })
  if (site.connection === null) expansionGaps.push({ field: 'power', text: 'Die Leistung des Stromanschlusses ist offen.' })
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
    explanation: 'Im Planspiel reichen Halle, Stromanschluss und Abnahme aus. Die Stromkosten bleiben im Rahmen, der Test gelingt und die anderen Anbauformen erreichen das Ziel nicht. Vor einer echten Förderung prüft die Stadt jeden weiteren Standort.',
    expansionGaps,
  }
  if (site.hall !== null || site.connection !== null || (hasBuyer && site.orders !== null)) return {
    option: 'B',
    explanation: 'Die Farm ist einen befristeten Test wert. Die offenen Punkte entscheiden darüber, ob sich ein Ausbau lohnt.',
    expansionGaps,
  }
  return {
    option: 'C',
    explanation: 'Für Halle, Stromanschluss und Abnahme fehlt eine konkrete Annahme. Prüfe zuerst Standorte und andere Bezugsquellen.',
    expansionGaps,
  }
}

function criteriaFor(answers: Answers, site: ReturnType<typeof siteChecks>, checks: ReturnType<typeof fundingChecks>): Criterion[] {
  const buyersNamed = answers.demand !== 'unknown'
  return [
    { id: 'food', label: 'Ernährungsbeitrag', symbol: buyersNamed && site.orders !== null ? '±' : '?', evidence: 'Blattgemüse ergänzt das Angebot. Liefermengen vor Ort prüfen', source: 'dlr2019' },
    { id: 'environment', label: 'Umwelt', symbol: '?', evidence: 'Strom und Saison prägen die Bilanz. Vollständiger Vergleich offen', source: 'stanghellini2024' },
    { id: 'economy', label: 'Wirtschaftlichkeit', symbol: checks.costExceeded ? '−' : checks.limit === null ? '?' : '±', evidence: 'Stromkosten lassen sich modellieren. Vollkosten vor Ort prüfen', source: 'scenario' },
    { id: 'society', label: 'Gesellschaft', symbol: buyersNamed ? '±' : '?', evidence: 'Zugang für Kundschaft und Wirkungen auf Betriebe prüfen', source: 'material' },
    { id: 'feasibility', label: 'Umsetzbarkeit', symbol: site.hallTooSmall || site.connectionTooWeak ? '−' : site.hall !== null && site.connection !== null ? '±' : '?', evidence: 'Gebäude und maximalen Strombedarf am echten Standort prüfen', source: 'scenario' },
  ]
}

export function evaluateFunding(answers: Answers, input: Input) {
  if (fundingQuestions.some(question => answers[question.id] === undefined)) return null
  const goal = goals[answers.goal!]
  const checks = fundingChecks(answers, input)
  const site = siteChecks(answers, input)
  const judgement = recommend(answers, site, checks)
  const unknown = fundingQuestions.filter(question => answers[question.id] === 'unknown' || question.id === 'alternative' && answers.alternative === 'open')
  const gaps = unknown.map(question => question.topic)
  const localDetails = [
    site.hall === null ? '' : `Halle ${amount(site.hall, 'm²')}${site.hallTooSmall ? ' (zu klein)' : ''}`,
    site.connection === null ? '' : `Anschluss ${amount(site.connection, 'kW')} (Ø Bedarf ${number(site.averagePower, 1)})`,
    site.orders === null ? '' : `Mögliche Abnahme ${number(site.orders)} bei Ø ${amount(site.weeklyHarvest, 'kg/Woche')}`,
  ].filter(Boolean)
  const siteBasis = [
    localDetails.length ? localDetails.join(' · ') + ' [M].' : '',
    !localDetails.length ? 'Halle, Stromanschluss und Abnahmemenge sind offen.' : '',
    site.connection === null && localDetails.length ? 'Stromanschluss offen.' : '',
    judgement.option === 'A' ? 'Erfolgreicher Test und fehlende gleichwertige Bezugsquelle angenommen.' : '',
    answers.scale === 'failed' ? 'Im Szenario wurden die Ziele im Test verfehlt.' : '',
  ].filter(Boolean).join(' ')
  const draft: DecisionState = {
    ...structuredClone(INITIAL_DECISION), ...structuredClone(options[judgement.option]),
    option: judgement.option, goal: goal.brief, priorities: [...goal.priorities], priorityReason: goal.reason,
    criteria: criteriaFor(answers, site, checks), siteBasis,
    scenarioBasis: `${checks.costDetail} [M]. ${checks.climateDetail}.`,
    uncertainty: 'Vollkosten, Ökobilanz und die Beispielangaben vor Ort prüfen.',
  }
  return { ...judgement, draft, gaps, checks }
}
