# Bestandsaudit vor der gestalterischen Überarbeitung

Stand: 16.11.2026. Untersucht wurden die lokale Produktionsfassung auf Port 4173, der Komponentenaufbau und frische Ansichten mit 1.440 × 900, 820 × 1.180 und 390 × 844 Pixeln. Messdaten und Ausgangsbilder: `tmp/design-audit`.

Die folgenden Muster beschreiben einen generischen, vorlagenartigen Eindruck. Sie sind **kein Nachweis einer KI-Urheberschaft**. Für die Internetquellen und deren Aussagegrenzen siehe die separate Designrecherche. Beurteilt wird hier, ob Gestaltung und Informationsmenge der konkreten Lern- und Entscheidungsaufgabe dienen.

## Wichtigste Beobachtung

Die Anwendung ist ein wissenschaftliches Arbeitsmittel, verhält sich im Aufbau aber häufig wie eine Produkt-Landingpage. Große Einleitung, nummerierte Mikro-Labels, dekorative Statusanzeige, zweite Bildbühne und mehrere prägnante Statement-Überschriften konkurrieren mit dem eigentlichen Modell. Die eigenen Blender-Modelle, nachprüfbaren Rechnungen und Quellen bilden bereits einen eigenständigen Kern; dieser muss früher und deutlicher sichtbar werden.

## Konkrete Befunde

| Beobachtung | Fundort im Ausgangsstand | Auswirkung | Kleinste vernünftige Verbesserung |
|---|---|---|---|
| Derselbe große Frage-Hero erscheint in allen vier Bereichen | `App.tsx`, `.page-heading` vor der gemeinsamen Navigation | Wiederholte Einleitung verdrängt jede konkrete Aufgabe nach unten | Entscheidungsfrage einmal im kompakten Projektkopf; pro Bereich eine konkrete kurze Überschrift oder direkte Arbeitsfläche |
| Marke, Kontext und Jahreszahl wiederholen sich mehrfach | Header, Eyebrow, Hero, Statusbadge und Footer | Metainformation bekommt ähnlich viel Gewicht wie fachliche Inhalte | Eine klare Wortmarke; Kontext einmal, zusätzliche Schmucklabels entfernen |
| Viele kleine Großbuchstaben-Labels und Ordnungsnummern | Eyebrows, Navigation, Szenenkopf, Inspector, KPI-Einleitung und weitere Sektionen | Vorlagenartiger Ausstellungs-/SaaS-Eindruck, ohne zusätzlichen Informationsgewinn | Normale lesbare Bereichsnamen; Nummern nur behalten, wenn sie einen Ablauf oder Bauteil tatsächlich referenzieren |
| Eine statische Punktanzeige wirkt wie ein Systemstatus | `.model-badge` mit `.status-mark` | Unklar, welcher veränderbare Zustand angezeigt wird | Schlichte Kennzeichnung „Szenariomodell“ statt einer scheinbaren Live-Statusanzeige |
| Mehrfach große Bildbühnen auf derselben Seite | Interaktives Modell, danach vollständige `RenderGallery` | Eigene gute Bilder werden redundant; Hauptweg sehr lang | 3D als Primäransicht; Renderbilder gezielt über eine optionale Ansichts-/Galerieaktion erreichbar machen |
| Zahlreiche gleichwertig gestaltete Flächen | Systemleiste, Szene, Inspector, Ressourcenblock, Behauptungsblock, weitere Karten | Rahmen und blassgrüne Oberflächen konkurrieren miteinander | Eine dominante Modellfläche; Text überwiegend durch Raum und Typografie gliedern, Container nur für zusammengehörige Bedienung/Daten |
| Grüne Abstufungen prägen fast alles | Grundfläche, Panels, Flächenhintergründe, Schrift, Rahmen, Schalter | Wenig funktionale Trennung, gedämpfter Kontrast trotz ruhiger Wirkung | Neutrale helle Arbeitsflächen, dunkle Schrift, Waldgrün gezielt für Auswahl und Hauptaktionen; Wasser-/Energiefarbe nur sachlich |
| Hilfen und Beschriftungen vielfach 7–10 px | `styles.css`, beispielsweise `.scene-scale`, `.system-switch small`, `.parameter-help`, Diagrammlegenden | Schwer lesbar am Beamer; sehr große Headlines neben winzigen Bedienelementen | Weniger sichtbare Nebentexte, dafür lesbare Schrift; wichtigen Text nicht durch Verkleinern in die Oberfläche pressen |
| Kreisnummern erfordern zunächst Zuordnung | Inspector-Bauteilauswahl | Die sechs Themen sind vor dem Anklicken nicht erkennbar | Bauteilnummern im räumlichen Modell behalten; zusätzlich eine kompakte beschriftete Auswahl statt eines zweiten reinen Zahlencodes |
| Sloganartige Dreierfolgen und Gegensätze | Intro, große Abschnittsüberschriften, Footer | Geringe zusätzliche Aussage; wiederholter rhetorischer Rhythmus wirkt generisch | Konkrete Nomen und direkte Arbeitsaufträge; Footer-Motto und doppelte Ankündigungen streichen |
| Pflichtwissen wird wie mehrere weitere Hauptangebote inszeniert | `Knowledge.tsx` nach Modell und Galerie | Viel Scrollen; Inhalte haben zu wenig erkennbare Priorität | Kompakter Bereich „Hintergrund“ mit klar bezeichneten, aufklappbaren Themen; alle fachlichen Pflichtinhalte weiter auffindbar |
| Bekannte Modellgrenzen werden mehrfach ausführlich wiederholt | Bauteilnotizen, KPI-Fußnote, Szenarioerklärung, Vergleich, Quellenfenster | Warn- und Erklärungsmüdigkeit | Die jeweils kritische Grenze direkt benennen („Strombeitrag“, „Teilkosten“); vollständige Systemgrenzen bei Bedarf öffnen |
| Vergleich erhält zwei große Einstiege | Gemeinsamer Hero plus eigener `ComparePanel`-Titel | Der eigentliche Vergleich beginnt spät | Perspektivenwahl, Bezugsmenge und Diagramm bilden gemeinsam den Einstieg |
| Quellenübersicht öffnet viel Detail auf einmal | `SourceDialog`, Modus `all` | Nachschlagen wird zur weiteren langen Leseseite | Erst übersichtliche Quellenliste bzw. geschlossene Einträge; direkte Belegaufrufe öffnen weiterhin sofort die richtige Quelle mit Fundstelle |
| Entscheidung ist eine lange Folge gleichgewichteter Editierfelder | `Decision.tsx` | Empfehlung, Pflichtprüfung und Detailbearbeitung sind schwer zu überblicken | Empfehlung/Export zuerst; Kriterien und Argumente sinnvoll gruppieren. Quellenwahl, Texte, Speicherung und Druckprüfung erhalten |

## Gemessene Ausgangsansicht

| Maß | Laptop 1.440 × 900 | Tablet 820 × 1.180 | Smartphone 390 × 844 |
|---|---:|---:|---:|
| Höhe des gemeinsamen Heros | 267 px | 217 px | 192 px |
| Beginn der eigentlichen Modellfläche | y = 519 px | y = 453 px | y = 402 px |
| Beginn des KPI-Streifens | y = 1.124 px | y = 1.033 px | y = 1.428 px |
| Gesamthöhe von „Erkunden“ | 4.412 px | 4.348 px | 5.021 px |
| Höhe der zusätzlichen Rendergalerie | 1.241 px | 893 px | 661 px |

Die Zahlen hängen von Browser und Schriftlayout ab und sind keine universellen Grenzwerte. Sie belegen hier den konkreten Platzverbrauch: Auf dem Laptop füllt die Einführung fast die obere Bildschirmhälfte; auf dem Smartphone liegen die ersten Rechenergebnisse erst deutlich nach dem Modell und dessen Erklärung.

## Was ausdrücklich erhalten bleiben sollte

- Die eigenen räumlichen Modelle und Renderbilder sind relevante, individuelle Arbeitsergebnisse. Sie benötigen eine klarere Gewichtung, keine erneute Ersetzung durch Dekoration.
- Drei Anbausysteme, drei Förderoptionen und fünf Kriterien sind fachlich vorgegeben. Ihre Anzahl ist kein Grund, sie als vermeintliches KI-Muster abzuschaffen.
- Diagramme mit gemeinsamen Maßstäben, Einheiten, Datenlücken und Quellen bleiben sachliche Werkzeuge. Keine dekorativen Nachhaltigkeitspunkte oder Rankings ergänzen.
- Quellen, Annahmen und Unsicherheiten sind Pflichtinformationen. Die Verbesserung besteht in Priorisierung und Auffindbarkeit, nicht im Verbergen entscheidender Einschränkungen.
- Akkordeons, Tabellen, Dialoge und Karten sind nicht an sich problematisch. Sie sollten eine konkrete Aufgabe erfüllen; progressive Offenlegung ist bei diesem Stoff sinnvoll.
- Manrope ist bereits lokal verfügbar und brauchbar. Ein Fontwechsel allein würde die strukturellen Probleme nicht lösen. Waldgrün passt zum Thema; es muss nicht allein wegen seiner Verbreitung ersetzt werden.
- Aktive Zustände, Tastaturwege, reduzierte Bewegung und die technische Ersatzansicht sind funktionale Stärken und müssen bei der Überarbeitung erhalten bleiben.

## Zielrichtung für die Umsetzung

Eine kompakte, ruhige Arbeitsoberfläche statt einer Abfolge von Marketingabschnitten: klare Navigation, Modell und Kernergebnisse oben, lesbare Beschriftungen, konkrete kurze Texte. Hintergrundwissen und hochwertige feste Renderansichten bleiben gezielt erreichbar. Die Hauptansicht soll wenige bewusste Gestaltungsmittel verwenden und erkennbar auf das Erkunden, Rechnen, Vergleichen und begründete Urteilen zugeschnitten sein.
