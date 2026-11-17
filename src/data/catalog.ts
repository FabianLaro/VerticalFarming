/** Geprüfte Quellen und eindeutig getrennte Eingabeannahmen. Stand 16.11.2026. */
export interface Source {
  id: string;
  short: string;
  label: string;
  title: string;
  authors: string;
  year: number | null;
  url: string;
  fulltextUrl?: string;
  doi?: string;
  accessed: string;
  locator: string;
  kind: string;
  access: string;
  product: string;
  region: string;
  period: string;
  boundary: string;
  limitations: string[];
  findings: string[];
}

export const sources: Source[] = [
  {
    id: 'material', short: 'Unterrichtsdossier · M4/M6/M7', label: 'Aufgabenstellung · lokales Material',
    title: 'Unterrichtsdossier Vertical Farming · Q1 NRW · Dalton', authors: 'Autor nicht ausgewiesen', year: 2026,
    url: './material/aufgabenstellung.pdf', accessed: '2026-11-16',
    locator: 'M4, S. 4 (Optionen und gesellschaftliche Gruppen); M6, S. 6 (Kriterien); Vorlage, S. 7 (Decision Brief)',
    kind: 'Didaktisches Unterrichtsdossier; neun gescannte Seiten', access: 'Vollständiger lokaler Scan; OCR und Sichtprüfung aller neun Seiten',
    product: 'Vertikale Landwirtschaft als Unterrichtsgegenstand', region: 'Didaktische Förderentscheidung in Nordrhein-Westfalen',
    period: 'Quellenstand 15.11.2026; Entscheidungshorizont 2040',
    boundary: 'Schulische Aufgabenstellung, redaktionelle Positionen und normative Bewertungsfragen; keine empirische Messung gesellschaftlicher Wirkungen.',
    limitations: ['Materialpositionen sind Zusammenfassungen, keine Interviews oder wörtlichen Originalzitate.', 'Fragen zu Zugang, Verteilung, Einkommen und Einfluss formulieren einen Prüfauftrag; sie belegen keine gemessene Wirkung auf bestimmte Gruppen.', 'Der ursprüngliche Unterrichtszeitplan begrenzt den ausdrücklich auf fünf Wochen erweiterten Nutzerauftrag nicht.'],
    findings: ['Förderoptionen: A Breite Investitionsförderung; B Befristete Pilotförderung; C Andere Versorgung fördern.', 'Fünf Kriterien: Ernährungsbeitrag, Umwelt, Wirtschaftlichkeit, Gesellschaft und Umsetzbarkeit. Zwei begründete Prioritäten; Symbole + / ± / − / ? ohne Gesamtnote.', 'Zu prüfen sind Zugang zu Lebensmitteln sowie mögliche Gewinne und Verluste bei Einkommen und Einfluss; benannte Zielkonflikte sind keine gemessenen Gruppeneffekte.', 'Einseitiger Decision Brief mit höchstens 450 Wörtern einschließlich Beschriftungen; je drei belegte Pro- und Contraargumente, zwei überprüfbare Bedingungen und zwei offene Fragen.'],
  },
  {
    id: 'pennisi2025', short: 'Pennisi et al. 2025', label: 'Review · Vertical Farming',
    title: 'Vertical farming: productivity, environmental impact, and resource use. A review',
    authors: 'Pennisi, G.; Gianquinto, G.; Marcelis, L. F. M.; Martin, M.; Orsini, F.', year: 2025,
    url: 'https://doi.org/10.1007/s13593-025-01055-w', accessed: '2026-11-16',
    doi: '10.1007/s13593-025-01055-w', fulltextUrl: 'https://link.springer.com/content/pdf/10.1007/s13593-025-01055-w.pdf',
    locator: 'Abb. 2, S. 4 (Ertrag); Abb. 3, S. 5 (Energieeffizienz)',
    kind: 'Literaturreview; wissenschaftliche und Unternehmensangaben getrennt', access: 'Originalvolltext gelesen',
    product: 'Salat, essbare Frischmasse', region: 'Internationale Literatur; verschiedene Anlagen',
    period: 'In der Veröffentlichung zusammengestellte Studien; keine einheitliche Erhebungsperiode',
    boundary: 'Ertrag je summierter Anbaufläche und Jahr; Energieeffizienz je kg Frischmasse, ganzer Pflanzenzyklus einschließlich Nichtlicht-Verbrauchern.',
    limitations: [
      'Gruppenmittel sind keine Unter- und Obergrenzen. Die Stichproben sind nicht repräsentativ für NRW.',
      'Kehrwert einer mittleren Energieeffizienz ist nicht der mittlere Energiebedarf der Betriebe.',
      'Ertrags- und Energiekennzahlen stammen nicht zwingend aus denselben Anlagen; ihre Kombination bleibt ein Szenario.',
      'Unternehmensangaben haben andere Anreize und sind nicht automatisch unabhängig geprüft.',
      'Bei Unternehmensangaben ist die Trennung von Anbau- und belegter Bodenfläche teilweise unklar; bei fehlenden Angaben werden keine Stillstandszeiten angesetzt.',
    ],
    findings: [
      'Wissenschaftliche Erträge: Mittel 59,7 kg/(m² Anbaufläche·Jahr), n = 54; Unternehmensangaben 105,2, n = 32.',
      'Energieeffizienz: wissenschaftliche Angaben 0,13 kg/kWh (n = 34), Unternehmensangaben 0,08 kg/kWh (n = 6).',
      'Die gerundeten 60 bis 105 kg/(m²·Jahr) des Schulmaterials bezeichnen Gruppenmittel, keine garantierte Betriebsspanne.',
      'Wassereffizienz: rund 140 g Frischmasse je Liter Bewässerungszufuhr im Review; große Streuung und ausreißerempfindlicher Gruppenmittelwert, keine garantierte Einsparung.',
    ],
  },
  {
    id: 'stanghellini2024', short: 'Stanghellini & Katzin 2024', label: 'Energie · Beleuchtung',
    title: 'The dark side of lighting: A critical analysis of vertical farms’ environmental impact',
    authors: 'Stanghellini, C.; Katzin, D.', year: 2024,
    url: 'https://doi.org/10.1016/j.jclepro.2024.142359', accessed: '2026-11-16',
    doi: '10.1016/j.jclepro.2024.142359', fulltextUrl: 'https://edepot.wur.nl/659745',
    locator: '§ 3, S. 4 (Energie); § 5, S. 5 (Transportbeispiel); § 7 / Tabelle 3, S. 5–7 (Kreisläufe); § 8, S. 6 (Vergleich)',
    kind: 'Wissenschaftliche kritische Analyse und Modellierung', access: 'Originalvolltext gelesen',
    product: 'Pflanzenproduktion unter künstlichem Licht', region: 'Systemanalyse; keine kalibrierte NRW-Anlage',
    period: 'Veröffentlichung 2024; verschiedene technische Referenzannahmen',
    boundary: 'Umwandlung von elektrischer Energie in Pflanzenproduktion; Beleuchtung sowie ergänzende Technik müssen getrennt bzw. vollständig bilanziert werden.',
    limitations: ['Technische Potentiale sind keine belegte Wirtschaftlichkeit eines konkreten Betriebs.', 'Licht, Temperatur und Wachstum werden hier nicht quantitativ gekoppelt.'],
    findings: ['Künstliches Licht begründet einen strukturellen Strombedarf; kurze Transportwege allein belegen keinen Klimavorteil.', 'Die günstige theoretische Schätzung von 4,4 kWh/kg enthält 25 % Klimazuschlag; 3,3 kWh/kg ist eine Optimierungsannahme. Beide sind keine typischen Messwerte.', 'Wasser- und Nährlösungsrezirkulation sind auch im Gewächshaus möglich; Entfeuchtung benötigt Energie.', 'Die App schlägt Pumpen und Klimatisierung nicht erneut auf den angenommenen Gesamt-Strombedarf auf.'],
  },
  {
    id: 'dlrproject', short: 'DLR · EDEN ISS Projektseite', label: 'EDEN ISS · Aufbau und Forschungsziel',
    title: 'EDEN ISS', authors: 'Deutsches Zentrum für Luft- und Raumfahrt, Institut für Raumfahrtsysteme', year: null,
    url: 'https://www.dlr.de/de/irs/forschung-und-transfer/projekte/eden-iss', accessed: '2026-11-16',
    locator: 'Über das Projekt; Ziele; Zusammenfassung des Designs; Projektstatus',
    kind: 'Historische Projektbeschreibung des beteiligten Forschungsinstituts', access: 'Originalseite vollständig gelesen',
    product: 'Gemischte essbare Pflanzen für Raumfahrtforschung', region: 'Neumayer III, Antarktis',
    period: 'Projekt 2015–2019; Statusabschnitt mit Erwartungen für 2020 und geplanten Folgeexperimenten',
    boundary: 'Forschungsziele und Aufbau: mehrere Anbauebenen sowie getrennte Service- und Technikbereiche.',
    limitations: ['Historischer Seitenstand; kein Nachweis eines aktuellen Betriebsstatus 2026.', 'Die Seite rundet den Erntezeitraum 2018 auf neun Monate; Presseinformation nennt 9,5 Monate, Messpublikation 286 Betriebstage. Keine austauschbaren Jahreserträge.'],
    findings: ['Mehrstöckige Anzucht benötigt gesonderte Technik- und Serviceflächen.', 'Raumfahrtforschung und Extremstandort belegen technische Möglichkeiten, keine heutige Rentabilität in NRW.'],
  },
  {
    id: 'dlr2019', short: 'DLR 2019 / Zabel et al. 2020', label: 'EDEN ISS · Forschungsanlage',
    title: 'Projekt EDEN-ISS präsentiert Ergebnisse mit neuem Gewächshauskonzept für zukünftige Raumfahrtmissionen',
    authors: 'Deutsches Zentrum für Luft- und Raumfahrt (DLR)', year: 2019,
    url: 'https://www.dlr.de/de/aktuelles/nachrichten/2019/03/20190823_projekt-eden-iss-praesentiert-ergebnisse',
    accessed: '2026-11-16', locator: 'Abschnitt „Genug Nahrung für sechsköpfige Crew“; wissenschaftlicher Abgleich: Zabel et al. 2020, Abstract/Discussion',
    kind: 'Presseinformation des beteiligten Instituts; mit Messpublikation abgeglichen', access: 'Originalseite und wissenschaftlicher Volltext gelesen',
    product: 'Verschiedene Gemüse- und Kräuterkulturen; keine reine Salaternte', region: 'Neumayer III, Antarktis', period: 'Versuch 2018; 9,5 Monate bzw. 286 Betriebstage',
    boundary: '268 kg essbare Frischmasse auf 12,5 m² summierter Anbaufläche im Versuchszeitraum; externe Versorgung durch Forschungsstation.',
    limitations: ['Keine Jahresernte einer NRW-Farm und kein Rentabilitätsnachweis.', '0,8 kW/m² ist eine mittlere Leistung, kein Energiebedarf in kWh/m².', 'Der Pressetext fasst Blattgemüse und Kräuter unscharf als Salat zusammen.'],
    findings: ['Aeroponische Nährlösung, LED, Klimaführung und Rückgewinnung machen Anbau am Extremstandort technisch möglich.', 'Wartung, Arbeit, Strom und Verbrauchsmittel bleiben erforderlich.'],
  },
  {
    id: 'dlr2020', short: 'Zabel et al. 2020', label: 'EDEN ISS · Messdaten',
    title: 'Biomass Production of the EDEN ISS Space Greenhouse in Antarctica During the 2018 Experiment Phase',
    authors: 'Zabel, P.; Zeidler, C.; Vrakking, V.; Dorn, M.; Schubert, D.', year: 2020,
    url: 'https://elib.dlr.de/135980/1/2020main_Frontiers_EDEN%20ISS%20biomass.pdf', accessed: '2026-11-16',
    locator: 'S. 1 Abstract; S. 2–3 Materials and Methods; S. 8–9 Discussion',
    kind: 'Wissenschaftliche Messung', access: 'Originalvolltext gelesen', product: '26 Kulturen, gemischte Frischmasse',
    region: 'Neumayer III, Antarktis', period: '2018; 286 Tage',
    boundary: '12,5 m² Anbaufläche, 268 kg essbare Frischmasse im Experiment. Jahresnormalisierung 27,4 kg/(m²·Jahr), kein vollständig gemessenes Kalenderjahr.',
    limitations: ['Gemeinsames Kompromissklima; keine Optimierung jeder Kultur.', 'Ein historisches Raumfahrt-Experiment bildet keinen kommerziellen NRW-Betrieb ab.'],
    findings: ['Räumlich getrennte Anbau- und Servicebereiche.', '56 kg Kopfsalat, 49 kg Blattgemüse und 12 kg Kräuter verdeutlichen die Mischkultur.'],
  },
  {
    id: 'dlrresources2020', short: 'Zeidler et al. 2020', label: 'EDEN ISS · externe Stoffe',
    title: 'Resource Consumption and Waste Production of the EDEN ISS Space Greenhouse Analogue during the 2018 Experiment Phase in Antarctica',
    authors: 'Zeidler, C.; Vrakking, V.; Zabel, P.; Bamsey, M.; Schubert, D.', year: 2020,
    url: 'https://elib.dlr.de/135883/', accessed: '2026-11-16', locator: 'Abstract im DLR-Repositorium',
    kind: 'Wissenschaftliche Konferenzpublikation', access: 'Nur Abstract zugänglich; identische freie Vollfassung nicht gefunden',
    product: 'Gemischte Kulturen', region: 'Antarktis', period: 'Versuch 2018',
    boundary: 'Verbrauchsmittel und Abfälle während des Experiments; Details der Wasserfunktionen im Abstract nicht vollständig prüfbar.',
    limitations: ['Kein Liter-pro-kg-Standard und kein Eingangswert des Rechners.', 'Volltext nicht zugänglich; nur qualitative Verwendung.'],
    findings: ['Mineralsalze, Frischwasser und Reinigungsmittel müssen zugeführt werden; Abwasser und Reststoffe verlassen das System.'],
  },
  {
    id: 'fraunhofer', short: 'Fraunhofer UMSICHT', label: 'inFARMING · Oberhausen',
    title: 'inFARMING: Gebäudeintegrierte Landwirtschaft',
    authors: 'Fraunhofer-Institut UMSICHT', year: null,
    url: 'https://www.umsicht.fraunhofer.de/de/projekte/infarming.html', accessed: '2026-11-16',
    locator: 'Projektziele; Nutzen; Ergebnis: ALTMARKTgarten Oberhausen',
    kind: 'Projektbeschreibung des beteiligten Forschungsinstituts', access: 'Originalseite gelesen',
    product: 'Verschiedene Gemüsearten im Dachgewächshaus', region: 'Oberhausen, Nordrhein-Westfalen',
    period: 'Bauprojekt Dezember 2015–Dezember 2019; Forschung seit Dezember 2019',
    boundary: 'Gebäudeintegration, Dächer, Abwärme, Wasseraufbereitung, Vermarktung und gesellschaftliche Akzeptanz.',
    limitations: ['Sonnenlichtnutzendes Dachgewächshaus, keine rein künstlich beleuchtete Pflanzenfabrik.', 'Qualitative Potentialbeschreibung; keine veröffentlichte vergleichende Betriebsbilanz und keine pauschale Einsparquote.'],
    findings: ['Standortnutzen kann aus passender Gebäude- und Infrastrukturkopplung entstehen.', 'Hydroponik beschreibt Nährlösung statt Erde; sie setzt weder künstliches Licht noch mehrere Ebenen voraus.'],
  },
  {
    id: 'altmarkt2019', short: 'Fraunhofer UMSICHT 2019', label: 'ALTMARKTgarten · Detail',
    title: 'Experimentierfeld für urbane Landwirtschaft', authors: 'Fraunhofer-Institut UMSICHT', year: 2019,
    url: 'https://www.umsicht.fraunhofer.de/de/presse-medien/pressemitteilungen/2019/einweihung-altmarktgarten-oberhausen.html', accessed: '2026-11-16',
    locator: 'Anbau in verschiedenen Klimazonen; Das Gebäude als Ressource',
    kind: 'Presseinformation des Projektpartners', access: 'Originalseite gelesen', product: 'Gemüse im Dachgewächshaus', region: 'Oberhausen, NRW', period: 'Einweihung 26.09.2019',
    boundary: 'Mehr als 1.000 m² Nutzfläche, darunter 160 m² Forschung und Entwicklung; mehrere Anbau- und Klimazonen.',
    limitations: ['Nutzfläche ist nicht automatisch Gebäudegrundfläche oder netto bepflanzte Fläche.', '2019 angekündigte Erprobung belegt keine flächendeckende kommerzielle Umsetzung 2026.'],
    findings: ['Abwärme und aufbereitetes Grauwasser werden im Forschungsbereich erprobt.', 'Gebäudeintegrierte Lösungen benötigen eine konkrete Standortprüfung.'],
  },
  {
    id: 'uba2026', short: 'UBA 2026 · Strommix 2025', label: 'Strom · Deutschland',
    title: 'Entwicklung der spezifischen Treibhausgas-Emissionen des deutschen Strommix in den Jahren 1990–2025',
    authors: 'Icha, P.; Lauf, T. / Umweltbundesamt', year: 2026,
    url: 'https://www.umweltbundesamt.de/system/files/medien/11850/publikationen/2026-03/16_2026_CC.pdf', accessed: '2026-11-16',
    locator: 'Climate Change 16/2026, Tabelle 1 S. 11–12; Tabelle 2 S. 16; Methoden S. 18–22',
    kind: 'Behördliche Berechnung aus Inventar-/Energiestatistik und Vorkettenmodellen', access: 'Originalvolltext gelesen',
    product: 'Strom, kein Lebensmittel', region: 'Deutschland', period: '2025 geschätzt; Stand März 2026',
    boundary: '406 g CO₂eq/kWh einschließlich Stromvorketten; kein zeitlich aufgelöster Grenzstrom und kein betriebsspezifischer Liefervertrag.',
    limitations: ['Ein historischer Referenzfaktor ist keine Prognose für 2040.', 'Jährliche Revisionen möglich. Direkte CO₂-Werte und CO₂eq mit Vorketten nicht verwechseln oder addieren.', 'Stromverbrauch × Faktor ist nur der Strombeitrag, keine vollständige Gemüse-Ökobilanz.'],
    findings: ['2025 geschätzt: 344 g CO₂/kWh direkt; 352 g CO₂eq/kWh ohne Vorketten; 406 g CO₂eq/kWh mit Vorketten.', 'Die ältere Schätzung 363 g CO₂/kWh für 2024 wurde 2026 auf 353 revidiert.'],
  },
  {
    id: 'blom2022', short: 'Blom et al. 2022 · Niederlande', label: 'Referenz · Gewächshaus / Freiland',
    title: 'The embodied carbon emissions of lettuce production in vertical farming, greenhouse horticulture, and open-field farming in the Netherlands',
    authors: 'Blom, T.; Jenkins, A.; Pulselli, R. M.; van den Dobbelsteen, A. A. J. F.', year: 2022,
    url: 'https://doi.org/10.1016/j.jclepro.2022.134443', accessed: '2026-11-16',
    doi: '10.1016/j.jclepro.2022.134443', fulltextUrl: 'https://repository.tudelft.nl/file/File_a6e9eca0-5d85-42f7-8224-8d5e8d3327d6',
    locator: 'Artikelseite 3, Abschnitte 2.1.1–2.1.2 und Abb. 2; Anhang Tabellen C.1 (S. 13), C.2 (S. 14). PDF im TU-Delft-Repositorium mit zusätzlichem Titelblatt.',
    kind: 'Vergleichende Lebenszyklusanalyse mit Datenbank- und Literaturreferenzen', access: 'Originalvolltext gelesen',
    product: 'Butterhead lettuce (Kopfsalat), Frischmasse', region: 'Niederlande',
    period: 'Referenzdaten Freiland 1985/2009, Gewächshaus 2019; Wasser Freiland 2014. Veröffentlichung 2022.',
    boundary: 'Erträge je m² Bruttogrundfläche und Jahr; Freiland 3 Zyklen/Jahr. Gewächshaus bodengebunden, ohne Zusatzlicht, mit Erdgasheizung. Wasser ist Bewässerungszufuhr; Freiland ausdrücklich ohne Niederschlag.',
    limitations: ['Referenzvergleich mit älteren Eingangsdaten; keine Erhebung in NRW 2040.', 'Kopfsalat der Referenz ist nicht identisch mit den verschiedenen Salaten des VF-Reviews.', 'Netto-Anbauflächen sind hier nicht ausgewiesen; kein zusätzlicher Nutzflächenfaktor auf die Bruttoerträge.', 'Die App übernimmt keine LCA-Endwerte als Strombeitrag. Vergleichsenergie, Stromkosten und Emissionen bleiben wegen verschiedener Bilanzgrenzen offen.', 'Bewässerungszufuhr ist kein vollständiger Wasserfußabdruck; Regen fehlt beim Freiland.', 'Tabelle C.3 nennt für das andere, hydroponische Gewächshaus 1,540 L/kg, ihre Herleitung ergibt 15,4. Wegen dieser bestätigten Faktor-10-Inkonsistenz wird dieser Wert nicht verwendet.'],
    findings: ['Bodengewächshaus: 29,05 kg/(m² Grundfläche·Jahr), Bewässerung 19 L/kg.', 'Freiland: 8,9 kg/(m² Grundfläche·Jahr), Bewässerung 15,1 L/kg ohne Niederschlag; drei jährliche Salatzyklen.', 'Jahresmengen verdecken saisonale Verfügbarkeit; die Freilandproduktion ist nicht ganzjährig.'],
  },
  {
    id: 'barbosa2015', short: 'Barbosa et al. 2015', label: 'Weitere Referenz · Arizona',
    title: 'Comparison of Land, Water, and Energy Requirements of Lettuce Grown Using Hydroponic vs. Conventional Agricultural Methods',
    authors: 'Barbosa, G. L. et al.', year: 2015,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4483736/', accessed: '2026-11-16',
    locator: 'Tabelle 1; Abschnitte Methods/Discussion', kind: 'Modellierter Gewächshausvergleich und Agrarstatistik', access: 'Originalvolltext gelesen',
    product: 'Salat, Frischmasse', region: 'Yuma, Arizona, USA', period: 'Freilandstatistik 2003–2012; Veröffentlichung 2015',
    boundary: 'Hydroponisches hypothetisches Gewächshaus mit zwölf Ernten/Jahr gegenüber einer Salaternte/Jahr auf Freiland. Direkte Energie enthält unterschiedliche Energieträger.',
    limitations: ['Warmes arides Klima und unterschiedliche Anbauzyklen; deshalb nicht die Hauptreferenz der Anwendung.', 'Kein Zusatzdatensatz für den niederländischen Hauptvergleich; Werte werden nicht vermischt.', 'Gesamtenergie ist kein reiner Strombedarf und keine vollständige Ökobilanz.'],
    findings: ['Der Klimaraum und die Anzahl jährlicher Ernten beeinflussen Vergleichsergebnisse erheblich.', 'Die App wählt für den Hauptvergleich die klimatisch näheren niederländischen Referenzen von Blom et al.'],
  },
  {
    id: 'regional', short: 'BLE / BZL 2026', label: 'Behauptungsprüfung · Regionalität',
    title: 'Wie kann ich klimabewusst einkaufen?', authors: 'Bundesinformationszentrum Landwirtschaft / Bundesanstalt für Landwirtschaft und Ernährung', year: 2026,
    url: 'https://www.landwirtschaft.de/einkauf/einkaufstipps/regional-und-saisonal/wie-kann-ich-klimabewusst-einkaufen', accessed: '2026-11-16',
    locator: 'Klimabilanz Gemüse: Beispiel Tomaten; Unser Einkaufsverhalten entscheidet mit',
    kind: 'Staatliche Verbraucherinformation', access: 'Originalseite gelesen', product: 'Gemüse; Beispiel Tomaten', region: 'Deutschland / Importe aus Spanien', period: 'Aktualisiert 30.07.2026',
    boundary: 'Qualitative Einordnung von Heizenergie, Transport, Saisonalität und Einkaufsverhalten.',
    limitations: ['Keine eigene Salat-LCA; Tomatenzahlen werden nicht in den Salatvergleich übertragen.', 'Wasserknappheit ist ein zusätzlicher Zielkonflikt neben Treibhausgasen.'],
    findings: ['Regional ist nicht automatisch klimafreundlich: Beheizte Winterproduktion kann trotz kurzer Wege ungünstiger sein.', 'Produktionsweise, Energieversorgung und Saison müssen mit den Transportwegen geprüft werden.'],
  },
  {
    id: 'scenario', short: 'Eigene Modellannahme', label: 'Szenariomodell · 2040',
    title: 'Offengelegte Annahmen des Stadtlabors 2040', authors: 'Stadtlabor 2040', year: 2026,
    url: '#modellgrenzen', accessed: '2026-11-16', locator: 'Eingaberegister und Formeln im Projekt; keine empirische Betriebsquelle',
    kind: 'Didaktisches Jahres-Szenariomodell', access: 'Vollständig lokal dokumentiert', product: 'Salat, essbare Frischmasse',
    region: 'Hypothetischer Standort in NRW', period: 'Planungshorizont 2040; Annahmenstand 16.11.2026',
    boundary: 'Geometrie, Ertrag und Ressourcen werden linear verknüpft. Gesamter angenommener Energiebedarf wird vereinfachend als Strom behandelt, einschließlich Klima und Pumpen.',
    limitations: ['Keine Kalibrierung oder Validierung an einem konkreten Betrieb.', 'Keine quantitative Licht-/Temperatur-/Wachstumsfunktion; mehr Ebenen verbessern nicht die Effizienz je kg.', 'Stromkosten sind ein Teilbetrag, Stromemissionen eine Teilbilanz. Bau, Personal, Saatgut, Dünger, Ausschuss und Lieferketten sind nicht vollständig bilanziert.'],
    findings: ['Alle Szenarien sind reproduzierbar und veränderbar.', 'Annahmen sind keine Messwerte und keine Prognose für das Jahr 2040.'],
  },
];

export const getSource = (id: string): Source | undefined => sources.find((source) => source.id === id);

export interface Datum {
  id: string;
  label: string;
  value: number;
  unit: string;
  basis: string;
  product: string;
  region: string;
  dataYear: string;
  publicationYear: number | null;
  sourceId: string;
  locator: string;
  nature: string;
  boundary: string;
  uncertainty: string;
  kind: 'source' | 'assumption' | 'derived';
}

const assumption = (id: string, label: string, value: number, unit: string, basis: string, boundary: string, uncertainty: string): Datum => ({
  id, label, value, unit, basis, product: 'Salat, essbare Frischmasse', region: 'Hypothetischer Standort in NRW',
  dataYear: 'Szenario 2040; Annahmenstand 2026', publicationYear: 2026, sourceId: 'scenario',
  locator: 'Offengelegte Eingabeannahme; kein gemessener Betrieb', nature: 'Veränderbare Modellannahme', boundary, uncertainty, kind: 'assumption',
});

/** Einzige Definition der Basiseingaben; UI und Rechnung lesen dieselben Werte. */
export const inputData = {
  footprint: assumption('footprint', 'Gebäudegrundfläche', 1000, 'm²', 'Horizontale Gebäudegrundfläche', 'Ganze Gebäudegrundfläche einschließlich Gängen und Technik; zusätzliche externe Infrastruktur nicht erfasst.', 'Kein ausgewähltes Grundstück; Tragfähigkeit und Baurecht ungeprüft.'),
  usable: assumption('usable', 'Nutzbarer Flächenanteil', 0.65, 'Anteil', 'Pro Gebäudegrundfläche und Ebene', 'Nur bepflanzbare Fläche; Gänge, Technik und Erntebereich werden über den Restanteil berücksichtigt.', 'Gleicher Anteil auf allen Ebenen; keine konkrete Regalplanung.'),
  levels: assumption('levels', 'Anbauebenen', 4, 'Ebenen', 'Gestapelte bepflanzte Ebenen', 'Gleiche nutzbare Anbaufläche auf jeder Ebene.', 'Raumhöhe, Statik und Zugang setzen reale Grenzen.'),
  yieldPerArea: assumption('yieldPerArea', 'Angenommener Jahresertrag', 60, 'kg/(m²·Jahr)', 'Je m² summierter Anbaufläche, Frischmasse', 'Jahreswert ohne getrennt modellierte Ausfälle; gerundet in der Größenordnung des wissenschaftlichen Gruppenmittels aus Pennisi et al. 2025, Abb. 2.', 'Keine garantierte Leistung; unabhängige Kombination mit Energie- und Wasserannahmen.'),
  energyPerKg: assumption('energyPerKg', 'Angenommener Energiebedarf', 10, 'kWh/kg', 'Je kg Ernte', 'Umfasst Beleuchtung, Klima und Pumpen; vollständig als Strom behandelt. Kein zusätzlicher Technikaufschlag.', 'Runde Szenarioannahme, nicht der Mittelwert des Energiebedarfs und nicht aus 1/Mittelwert(Energieeffizienz) bestimmt.'),
  electricityPrice: assumption('electricityPrice', 'Angenommener Strompreis', 0.25, '€/kWh', 'Je bezogene kWh', 'Vereinfachter konstanter Arbeitspreis; keine Leistungsentgelte, Steuern-/Vertragsprognose oder Investitionskosten.', 'Kein Angebot eines Versorgers und keine Preisprognose 2040.'),
  gridFactor: {
    id: 'gridFactor', label: 'Emissionsfaktor des Stroms', value: 0.406, unit: 'kg CO₂eq/kWh', basis: 'Je verbrauchte kWh Strom',
    product: 'Deutscher Strommix', region: 'Deutschland', dataYear: '2025, geschätzt; Stand März 2026', publicationYear: 2026,
    sourceId: 'uba2026', locator: 'Tabelle 2, S. 16, Treibhausgase einschließlich Vorketten', nature: 'Behördlicher Schätzwert; im Szenario veränderbar',
    boundary: 'Strombereitstellung einschließlich Vorketten; keine gesamte Lebensmittelbilanz.',
    uncertainty: 'Historischer nationaler Durchschnitt, revisionsfähig; keine Prognose für 2040 oder Garantie eines Liefervertrags.', kind: 'source',
  } satisfies Datum,
  waterPerKg: assumption('waterPerKg', 'Angenommene Frischwasserzufuhr', 7, 'L/kg', 'Zusätzliches Bewässerungswasser je kg Ernte', 'Frischwasserzusatz für den Anbau nach Rückgewinnung; ohne Reinigung, Anlagenherstellung und indirektes Wasser der Stromerzeugung.', 'Bewusst gewählte Szenarioannahme, kein universeller Quellenwert und kein vollständiger Wasserfußabdruck.'),
};

const fromSource = (id: string, label: string, value: number, unit: string, sourceId: string, locator: string, basis: string, dataYear: string, boundary: string, uncertainty: string): Datum => {
  const source = getSource(sourceId)!;
  return { id, label, value, unit, sourceId, locator, basis, product: source.product, region: source.region, dataYear, publicationYear: source.year, boundary, uncertainty, nature: source.kind, kind: 'source' };
};

export const evidenceData: Datum[] = [
  fromSource('yield-science', 'VF-Ertrag wissenschaftlicher Angaben', 59.7, 'kg/(m²·Jahr)', 'pennisi2025', 'Abb. 2, S. 4; n = 54', 'Je m² Anbaufläche; Frischmasse', 'Heterogene Studien vor 2025', 'Gruppenmittel wissenschaftlicher Studien.', 'Keine natürliche Untergrenze; Mittelwert nicht garantierte Anlagenleistung.'),
  fromSource('yield-business', 'VF-Ertrag Unternehmensangaben', 105.2, 'kg/(m²·Jahr)', 'pennisi2025', 'Abb. 2, S. 4; n = 32', 'Je m² Anbaufläche; Frischmasse', 'Heterogene Angaben vor 2025', 'Gruppenmittel der Unternehmensangaben.', 'Keine natürliche Obergrenze; mögliche selektive Veröffentlichung.'),
  fromSource('eue-science', 'Energieeffizienz wissenschaftlicher Angaben', 0.13, 'kg/kWh', 'pennisi2025', 'Abb. 3, S. 5; n = 34', 'Frischmasse pro Gesamtenergie', 'Heterogene Studien vor 2025', 'Ganzer Pflanzenzyklus einschließlich Nichtlicht-Verbrauchern.', 'Kehrwert des Mittels ist nicht der Mittelwert der Kehrwerte.'),
  fromSource('eue-business', 'Energieeffizienz Unternehmensangaben', 0.08, 'kg/kWh', 'pennisi2025', 'Abb. 3, S. 5; n = 6', 'Frischmasse pro Gesamtenergie', 'Heterogene Angaben vor 2025', 'Gruppenmittel; ganze Produktionsphase.', 'Kleine, nicht repräsentative Stichprobe; kein allgemeiner Grenzwert.'),
  fromSource('water-efficiency', 'VF-Wassereffizienz im Review', 140.7, 'g/L', 'pennisi2025', '§ 7 / Abb. 8, S. 11–12; n = 88; im Material rund 140', 'Erntbare Salatfrischmasse pro zugeführtem Bewässerungswasser', 'Heterogene Studien vor 2025', 'Wasserzufuhr durch Bewässerung; kein vollständiger Wasserfußabdruck.', 'Große Streuung; Herstellerdaten-basierter Ausreißer. Kehrwert eines Mittelwerts ist kein mittlerer Literbedarf. Nicht Quelle der 7-L/kg-Szenarioannahme.'),
  fromSource('eden-harvest', 'EDEN ISS Ernte im Versuch', 268, 'kg', 'dlr2020', 'Abstract S. 1 / Discussion S. 8–9', 'Essbare Frischmasse verschiedener Kulturen im gesamten Versuch', '2018; 286 Tage', 'Historische antarktische Forschungsanlage; kein vollständiges Kalenderjahr.', 'Mischkultur; keine Salat- oder NRW-Rentabilitätsgarantie.'),
  fromSource('eden-area', 'EDEN ISS Anbaufläche', 12.5, 'm²', 'dlr2020', 'Materials and Methods S. 2–3', 'Summierte Kulturfläche, nicht Gebäudegrundfläche', '2018', 'Anbaubereich der antarktischen Forschungsanlage.', 'Service- und Technikflächen sind hiervon getrennt.'),
  fromSource('eden-power', 'EDEN ISS mittlere Leistungsaufnahme', 0.8, 'kW/m²', 'dlr2019', 'Abschnitt Genug Nahrung für sechsköpfige Crew', 'Mittlere Leistung je m² Anbaufläche', 'Versuch 2018', 'Forschungsanlage am Extremstandort; Leistungsangabe.', 'kW sind keine kWh; kein direkt übernommener Jahres- oder kg-Energiebedarf.'),
  fromSource('gh-yield', 'Gewächshausertrag NL', 29.05, 'kg/(m²·Jahr)', 'blom2022', 'S. 3, Abschnitt 2.1.2; Abb. 2', 'Je m² Bruttogrundfläche; Kopfsalatfrischmasse', 'Referenzdaten 2019', 'Bodengewächshaus, Sonnenlicht, ohne Zusatzlicht; beheizt.', 'Referenzdaten, keine heutige NRW-Prognose; Netto-Anbaufläche nicht ausgewiesen.'),
  fromSource('field-yield', 'Freilandertrag NL', 8.9, 'kg/(m²·Jahr)', 'blom2022', 'S. 3, Abschnitt 2.1.1; Abb. 2', 'Je m² Bruttogrundfläche; Kopfsalatfrischmasse', 'Referenzen 1985/2009', 'Drei Salatzyklen pro Jahr; gerundeter Literaturwert.', 'Saisonale Ernte; keine ganzjährige tägliche Versorgung.'),
  fromSource('gh-water', 'Bewässerungszufuhr Gewächshaus NL', 19, 'L/kg', 'blom2022', 'Tabelle C.2, Artikelseite 14', 'Bewässerung je kg Kopfsalatfrischmasse', 'Referenzdaten 2019', 'Direkte Bewässerungszufuhr des bodengebundenen Gewächshauses.', 'Kein gesamter Wasserfußabdruck; andere Grenze als ein Betrieb mit vollständiger Verbrauchsmittelbilanz.'),
  fromSource('field-water', 'Bewässerungszufuhr Freiland NL', 15.1, 'L/kg', 'blom2022', 'Tabelle C.1, Artikelseite 13', 'Bewässerung je kg Kopfsalatfrischmasse', 'Wasserreferenz Breukers et al. 2014', 'Zusätzliche Bewässerung; Niederschlag ausdrücklich ausgeschlossen.', 'Regenwasser fehlt; kein gesamter Wasserverbrauch und keine pauschale Aussage zur Wasserknappheit.'),
];

export const dataCatalog: Datum[] = [...Object.values(inputData), ...evidenceData];
export const getDatum = (id: string): Datum | undefined => dataCatalog.find((datum) => datum.id === id);

export const RESULT_META = {
  cultivationArea: { label: 'Anbaufläche', unit: 'm²', formula: 'Grundfläche × nutzbarer Anteil × Ebenen', boundary: 'Summierte bepflanzte Fläche; keine weitere Bodenfläche.' },
  harvest: { label: 'Jährliche Ernte', unit: 'kg/Jahr', formula: 'Anbaufläche × angenommener Jahresertrag', boundary: 'Erntemenge im Szenario; nicht automatisch verkaufte Menge.' },
  energy: { label: 'Energiebedarf, als Strom behandelt', unit: 'kWh/Jahr', formula: 'Ernte × Energiebedarf je kg', boundary: 'Inklusive Klima und Pumpen; keine doppelte Addition.' },
  water: { label: 'Frischwasserzufuhr', unit: 'L/Jahr', formula: 'Ernte × angenommene Bewässerungszufuhr je kg', boundary: 'Ohne Reinigung, Anlagenfertigung und indirektes Wasser.' },
  electricityCost: { label: 'Stromkosten', unit: '€/Jahr', formula: 'Energiebedarf × Strompreis', boundary: 'Teilbetrag der Produktionskosten.' },
  electricityPerKg: { label: 'Stromkosten je kg', unit: '€/kg', formula: 'Energiebedarf je kg × Strompreis', boundary: 'Keine Vollkosten und kein Verkaufspreis.' },
  emissions: { label: 'Strombedingter Emissionsbeitrag', unit: 'kg CO₂eq/Jahr', formula: 'Energiebedarf × Stromfaktor', boundary: 'Mit Stromvorketten; keine vollständige Gemüse-Klimabilanz.' },
  emissionsPerKg: { label: 'Strombeitrag je kg', unit: 'kg CO₂eq/kg', formula: 'Energiebedarf je kg × Stromfaktor', boundary: 'Bau, Dünger, Verpackung, Logistik u. a. fehlen.' },
} as const;
