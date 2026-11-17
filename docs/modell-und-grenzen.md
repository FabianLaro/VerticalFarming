# Das Szenariomodell und seine Grenzen

Stand 16.11.2026. Das Modell beantwortet: **Was folgt rechnerisch aus offengelegten Annahmen?** Es ist nicht an einem konkreten Betrieb kalibriert und validiert. „2040“ bezeichnet den Entscheidungshorizont, keine Vorhersage von Technik, Preisen oder Stromversorgung.

## Einheitliches Datenregister

`src/data/catalog.ts` enthält die Basiseingaben und Literaturwerte jeweils mit Wert, Einheit, Bezugsgröße, Produkt, Region, Daten- und Publikationsjahr, Quelle, Fundstelle, Datentyp, Systemgrenze und Unsicherheit. Quellen enthalten zusätzlich URL, Abrufdatum und Zugangsstatus. Die Kennzeichnungen unterscheiden **Quellenwert**, **Annahme** und **abgeleitetes Ergebnis**. `src/lib/model.ts` liest diese Daten; Oberfläche, Diagramme und Druck verwenden dieselben Ergebnisse. Im Belegbereich lässt sich das Register als JSON speichern.

## Die acht Basiseingaben

| Eingabe | Basis | Einordnung |
|---|---:|---|
| Gebäudegrundfläche | 1.000 m² | Hypothetischer Standort; keine Grundstücksprüfung |
| Nutzbarer Anteil je Ebene | 65 % | Rest für Wege, Technik und Ernte; keine konkrete Ausführungsplanung |
| Bepflanzte Ebenen | 4 | Gleicher Flächenanteil auf jeder Ebene |
| Jahresertrag je Anbaufläche | 60 kg/(m²·Jahr) | Runde Annahme nahe einem Reviewmittel; keine Leistungsgarantie |
| Energiebedarf je Ernte | 10 kWh/kg | Runde Annahme einschließlich Licht, Klima und Pumpen |
| Strompreis | 0,25 €/kWh | Konstanter angenommener Arbeitspreis, kein Tarifangebot |
| Stromfaktor | 0,406 kg CO₂eq/kWh | UBA 2026, geschätzter deutscher Strommix 2025 mit Vorketten |
| Frischwasserzusatz | 7 L/kg | Frei gewählte Anbauannahme; ohne Reinigung und Vorketten |

Ertrag, Energie und Wasser werden unabhängig angenommen. Die Kombination ist **kein tatsächlich beobachteter Betrieb**. 7 L/kg wird insbesondere nicht als Kehrwert eines mittleren Reviewwerts ausgegeben.

## Formeln und unabhängig nachrechenbares Beispiel

`a` bedeutet Jahr. Die Energie wird im vereinfachten Jahresmodell vollständig als Strom behandelt.

| Größe | Rechnung mit Basiswerten | Ergebnis |
|---|---|---:|
| Summierte Anbaufläche | 1.000 m² × 0,65 × 4 | **2.600 m²** |
| Jahresernte | 2.600 m² × 60 kg/(m²·a) | **156.000 kg/a = 156 t/a** |
| Energie | 156.000 kg/a × 10 kWh/kg | **1.560.000 kWh/a = 1,56 GWh/a** |
| Frischwasserzusatz | 156.000 kg/a × 7 L/kg | **1.092.000 L/a = 1.092 m³/a** |
| Stromkosten | 1.560.000 kWh/a × 0,25 €/kWh | **390.000 €/a** |
| Stromkosten je kg | 10 kWh/kg × 0,25 €/kWh | **2,50 €/kg** |
| Strombedingter Emissionsbeitrag | 1.560.000 kWh/a × 0,406 kg CO₂eq/kWh | **633.360 kg CO₂eq/a = 633,36 t/a** |
| Strombeitrag je kg | 10 kWh/kg × 0,406 kg CO₂eq/kWh | **4,06 kg CO₂eq/kg** |

Stromkosten sind weder Produktionsvollkosten noch Verkaufspreis. Der Emissionswert umfasst den modellierten Strom einschließlich seiner Vorketten, aber keine vollständige Klimabilanz der Lebensmittelproduktion. Klima und Pumpen werden **nicht nochmals addiert**.

Der mathematische Kern akzeptiert für Grenzprüfungen auch Nullwerte. Null Fläche oder Nullertrag ergibt Null Jahresmengen; die je-kg-Werte bleiben dabei die eingegebenen Intensitäten, keine empirischen Quotienten aus einer Nullernte. Negative, nicht endliche, übergroße und ungültige Anteil-/Ebeneneingaben werden abgefangen. Die Oberfläche begrenzt die Regler enger auf sinnvolle Unterrichtsszenarien.

## Veränderung und Sensitivität

Jedes vorbereitete Szenario beginnt bei der **vollständigen Basis** und verändert nur die ausdrücklich genannte Eingabe. Eigene Regleränderungen lassen alle anderen Eingaben konstant. Die Sensitivität verändert jeweils einen Parameter bei unverändertem übrigen aktuellem Stand.

- **Sechs statt vier Ebenen:** Anbaufläche, Ernte, Gesamtenergie, Wasser, Stromkosten und Emissionen steigen bei sonst gleichen Annahmen um 50 %. Energie je kg verbessert sich nicht.
- **0,40 statt 0,25 €/kWh:** Nur Stromkosten steigen; Ernte, Energie und Emissionen bleiben gleich.
- **0,05 statt 0,406 kg CO₂eq/kWh:** Nur der Strombeitrag sinkt. Der niedrige Wert ist eine explorative Annahme, kein Liefernachweis und keine Klimaneutralität.
- **7 statt 10 kWh/kg:** Energie, Stromkosten und Strombeitrag sinken um 30 %. Die Ernte bleibt gleich; eine solche technische Verbesserung wird durch den Regler nicht empirisch bewiesen.

Eine quantitative Licht-/Temperatur-/Wachstumsfunktion fehlt bewusst: Dafür wäre ein passendes biologisches Modell nötig. Licht, Wärme und Wachstum werden qualitativ erklärt. Das lineare Modell bildet Engpässe wie Netzanschluss, Raumhöhe, Arbeitszeit, Ausfälle oder Absatzgrenzen nicht selbstständig ab.

## Faire Vergleichsperspektiven

1. **Gleiche Grundfläche:** VF-Ernte = Grundfläche × Nutzanteil × Ebenen × Jahresertrag. Referenzernten = Grundfläche × veröffentlichter Ertrag je Bruttogrundfläche.
2. **Gleiche Jahresernte:** Grundfläche = Zielernte ÷ Jahresertrag je Grundfläche. Für VF enthält dieser Nenner Nutzanteil und Ebenenzahl. Die Vergleichsfläche wird nicht auf die Grenzen des VF-Eingabereglers beschnitten.

Hauptreferenz ist [Blom et al. 2022](https://doi.org/10.1016/j.jclepro.2022.134443), Methoden und Anhang C. Bodengebundenes niederländisches Kopfsalatgewächshaus: 29,05 kg/(m² Grundfläche·a), 19 L Bewässerung/kg, erdgasbeheizt, ohne Zusatzlicht; Ausgangsdaten 2019. Niederländisches Freiland: 8,9 kg/(m² Grundfläche·a), drei saisonale Zyklen, 15,1 L zusätzliche Bewässerung/kg **ohne Regen**; ältere Ertragsquellen 1985/2009, Wasserreferenz 2014. Auf diese Bruttoerträge wird kein zweiter Nutzflächenabzug angewendet.

Die App verbindet diese Referenzen mit einem frei gewählten VF-Szenario. Das ist keine harmonisierte NRW-Prognose. Kulturtypen, Erhebungsjahre, Klimaraum und Produktionsweise unterscheiden sich. Wasserzufuhr ist kein kompletter Wasserfußabdruck. Vergleichbare Energiesummen fehlen; Heizgas ist kein Strom. Daher bleiben Energie-, Kosten- und Klima-Lücken offen, statt sie mit Null oder unpassenden Literaturwerten zu füllen. Eine im Original gefundene Faktor-10-Inkonsistenz zum anderen hydroponischen Gewächshaus wird dokumentiert und nicht übernommen.

Diagramme nutzen einen gemeinsamen Maßstab. Bei Quadratflächen entspricht die Seitenlänge der Quadratwurzel der Fläche. Die getrennt eingepassten 3D-Dioramen sind schematische Lernmodelle und ausdrücklich kein maßstabsgleicher Flächenvergleich. Jahresmengen belegen keine gleichmäßige tägliche Verfügbarkeit.

## Quellenkritik und Grenzen des Urteils

- **Pennisi et al. 2025:** Gruppenmittel wissenschaftlicher Studien und Unternehmensangaben sind keine natürlichen Unter-/Obergrenzen. Der Kehrwert mittlerer kg/kWh ist nicht der mittlere kWh/kg-Bedarf. Unabhängige Stichproben ergeben gemeinsam keinen Betrieb.
- **EDEN ISS:** Historische Mischkulturen und Raumfahrtforschung an einem Extremstandort; Anbaufläche ist nicht Gebäudegrundfläche. 0,8 kW/m² beschreibt Leistung. Daraus folgt keine heutige Rentabilität in NRW.
- **ALTMARKTgarten:** Sonnenlichtnutzendes Dachgewächshaus mit Gebäudeintegration; kein Leistungsnachweis einer dunklen Pflanzenfabrik. Projektkommunikation beschreibt Potentiale, keine pauschalen Einsparquoten.
- **Strommix:** Der geschätzte nationale Faktor 2025 ist revisionsfähig, kein stündlicher Grenzstrom und keine 2040-Prognose. Direkte CO₂-Werte dürfen nicht mit CO₂eq einschließlich Vorketten verwechselt oder addiert werden.
- **Regionalität:** Kurze Wege allein garantieren keinen Klimavorteil. Produktionsweise, Saison, Energieversorgung, Lagerung und Transportart gehören in eine vollständige Prüfung.

Nicht vollständig erfasst sind Anlagenbau, Vorprodukte, Dünger, Reinigung, Ausschuss, Personal, Finanzierung, Miete, Wartung, Verteilungswirkungen, Lieferketten und externer Flächenbedarf der Energieversorgung. Blattgemüse ist ein Ernährungsausschnitt, keine Vollversorgung.

Die Förderoptionen und fünf Kriterien stammen aus dem Unterrichtsdossier. Zwei Prioritäten, Symbole und Empfehlung sind begründbare **Werturteile**, keine Messwerte. Die Beispielposition B lässt sich ändern. Für eine reale Entscheidung wären lokale Vollkosten, Absatznachweise, gemessene Energie- und Stoffbilanzen sowie eine vollständige vergleichende Ökobilanz erforderlich.

