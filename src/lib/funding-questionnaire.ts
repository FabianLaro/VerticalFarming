import { INITIAL_DECISION } from '../components/Brief'
import type { Criterion, DecisionState } from '../components/Brief'
import { amount } from './format'
import { applyPreset, BASE_INPUT, calculate } from './model'
import type { Input } from './model'

const statusOptions = [
  { id: 'yes', label: 'Trifft zu' },
  { id: 'unknown', label: 'Unklar' },
  { id: 'no', label: 'Trifft nicht zu' },
] as const

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
  { id: 'building', topic: 'Gebäude und Betreiber', statement: 'Eine geeignete Halle mit verantwortlichem Betreiber ist verfügbar.', context: 'Prüfe unter anderem Höhe, Platz für Technik, Wasseranschluss und Zuständigkeit für den Betrieb.', options: statusOptions },
  { id: 'power', topic: 'Netzanschluss und Strompreis', statement: 'Der Netzanschluss deckt die Spitzenlast und ein belastbares Stromangebot liegt vor.', context: 'Eine durchschnittliche Leistung im Rechner ersetzt keine Prüfung der Spitzenlast oder des Anschlusses.', options: statusOptions },
  { id: 'demand', topic: 'Absatz und Zugang', statement: 'Regionale Abnehmer haben Menge und Preis zugesagt, auch außerhalb der Saison.', context: 'Als Nachweis könnten eine Absichtserklärung mit Liefermengen und einem Preisrahmen oder ein Vertrag dienen.', options: statusOptions },
  { id: 'cost', topic: 'Stromkosten je Kilogramm', statement: 'Welche Stromkostengrenze möchtest du für ein Kilogramm Salat testen?', context: 'Die Beträge sind frei wählbare Grenzen für das Planspiel. Wenn schon der Strom darüber liegt, können die Vollkosten die Grenze ebenfalls nicht einhalten.', options: costOptions },
  { id: 'climate', topic: 'CO₂-Beitrag des Stroms', statement: 'Welchen Strommix möchtest du für die Klimaprüfung testen?', context: 'Der Rechner hält den Strombedarf je Kilogramm konstant. Ist der lokale Strommix unbekannt, kannst du beide Szenarien im Brief zeigen.', options: climateOptions },
  { id: 'alternative', topic: 'Gewächshaus und Freiland', statement: 'Könnte die Stadt Blattgemüse grundsätzlich aus einem Gewächshaus oder aus regionalem Freiland beziehen?', context: 'Hier geht es um verfügbare Bezugsquellen. Welche das Förderziel besser erreicht, ergibt erst der Vergleich von Saison, Liefermenge, Kosten und Umweltwirkungen.', options: alternativeOptions },
  { id: 'scale', topic: 'Nachweise für einen breiten Ausbau', statement: 'Gibt es Messdaten zu Vollkosten und Umweltwirkungen mehrerer vergleichbarer Betriebe, die einen Ausbau stützen?', context: 'Für den Einstieg sind diese Daten häufig offen. Sie sind vor allem für die Entscheidung über einen breiten Ausbau relevant.', options: scaleOptions },
] as const

export type QuestionId = typeof fundingQuestions[number]['id']
type SiteCondition = 'building' | 'power' | 'demand'
type Status = typeof statusOptions[number]['id']
type Goal = keyof typeof goals
export type Answers = Partial<{
  goal: Goal
  cost: keyof typeof costLimits | 'open'
  climate: typeof climateOptions[number]['id']
  alternative: typeof alternativeOptions[number]['id']
  scale: typeof scaleOptions[number]['id']
} & Record<SiteCondition, Status>>

const lowerGridFactor = applyPreset('power').gridFactor

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
      : `Strombeitrag ${emissions(referenceEmissions)} im Referenzmix und ${emissions(lowerEmissions)} im emissionsärmeren Szenario [U,M]`
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
    recommendation: 'Die Stadt sollte Gewächshaus oder regionalen Freilandanbau vorrangig prüfen und vorerst keine Vertical Farm fördern.',
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

function recommend(answers: Answers, checks: ReturnType<typeof fundingChecks>): { option: DecisionState['option']; explanation: string; reasons: Reason[] } {
  const requirements = ['building', 'power', 'demand'] as const
  const failed = requirements.filter(field => answers[field] === 'no')
  if (checks.costExceeded) return {
    option: 'C',
    explanation: 'Im gewählten Szenario überschreiten schon die Stromkosten deine Prüfgrenze. Prüfe alternative Versorgung oder ein Szenario mit geringeren Stromkosten.',
    reasons: [{ field: 'cost', text: 'Die gewählte Stromkostengrenze wird im Modell überschritten.' }],
  }
  if (failed.length) return {
    option: 'C',
    explanation: 'Mindestens eine Voraussetzung für den Betrieb oder Absatz fehlt laut deinen Angaben.',
    reasons: failed.map(field => ({ field, text: { building: 'Halle oder Betreiber fehlen.', power: 'Netzanschluss oder Stromangebot reichen nicht.', demand: 'Verbindlicher Absatz fehlt.' }[field] })),
  }
  if (answers.goal !== 'learning' && checks.limit !== null && requirements.every(field => answers[field] === 'yes') && answers.scale === 'measured' && answers.alternative === 'unavailable') return {
    option: 'A',
    explanation: 'Die Stromkosten bleiben im Planspiel unter der gewählten Grenze oder auf ihr. Die Empfehlung setzt die von dir angegebenen Messdaten und Standortnachweise voraus.',
    reasons: [{ field: 'scale', text: 'Vergleichbare Messdaten für den Ausbau wurden angegeben.' }, { field: 'alternative', text: 'Regionale Alternativen wurden als derzeit nicht verfügbar eingeschätzt.' }],
  }
  if (requirements.some(field => answers[field] === 'yes')) {
    const siteChecks: Reason[] = [
      { field: 'building', text: 'Halle und Betreiber noch nachweisen.' },
      { field: 'power', text: 'Netzanschluss und Stromangebot noch nachweisen.' },
      { field: 'demand', text: 'Abnahmezusagen noch nachweisen.' },
    ]
    const open = siteChecks.filter(({ field }) => answers[field] !== 'yes')
    const evaluation: Reason = { field: 'scale', text: 'Vollkosten und Umweltwirkungen vor einer Förderung prüfen.' }
    return {
      option: 'B',
      explanation: 'Ein erster Ansatz ist erkennbar. Ein befristeter Pilot kann noch offene Angaben zu Vollkosten, Lieferfähigkeit und Klima klären.',
      reasons: [...open, evaluation].slice(0, 3),
    }
  }
  return {
    option: 'C',
    explanation: 'Für Gebäude, Stromversorgung und Absatz fehlen belastbare Angaben. Prüfe die Alternativen und erhebe zuerst Standortdaten.',
    reasons: requirements.map(field => ({ field, text: { building: 'Halle und Betreiber offen.', power: 'Netzanschluss und Stromangebot offen.', demand: 'Abnahmezusagen offen.' }[field] })),
  }
}

function criteriaFor(answers: Answers, checks: ReturnType<typeof fundingChecks>): Criterion[] {
  const { demand, building, power } = answers
  const verdict = (status: Status | undefined) => status === 'yes' ? '+' : status === 'no' ? '−' : '?'
  return [
    { id: 'food', label: 'Ernährungsbeitrag', symbol: verdict(demand), evidence: 'Blattgemüse ergänzt das Angebot. Liefermengen vor Ort prüfen', source: 'dlr2019' },
    { id: 'environment', label: 'Umwelt', symbol: '?', evidence: 'Strom und Saison prägen die Bilanz. Vollständiger Vergleich offen', source: 'stanghellini2024' },
    { id: 'economy', label: 'Wirtschaftlichkeit', symbol: checks.costExceeded ? '−' : checks.limit === null ? '?' : '±', evidence: 'Stromkosten lassen sich modellieren. Vollkosten vor Ort prüfen', source: 'scenario' },
    { id: 'society', label: 'Gesellschaft', symbol: demand === 'yes' ? '±' : '?', evidence: 'Zugang für Kundschaft und Wirkungen auf Betriebe prüfen', source: 'material' },
    { id: 'feasibility', label: 'Umsetzbarkeit', symbol: building === 'no' || power === 'no' ? '−' : building === 'yes' && power === 'yes' ? '+' : '?', evidence: 'Gebäudeintegration hängt von passender Infrastruktur ab', source: 'fraunhofer' },
  ]
}

export function evaluateFunding(answers: Answers, input: Input) {
  if (fundingQuestions.some(question => answers[question.id] === undefined)) return null
  const goal = goals[answers.goal!]
  const checks = fundingChecks(answers, input)
  const judgement = recommend(answers, checks)
  const unknown = fundingQuestions.filter(question => answers[question.id] === 'unknown' || question.id === 'alternative' && answers.alternative === 'open')
  const gaps = unknown.map(question => question.topic)
  const siteBasis = judgement.reasons.map(reason => reason.text).join(' ')
  const draft: DecisionState = {
    ...structuredClone(INITIAL_DECISION), ...structuredClone(options[judgement.option]),
    option: judgement.option, goal: goal.brief, priorities: [...goal.priorities], priorityReason: goal.reason,
    criteria: criteriaFor(answers, checks), siteBasis,
    scenarioBasis: `${checks.costDetail} [M]. ${checks.climateDetail}.`,
    uncertainty: 'Vollkosten und eine vergleichbare Ökobilanz am Standort prüfen' + (gaps.length ? '. Weitere offene Angaben siehe Fragenkatalog.' : '.'),
  }
  return { ...judgement, draft, gaps, checks }
}
