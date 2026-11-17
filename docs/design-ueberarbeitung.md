# Gestaltungsüberarbeitung

Stand: 16.11.2026. Die Anwendung wurde als kompakte Arbeitsoberfläche für Erkunden, Rechnen, Vergleichen und Urteilen überarbeitet. Die [Internetrecherche](design-recherche.md) und der [Bestandsaudit](design-audit.md) gingen der Umsetzung voraus. Wiederkehrende Gestaltungsmuster wurden nach ihrer Funktion beurteilt; das Aussehen einer Webseite beweist keine KI-Autorschaft.

## Änderungen

- Wiederholte große Einstiege, Slogans, dekorative Großbuchstaben-Labels, Ordnungszahlen und Statusschmuck entfernt. Vergleich und Entscheidung beginnen direkt mit ihrer Aufgabe.
- Helle neutrale Arbeitsflächen, dunkle Schrift und gezielte grüne Auswahlzustände ersetzen die nahezu durchgehend salbeigrüne Rahmung. Manrope und die eigenen Blender-Modelle bleiben erhalten.
- Das 3D-Modell und aktuelle Kernergebnisse stehen früher im Seitenablauf. Das Modell ist auf großen Ansichten 385 px, auf schmalen Mobilansichten 320 px hoch. Auf dem Smartphone erscheinen die Ergebnisse vor dem Bauteil-/Parameterbereich.
- Die Rendergalerie ist zunächst geschlossen und lässt sich gezielt öffnen. Vier klar benannte Hintergrundthemen bündeln Ressourcen und Standort, Regionalitätsbehauptung, Datenkritik sowie Begriffe. Zielkonflikte stehen gesammelt im Entscheidungsbereich. Formeln und vollständige Bilanzgrenzen bleiben auffindbar, ohne die Hauptansicht dauerhaft zu belegen.
- Beschriftete Bauteilauswahl, lesbare Bedien- und Erklärungstexte und kürzere konkrete Titel stärken die Orientierung. Förderoptionen erscheinen als Auswahlzeilen statt als drei große Karten. Bearbeitete Textfelder wachsen mit ihrem Inhalt.
- Der Quellenkatalog beginnt mit geschlossenen Einträgen; ein direkt aufgerufener Beleg ist geöffnet. Die genaue Fundstelle an einem Urteil lässt sich bei Bedarf aufklappen. Quellenwahl, Speicherung, Kurzbeleg und Druckbibliografie bleiben synchron.
- Beide nativen Dialoge berücksichtigen verzögerte Schließereignisse. Eine gerade erneut geöffnete Quellen- oder Bildansicht bleibt dadurch geöffnet.

Rechenlogik, Eingabebereiche, Referenzdaten, Quellen und fachliche Pflichtbestandteile wurden nicht verändert. Die Druckstruktur mit drei Pro-/Contraargumenten, fünf Kriterien, zwei Prioritäten, Bedingungen, Gegenargument und Fragen bleibt erhalten. Es gibt weiterhin keine berechnete Fördergesamtnote.

## Gemessener Vorher-/Nachher-Vergleich

Frische Produktionsansichten unter `http://127.0.0.1:4173`, jeweils „Erkunden“ im Ausgangszustand. Angaben in CSS-Pixeln, gerundet. Galerie und vier Hintergrundthemen sind im neuen Stand anfangs geschlossen.

| Bildschirm | Modellbeginn vorher → nachher | Kernergebnisse vorher → nachher | Seitenhöhe vorher → nachher |
|---|---:|---:|---:|
| Laptop, 1.440 × 900 | 519 → 270 | 1.124 → 807 | 4.412 → 1.423 |
| Tablet, 820 × 1.180 | 453 → 265 | 1.033 → 803 | 4.348 → 1.455 |
| Smartphone, 390 × 844 | 402 → 259 | 1.428 → 767 | 5.021 → 2.048 |

Die Messung zeigt weniger anfänglichen Platzverbrauch, keine gemessene Verbesserung von Lernerfolg oder Bearbeitungszeit. Detailinformationen wurden nachgeordnet, nicht aus dem Projekt entfernt. Messdateien: `tmp/design-audit/measurements.json` und `tmp/qa/redesign-production-layout.json`.

## Prüfung

- **26 Tests in sechs Gruppen** für Rechnungen und Quellen sowie **18 Produktions-Browserprüfgruppen** bestanden; Produktionsbuild erfolgreich.
- Auf 1.440, 820 und 390 px Breite kein globaler Seitenüberlauf. Maus, Tastatur, simuliertes Touch, Quellenwahl, Speicherung, Vortragsmodus, Galerie und Ersatzansichten geprüft.
- Keine aufgezeichneten JavaScript-/Konsolenfehler oder externen Laufzeitabrufe. Geprüfte lokale Blender-Ressourcen erfolgreich geladen.
- Neu exportierter und visuell geprüfter Brief: **eine A4-Seite, 403 Wörter**; Inhalt **914,58 CSS-Pixel** bei **1.031,81** verfügbaren Pixeln. Keine abgeschnittenen Inhalte.

Nachweise: `docs/browser-checks.json`, `output/pdf/export-pruefung.json` und [Prüfprotokoll](pruefprotokoll.md). Physische iPad-, Safari- und Beamerprüfungen sowie eine Nutzerstudie wurden nicht durchgeführt. Es bleibt ein nicht betrieblich kalibriertes Szenariomodell.

## Geänderte Dateien

| Bereich | Dateien |
|---|---|
| Rahmen und Hauptlayout | `src/App.tsx`, `src/styles.css` |
| Inhalt und Bedienung | `src/components/ComparePanel.tsx`, `ScenarioPanel.tsx`, `Knowledge.tsx`, `Conflicts.tsx`, `Decision.tsx`, `RenderGallery.tsx`, `Sensitivity.tsx` |
| Komponentenstile | `src/components/decision.css`, `src/components/render-gallery.css` |
| Browserprüfung | `tests/browser.mjs`, `docs/browser-checks.json` |
| Recherche und Dokumentation | `docs/design-recherche.md`, `docs/design-audit.md`, `docs/design-ueberarbeitung.md`, `docs/gestaltung-und-technik.md`, `docs/pruefprotokoll.md`, `README.md` |
| Neue Produktionsaufnahmen | `output/ansicht-laptop.png`; `output/ersatzansichten/vertical-farm.png`, `gewaechshaus.png`, `freiland.png`, `vergleich-basis.png`, `sensitivitaet-basis.png`; `output/blender/galerie-in-anwendung.png` |
| Aktualisierter Brief | `output/pdf/decision-brief-basis.pdf`, `output/pdf/export-pruefung.json` |

Die verkürzt aufgeführten Komponentennamen in der zweiten Zeile liegen sämtlich unter `src/components`; die verkürzten PNG-Namen der Ausgabezeile unter `output/ersatzansichten`.
