import { INITIAL_DECISION } from '../components/Brief'
import type { Criterion, DecisionState } from '../components/Brief'
import { amount, number } from './format'
import { applyPreset, BASE_INPUT, calculate } from './model'
import type { Input } from './model'

const hallSizes = { small: 500, medium: 1000, large: 2000 } as const
const powerSizes = { light: 100, medium: 200, strong: 400 } as const
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
] as const
const alternativeOptions = [
  { id: 'available', label: 'Grundsätzlich verfügbar' },
  { id: 'open', label: 'Unklar' },
  { id: 'unavailable', label: 'Derzeit nicht verfügbar' },
] as const
const scaleOptions = [
  { id: 'measured', label: 'Nachweise liegen vor' },
  { id: 'unknown', label: 'Unklar' },
  { id: 'missing', label: 'Nachweise fehlen' },
] as const

export const fundingQuestions = [
  { id: 'goal', topic: 'Öffentliches Förderziel', statement: 'Was soll die Förderung für die Stadt in erster Linie erreichen?', context: 'Wähle das Ziel, an dem du die drei Förderoptionen messen möchtest.', options: Object.entries(goals).map(([id, goal]) => ({ id, label: goal.label })) },
  { id: 'building', topic: 'Platz für die Farm', statement: 'In welche Halle soll die Farm passen?', context: 'Wähle eine Beispielgröße. Die Grundfläche ist der Platz auf dem Hallenboden, einschließlich Gängen und Technik.', options: exampleChoices(hallSizes, 'm²') },
  { id: 'power', topic: 'Strom für Licht und Kühlung', statement: 'Wie stark soll der Stromanschluss der Halle sein?', context: 'Wähle einen Anschluss zum Ausprobieren. Kilowatt (kW) geben an, wie viel Leistung der Anschluss gleichzeitig liefern kann.', options: exampleChoices(powerSizes, 'kW') },
  { id: 'demand', topic: 'Kunden für den Salat', statement: 'Wer könnte den Salat aus der Farm kaufen?', context: 'Wähle eine Kundengruppe für dein Beispiel. Im nächsten Schritt probierst du aus, wie viel Salat sie abnehmen könnte.', options: buyers },
  { id: 'sales', topic: 'Salat pro Woche', statement: 'Wie viel Salat könnten deine Kunden pro Woche abnehmen?', context: 'Wähle eine Beispielmenge und vergleiche sie mit der durchschnittlichen Ernte pro Woche. Echte Absprachen wären später nötig.', options: exampleChoices(weeklyOrders, 'kg') },
  { id: 'cost', topic: 'Stromkosten je Kilogramm', statement: 'Welche Stromkostengrenze möchtest du für ein Kilogramm Salat testen?', context: 'Die Beträge sind frei wählbare Grenzen für das Planspiel. Wenn schon der Strom darüber liegt, können die Vollkosten die Grenze ebenfalls nicht einhalten.', options: costOptions },
  { id: 'climate', topic: 'CO₂-Beitrag des Stroms', statement: 'Welchen Strommix möchtest du für die Klimaprüfung testen?', context: 'Der Rechner hält den Strombedarf je Kilogramm konstant. Ist der lokale Strommix unbekannt, kannst du beide Szenarien im Brief zeigen.', options: climateOptions },
  { id: 'alternative', topic: 'Gewächshaus und Freiland', statement: 'Könnte die Stadt Blattgemüse grundsätzlich aus einem Gewächshaus oder aus regionalem Freiland beziehen?', context: 'Hier geht es um verfügbare Bezugsquellen. Welche das Förderziel besser erreicht, ergibt erst der Vergleich von Saison, Liefermenge, Kosten und Umweltwirkungen.', options: alternativeOptions },
  { id: 'scale', topic: 'Nachweise für einen breiten Ausbau', statement: 'Gibt es Messdaten zu Vollkosten und Umweltwirkungen mehrerer vergleichbarer Betriebe, die einen Ausbau stützen?', context: 'Für den Einstieg sind diese Daten häufig offen. Sie sind vor allem für die Entscheidung über einen breiten Ausbau relevant.', options: scaleOptions },
] as const

export type QuestionId = typeof fundingQuestions[number]['id']
type Goal = keyof typeof goals
export type Answers = Partial<{
  goal: Goal
  building: keyof typeof hallSizes | 'unknown'
  power: keyof typeof powerSizes | 'unknown'
  demand: typeof buyers[number]['id']
  sales: keyof typeof weeklyOrders | 'unknown'
  cost: keyof typeof costLimits | 'open'
  climate: typeof climateOptions[number]['id']
  alternative: typeof alternativeOptions[number]['id']
  scale: typeof scaleOptions[number]['id']
}>

const lowerGridFactor = applyPreset('power').gridFactor

export function siteChecks(answers: Answers, input: Input) {
  const { energy, harvest } = calculate(input)
  const hall = answers.building && answers.building !== 'unknown' ? hallSizes[answers.building] : null
  const connection = answers.power && answers.power !== 'unknown' ? powerSizes[answers.power] : null
  const orders = answers.sales && answers.sales !== 'unknown' ? weeklyOrders[answers.sales] : null
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
  const limit = answers.cost && answers.cost !== 'open' ? costLimits[answers.cost] : null
  const costExceeded = limit !== null && electricityPerKg > limit + 1e-9
  const referenceEmissions = input.energyPerKg * BASE_INPUT.gridFactor
  const lowerEmissions = input.energyPerKg * lowerGridFactor
  const currency = (value: number) => amount(value, '€/kg', 2)
  const emissions = (value: number) => amount(value, 'kg CO₂eq/kg', 3)
  const costDetail = limit === null
    ? `Stromkosten ${currency(electricityPerKg)} ohne gewählte Prüfgrenze`
    : `Stromkosten ${currency(electricityPerKg)}, Prüfgrenze ${currency(limit)} ${costExceeded ? 'überschritten' : 'eingehalten'}`
  const climateDetail = answers.climate === 'reference'
    ? `Strombeitrag im Referenzmix ${emissions(referenceEmissions)} [U,M]`
    : answers.climate === 'lower'
      ? `Strombeitrag im emissionsärmeren Szenario ${emissions(lowerEmissions)} [M]`
      : `Strombeitrag ${number(referenceEmissions, 3)} (Referenzmix) und ${emissions(lowerEmissions)} (emissionsärmerer Mix) [U,M]`
  return { electricityPerKg, limit, costExceeded, referenceEmissions, lowerEmissions, lowerGridFactor, costDetail, climateDetail }
}

export function restoreAnswers(value: unknown): Answers {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(fundingQuestions.flatMap(({ id, options }) => {
    const answer: unknown = (value as Record<string, unknown>)[id]
    return options.some(option => answer === option.id) ? [[id, answer]] : []
  }))
}

const options: Record<DecisionState['option'], Pick<DecisionState, 'recommendation' | 'conditions' | 'pros' | 'cons' | 'counterargument' | 'response'>> = {
  A: {
    recommendation: 'Die Stadt sollte eine breitere Förderung prüfen, weil die Angaben tragfähige und übertragbare Standorte erwarten lassen.',
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

function recommend(answers: Answers, site: ReturnType<typeof siteChecks>, checks: ReturnType<typeof fundingChecks>): { option: DecisionState['option']; explanation: string; reasons: Reason[] } {
  const blockers: Reason[] = []
  if (site.hallTooSmall) blockers.push({ field: 'building', text: 'Die Beispielhalle ist zu klein.' })
  if (site.connectionTooWeak) blockers.push({ field: 'power', text: 'Der Beispielanschluss reicht schon im Durchschnitt nicht aus.' })
  if (checks.costExceeded) blockers.push({ field: 'cost', text: 'Der Strom allein kostet mehr als im Planspiel angesetzt.' })
  if (blockers.length) return {
    option: 'C',
    explanation: 'Das gewählte Farmbeispiel scheitert an mindestens einer Grenze. Prüfe eine kleinere Farm oder andere Bezugsquellen.',
    reasons: blockers,
  }

  const hasBuyer = answers.demand !== undefined && answers.demand !== 'unknown'
  const hasSalesPlan = hasBuyer && site.orders !== null
  if (answers.goal !== 'learning' && checks.limit !== null && site.hall !== null && site.connection !== null && hasSalesPlan && site.unsoldPerWeek === 0 && answers.scale === 'measured' && answers.alternative === 'unavailable') return {
    option: 'A',
    explanation: 'Die Beispielwerte sprechen für eine nähere Prüfung. Ein Ausbau setzt die angegebenen Messdaten und Nachweise für den konkreten Standort voraus.',
    reasons: [{ field: 'scale', text: 'Messdaten für einen Ausbau wurden angegeben.' }, { field: 'alternative', text: 'Andere Bezugsquellen wurden als nicht verfügbar eingeschätzt.' }],
  }
  if (site.hall !== null || site.connection !== null || hasSalesPlan) {
    const open: Reason[] = []
    if (site.hall === null) open.push({ field: 'building', text: 'Hallengröße offen.' })
    if (site.connection === null) open.push({ field: 'power', text: 'Stromanschluss offen.' })
    if (!hasSalesPlan) open.push({ field: 'sales', text: 'Verabredete Abnahmemenge offen.' })
    else if (site.unsoldPerWeek) open.push({ field: 'sales', text: 'Für einen Teil der Ernte fehlen mögliche Kunden.' })
    return {
      option: 'B',
      explanation: 'Ein befristetes Testprojekt kann zeigen, ob sich eine passende Halle, ausreichend Strom und genug Kunden finden lassen.',
      reasons: open.length ? open : [{ field: 'scale', text: 'Vollkosten und Klimawirkung vor Ort prüfen.' }],
    }
  }
  return {
    option: 'C',
    explanation: 'Für Halle, Stromanschluss und Abnahme fehlt eine konkrete Annahme. Prüfe zuerst Standorte und andere Bezugsquellen.',
    reasons: [{ field: 'building', text: 'Halle, Stromanschluss und Abnahmemenge sind offen.' }],
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
  const leadingReason = judgement.reasons[0]
  const siteBasis = [
    localDetails.length ? localDetails.join(' · ') + ' [M].' : '',
    !localDetails.length || leadingReason?.field === 'power' && site.connection === null || leadingReason?.field === 'sales' && site.orders === null ? leadingReason?.text : '',
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
