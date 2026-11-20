import { INITIAL_DECISION } from '../components/Brief'
import type { Criterion, DecisionState } from '../components/Brief'

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

export const fundingQuestions = [
  { id: 'goal', topic: 'Öffentliches Förderziel', statement: 'Was soll die Förderung für die Stadt in erster Linie erreichen?', context: 'Wähle das Ziel, an dem du die drei Förderoptionen messen möchtest.', options: Object.entries(goals).map(([id, goal]) => ({ id, label: goal.label })) },
  { id: 'building', topic: 'Gebäude und Betreiber', statement: 'Eine geeignete Halle mit verantwortlichem Betreiber ist verfügbar.', context: 'Prüfe unter anderem Höhe, Platz für Technik, Wasseranschluss und Zuständigkeit für den Betrieb.', options: statusOptions },
  { id: 'power', topic: 'Netzanschluss und Strompreis', statement: 'Der Netzanschluss deckt die Spitzenlast und ein belastbares Stromangebot liegt vor.', context: 'Eine durchschnittliche Leistung im Rechner ersetzt keine Prüfung der Spitzenlast oder des Anschlusses.', options: statusOptions },
  { id: 'demand', topic: 'Absatz und Zugang', statement: 'Regionale Abnehmer haben Menge und Preis zugesagt, auch außerhalb der Saison.', context: 'Als Nachweis könnten eine Absichtserklärung mit Liefermengen und einem Preisrahmen oder ein Vertrag dienen.', options: statusOptions },
  { id: 'cost', topic: 'Vollkosten', statement: 'Eine Vollkostenrechnung zeigt, dass die Anlage einschließlich Investition und Personal tragfähig wäre.', context: 'Berücksichtige unter anderem Wartung, Ausfälle und Stromkosten. Der Szenariorechner zeigt nur Stromteilkosten.', options: statusOptions },
  { id: 'climate', topic: 'Umweltbilanz', statement: 'Eine vergleichbare Ökobilanz zeigt am Standort einen Vorteil gegenüber den verfügbaren Alternativen.', context: 'Vergleiche dasselbe Produkt und dieselbe Saison. Beleuchtung, Klimatisierung, Transport und weitere relevante Bilanzteile müssen erfasst sein.', options: statusOptions },
  { id: 'alternative', topic: 'Gewächshaus und Freiland', statement: 'Ein Gewächshaus oder regionaler Freilandanbau erreicht das gewählte Förderziel nachweislich besser.', context: 'Vergleiche bei deinem Ziel beispielsweise Lieferfähigkeit, Umweltwirkungen oder den Einsatz öffentlicher Mittel.', options: statusOptions },
  { id: 'scale', topic: 'Übertragbarkeit', statement: 'Vergleichbare Betriebe haben die Ergebnisse schon bestätigt und weitere geeignete Standorte sind benannt.', context: 'Eine breite Förderung braucht Belege, die über eine einzelne Anlage oder ein Rechenbeispiel hinausgehen.', options: statusOptions },
] as const

export type QuestionId = typeof fundingQuestions[number]['id']
type LocalCheck = Exclude<QuestionId, 'goal'>
type Status = typeof statusOptions[number]['id']
type Goal = keyof typeof goals
export type Answers = Partial<{ goal: Goal } & Record<LocalCheck, Status>>

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
      'Nach zwölf Monaten entscheiden Liefermenge, kWh/kg und Vollkosten/kg über Fortführung oder Abbruch.',
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

type Reason = { field: LocalCheck; text: string }

function recommend(answers: Answers): { option: DecisionState['option']; explanation: string; reasons: Reason[] } {
  const requirements = ['building', 'power', 'demand'] as const
  const failed = requirements.filter(field => answers[field] === 'no')
  if (answers.alternative === 'yes') return {
    option: 'C',
    explanation: 'Laut deinen Angaben erreicht eine verfügbare Alternative das Förderziel besser.',
    reasons: [{ field: 'alternative', text: 'Eine Alternative erreicht das Ziel besser.' }],
  }
  if (failed.length) return {
    option: 'C',
    explanation: 'Mindestens eine Voraussetzung für den Betrieb oder Absatz fehlt laut deinen Angaben.',
    reasons: failed.map(field => ({ field, text: { building: 'Halle oder Betreiber fehlen.', power: 'Netzanschluss oder Stromangebot reichen nicht.', demand: 'Verbindlicher Absatz fehlt.' }[field] })),
  }
  if (answers.cost === 'no') return {
    option: 'C',
    explanation: 'Laut deinen Angaben zeigt die Vollkostenprüfung keine tragfähige Anlage.',
    reasons: [{ field: 'cost', text: 'Die Wirtschaftlichkeit ist nicht tragfähig.' }],
  }
  if (answers.goal === 'environment' && answers.climate === 'no') return {
    option: 'C',
    explanation: 'Laut deinen Angaben erfüllt eine Vertical Farm das priorisierte Umweltziel im Vergleich nicht.',
    reasons: [{ field: 'climate', text: 'Ein Umweltvorteil wurde nicht festgestellt.' }],
  }
  if (answers.goal !== 'learning' && answers.alternative === 'no' && requirements.every(field => answers[field] === 'yes') && answers.cost === 'yes' && answers.climate === 'yes' && answers.scale === 'yes') return {
    option: 'A',
    explanation: 'Deine Angaben sprechen für einen tragfähigen Betrieb sowie für einen Vorteil und die Übertragbarkeit auf weitere Standorte.',
    reasons: [{ field: 'cost', text: 'Tragfähige Vollkosten genannt.' }, { field: 'climate', text: 'Ein Umweltvorteil ist angegeben.' }, { field: 'scale', text: 'Weitere Standorte und bestätigte Ergebnisse angegeben.' }],
  }
  if (requirements.some(field => answers[field] === 'yes')) {
    const checks: Reason[] = [
      { field: 'building', text: 'Halle und Betreiber noch nachweisen.' },
      { field: 'power', text: 'Netzanschluss und Stromangebot noch nachweisen.' },
      { field: 'demand', text: 'Abnahmezusagen noch nachweisen.' },
      { field: 'cost', text: 'Tragfähige Vollkosten sind nicht belegt.' },
      { field: 'climate', text: 'Ein Umweltvorteil ist nicht belegt.' },
      { field: 'scale', text: 'Die Übertragbarkeit ist nicht belegt.' },
    ]
    const missingProofs = checks.filter(({ field }) => answers[field] !== 'yes')
    const alternative: Reason = { field: 'alternative', text: 'Gleichwertige Alternativen weiter prüfen.' }
    return {
      option: 'B',
      explanation: answers.goal === 'learning' ? 'Mindestens eine Voraussetzung ist laut deinen Angaben erfüllt. Jetzt sollen mit begrenztem Einsatz Betriebsdaten gewonnen werden.' : 'Ein erster Ansatz ist laut deinen Angaben vorhanden. Für eine breite Förderung reichen die Angaben noch nicht aus.',
      reasons: [...missingProofs, alternative].slice(0, 3),
    }
  }
  return {
    option: 'C',
    explanation: 'Für Gebäude, Stromversorgung und Absatz fehlen belastbare Angaben. Prüfe die Alternativen und erhebe zuerst Standortdaten.',
    reasons: requirements.map(field => ({ field, text: { building: 'Halle und Betreiber offen.', power: 'Netzanschluss und Stromangebot offen.', demand: 'Abnahmezusagen offen.' }[field] })),
  }
}

function criteriaFor(answers: Answers): Criterion[] {
  const { demand, climate, cost, building, power } = answers
  const verdict = (status: Status | undefined) => status === 'yes' ? '+' : status === 'no' ? '−' : '?'
  return [
    { id: 'food', label: 'Ernährungsbeitrag', symbol: verdict(demand), evidence: 'Blattgemüse ergänzt das Angebot. Liefermengen vor Ort prüfen', source: 'dlr2019' },
    { id: 'environment', label: 'Umwelt', symbol: verdict(climate), evidence: 'Strom und Saison prägen die Vergleichsbilanz', source: 'stanghellini2024' },
    { id: 'economy', label: 'Wirtschaftlichkeit', symbol: verdict(cost), evidence: 'Strom ist nur ein Teil der Vollkosten', source: 'scenario' },
    { id: 'society', label: 'Gesellschaft', symbol: demand === 'yes' ? '±' : '?', evidence: 'Zugang für Kundschaft und Wirkungen auf Betriebe prüfen', source: 'material' },
    { id: 'feasibility', label: 'Umsetzbarkeit', symbol: building === 'no' || power === 'no' ? '−' : building === 'yes' && power === 'yes' ? '+' : '?', evidence: 'Gebäudeintegration hängt von passender Infrastruktur ab', source: 'fraunhofer' },
  ]
}

export function evaluateFunding(answers: Answers) {
  if (fundingQuestions.some(question => answers[question.id] === undefined)) return null
  const goal = goals[answers.goal!]
  const judgement = recommend(answers)
  const unknown = fundingQuestions.filter(question => answers[question.id] === 'unknown')
  const gaps = unknown.map(question => question.topic)
  const siteBasis = judgement.reasons.map(reason => reason.text).join(' ')
  const draft: DecisionState = {
    ...structuredClone(INITIAL_DECISION), ...structuredClone(options[judgement.option]),
    option: judgement.option, goal: goal.brief, priorities: [...goal.priorities], priorityReason: goal.reason,
    criteria: criteriaFor(answers), siteBasis,
    uncertainty: gaps.length ? 'Offen bleiben ' + gaps.slice(0, 3).join(', ') + '.' : 'Die Standortangaben beruhen auf euren Antworten und sollten vor einer realen Förderentscheidung geprüft werden.',
  }
  return { ...judgement, draft, gaps }
}
