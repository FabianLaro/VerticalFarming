export const parts = {
  plants: { title: 'Anbau in mehreren Ebenen', text: 'Salat wächst in Regalen. Hydroponik bedeutet: Die Wurzeln erhalten Wasser und gelöste Nährstoffe ohne Ackerboden. Mehr Anbaufläche passt auf dieselbe Gebäudegrundfläche.', limit: 'Ertrag je Anbaufläche ist kein Ertrag je Gebäudegrundfläche. Wege und Technik brauchen Platz.', source: 'pennisi2025' },
  lights: { title: 'Licht wird zum Standortfaktor', text: 'LEDs liefern das Licht für die Photosynthese. Licht, Kühlung und Entfeuchtung brauchen Energie. Eine höhere Lichtleistung garantiert keinen proportional höheren Ertrag.', limit: 'Im Modell bleibt der Ertrag frei gewählt. Licht und Wachstum werden nicht unbelegt gekoppelt.', source: 'stanghellini2024' },
  water: { title: 'Ein Kreislauf mit Zuflüssen', text: 'Die Pumpe fördert Nährlösung aus dem Tank zu jeder Regalebene. Ein dünner Film fließt mit leichtem Gefälle an den Wurzeln entlang und kehrt in den Tank zurück. Dort werden unter anderem pH-Wert und Leitfähigkeit geprüft und Wasser und Nährsalze ergänzt.', limit: 'Ernte, Reinigung und Verluste führen Wasser und Nährstoffe aus der Anlage. Frischwasser und Nährsalze werden weiterhin gebraucht.', source: 'dlr2019' },
  climate: { title: 'Klima ist technische Arbeit', text: 'Lüftung, Kühlung und Entfeuchtung regeln Temperatur und Luftfeuchte. Sensoren messen Temperatur und Luftfeuchte. Bei der Entfeuchtung kondensiert Wasserdampf. Je nach Anlage kann dieses Wasser aufbereitet und wiederverwendet werden.', limit: 'Der eingegebene Energiebedarf enthält im Szenario Licht, Klima und Pumpen gemeinsam. Es wird nichts zusätzlich aufgeschlagen.', source: 'pennisi2025' },
  harvest: { title: 'Von der Farm in die Stadt', text: 'Geerntet, sortiert und verpackt wird außerhalb der Regale. Kurze Wege können Frische und planbare Lieferungen erleichtern. Preis, erreichbare Abnehmer und bezahlbarer Zugang entscheiden über den Versorgungsnutzen.', limit: 'Blattgemüse ergänzt die Ernährung. Es ersetzt weder Grundnahrungsmittel noch eine vielfältige Landwirtschaft.', source: 'dlr2019' },
  shell: { title: 'Gebäude und Stadt zusammendenken', text: 'Ein geeigneter Standort braucht verlässlichen Strom, Wasser, Logistik und Genehmigungen. Abwärme und vorhandene Gebäude können interessant sein, wenn ihre tatsächliche Nutzbarkeit belegt wird.', limit: 'Der ALTMARKTgarten nutzt Sonnenlicht auf einem Dach. Er ist kein Leistungsnachweis für eine vollständig künstlich beleuchtete Pflanzenfabrik.', source: 'fraunhofer' },
} as const
export type Part = keyof typeof parts
type PartCopy = { title: string; text: string; limit: string; source: string }

export const referenceParts: Record<'greenhouse' | 'field', Partial<Record<Part, PartCopy>>> = {
  greenhouse: {
    plants: { title: 'Kopfsalat im Boden', text: 'Die Vergleichsreferenz nutzt Beete auf einer Ebene. Das Gewächshaus lässt Sonnenlicht für die Photosynthese hinein.', limit: 'Andere Gewächshäuser können hydroponisch arbeiten oder zusätzlich beleuchten.', source: 'blom2022' },
    water: { title: 'Bewässerung der Gewächshausbeete', text: 'Die Leitungen führen Bewässerungswasser zu den Pflanzen im Boden.', limit: 'Die Referenz erfasst die Bewässerungszufuhr pro Kilogramm Kopfsalat.', source: 'blom2022' },
    harvest: { title: 'Ernte im Gewächshaus', text: 'Nach der Ernte wird der Kopfsalat für die Abnahme vorbereitet. Ein Gewächshaus kann die Saison verlängern.', limit: 'Die Jahresernte sagt wenig über die Liefermenge in einzelnen Wochen aus.', source: 'blom2022' },
    shell: { title: 'Sonnenlicht und Gebäudeschutz', text: 'Die transparente Hülle lässt Licht hinein und schützt die Kultur. Die untersuchte Anlage nutzt Erdgas zur Heizung.', limit: 'Heizbedarf und Gebäudekopplung hängen vom Standort und der Anlage ab.', source: 'blom2022' },
  },
  field: {
    plants: { title: 'Kopfsalat im Freiland', text: 'Salat wächst im Boden mit Sonnenlicht. Witterung und Saison bestimmen, wann welche Mengen geerntet werden können.', limit: 'Die niederländische Referenz fasst drei saisonale Anbauzyklen zusammen.', source: 'blom2022' },
    water: { title: 'Regen und zusätzliche Bewässerung', text: 'Der Boden erhält Regen. Bei Bedarf versorgen Leitungen die Beete zusätzlich mit Wasser.', limit: 'Die Zahl im Vergleich umfasst nur die zusätzliche Bewässerung.', source: 'blom2022' },
    harvest: { title: 'Saisonale Freilandernte', text: 'Die Ernte wird für Abnehmer sortiert, verpackt und ausgeliefert.', limit: 'Für Winterlieferungen braucht es eine passende andere Bezugsquelle.', source: 'blom2022' },
  },
}

export const partLabels: Record<Part, string> = { plants: 'Anbau', lights: 'Licht', water: 'Wasser', climate: 'Klima', harvest: 'Ernte', shell: 'Gebäude' }
