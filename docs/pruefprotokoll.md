# Tatsächlich durchgeführte Abnahme

Stand: 17.11.2026. Geprüft wurde die lokale Produktionsversion unter `http://127.0.0.1:4173` auf diesem Windows-Rechner. Das Ergebnis ist ein vorführbares **Szenariomodell**; keine Kalibrierung oder Validierung eines konkreten Betriebs. Die erneute Verdichtung mit Messwerten steht in `docs/kompakte-fassung.md`; die 18 Browserprüfgruppen wurden an die aufklappbaren Arbeitsbereiche angepasst.

## Ergebnis

| Prüfung | Tatsächliches Ergebnis |
|---|---|
| Aufgaben-PDF | Alle neun Seiten vollständig visuell gelesen und zusätzlich deutsch OCR-erkannt; kritische Zahlen, Symbole und Abgabevorgaben am Seitenbild kontrolliert |
| Anforderungen | Matrix vor Beginn des App-Codes erstellt; anschließend unabhängige fachliche Gegenprüfung. Ergänzt wurden insbesondere Zielkonfliktketten, Förderoptionenvergleich und sichtbare Sensitivität |
| Quellen | Pflichtquellen geöffnet; Reviews und relevante Vergleichsstudien als Originalvolltexte mit Abbildungen/Anhängen gelesen. Genaue Fundstellen und Zugangsgrenzen in den beiden Recherchedateien |
| Rechen- und Quellenprüfung | `npm test`: **33 Tests in acht Gruppen bestanden**, darunter sechs Regressionstests für Quellenwechsel und Druckreferenzen, vier Prüfungen des gemeinsamen Flächenmaßstabs und drei zum kalibrierten Maßstabsbalken |
| Produktionsbuild | `npm run build`: TypeScript und Vite erfolgreich; lokale Ressourcen und Lizenztexte in `dist` enthalten |
| Produktionsbrowser | `node tests/browser.mjs http://127.0.0.1:4173`: **20 von 20 Prüfgruppen bestanden** |
| Browserfehler | Keine aufgezeichneten JavaScript- oder `console.error`-Fehler in den geprüften Wegen |
| Betrieb ohne Internet | Frische Browserkontexte mit allen externen Netzwerkzielen aktiv blockiert; lokaler Server erlaubt. **Keine externen Laufzeitabrufe**, alle Kernwege einschließlich echter WebGL-Szene und Export funktionierten |
| Druck-PDF | `output/pdf/decision-brief-basis.pdf`: **eine A4-Seite**, 403 Wörter, drei Empfehlungssätze; dynamische Quellenliste, gerendert und visuell geprüft |
| Drucklayout | Inhalt 914,58 CSS-Pixel bei 1.031,81 verfügbaren Pixeln; geometrischer Seitenüberlauf wird unabhängig vom Wortlimit erkannt und blockiert |
| Ersatzansichten | Drei Anbausysteme, Vergleich und Sensitivität als lokale PNG-Dateien unter `output/ersatzansichten`; zusätzlich integriertes SVG-Ersatzschema ohne WebGL |

Maschinenlesbare Ergebnisse: `docs/browser-checks.json`, `output/pdf/export-pruefung.json` und für das Layout `tmp/qa/redesign-production-layout.json`. Die Browserprüfung wurde nach den letzten App-Änderungen am fertigen Build wiederholt. Ein früherer synchroner Test wurde an die asynchrone Layoutprüfung angepasst; kein verbleibender App-Fehler.

## Rechnungen und Datenkonsistenz

Die Tests enthalten ein unabhängig nachvollziehbares Beispiel mit 200 m² Grundfläche, 50 % Nutzanteil und drei Ebenen. Zusätzlich wurde die Basis geprüft: 2.600 m² Anbaufläche, 156.000 kg Salat/Jahr, 1.560.000 kWh/Jahr, 1.092.000 Liter/Jahr, 390.000 € Stromteilkosten und 633.360 kg CO₂eq Strombeitrag. Liter werden für die Anzeige in m³ und Kilogramm in Tonnen umgerechnet.

- Höherer Strompreis verändert ausschließlich Stromteilkosten; anderer Stromfaktor ausschließlich den Stromemissionsbeitrag.
- Zusätzliche Ebenen erhöhen Ernte und Gesamtressourcen proportional, verbessern bei konstanten Annahmen keine Intensität je kg.
- Vorbereitete Szenarien beginnen bei der vollständigen Basis; Rücksetzung stellt auch die Standardansicht her.
- Sensitivität für Energiebedarf, Ertrag und Preis hält nicht gewählte aktuelle Eingaben konstant; Tabellenwerte und Wirkungsaussagen sind konsistent.
- Beide Vergleichsperspektiven verwenden dieselben niederländischen Referenzen; kein zweiter Nutzflächenabzug bei deren Bruttoerträgen. Fehlende Energiedaten bleiben `null`/„Datenlücke“.
- UI-Grenzen, Nullfälle, nicht ganze Ebenen, negative/nicht endliche Werte und numerischer Überlauf wurden geprüft.
- Das Sechs-Ebenen-Szenario erscheint im Brief mit 234 t, 3.900 m² und 2.340 MWh.
- JSON-Download enthält Metadaten und aktuellen Zustand, beispielsweise bei 0,40 €/kWh genau 624.000 € Stromkosten.

## Bedienung, Raumdarstellung und Bildschirmgrößen

Browser: **Chromium 149.0.7827.55**, automatisiert mit Playwright. Die abschließende Produktionsprüfung der Blender-Fassung verwendete die vorhandene **NVIDIA GeForce RTX 4070 über ANGLE/D3D11**. Die Gerätekennung steht im Browserbericht.

- Alle drei eigenständigen Modelle; Schnitt-, Hüllen- und Aufbauansicht; räumliche Kamera, Draufsicht und Vorderansicht.
- Echtes Drehen und Zoomen, Kamera-Rücksetzung; separate Szenenprüfung bestätigte identische Startansicht nach Reset.
- Extremkombinationen: zehn Ebenen bei 100 und 3.000 m² Grundfläche.
- Bauteilwahl per Maus, Tastaturfokus/Enter und simuliertem Touch; zusätzliche normale HTML-Bauteilschalter.
- Tastaturbedienung der Szenarioregler; Quellenfenster mit Escape; persistente Bearbeitung der Entscheidungsposition.
- Genau zwei Prioritäten, Förderoptionenvergleich, Symbolauswahl und Pflichtfelder; kein Addieren der Urteile.
- Alle sechs Schritte des Vortragsmodus einschließlich Abschluss.
- Laptop mit 1.440 px Breite, Tablet 820 × 1.180 und Smartphone 390 × 844: alle Bereiche ohne globalen horizontalen Seitenüberlauf. Breite Tabellen und A4-Vorschau besitzen eigene Scrollbereiche.
- Gemeinsamer Flächenmaßstab rechnerisch und an tatsächlich gerenderten Quadratseiten auf Desktop, Tablet und Smartphone geprüft.
- Reduzierte Bewegung, sparsame Grafik und Wechsel zu den Ersatzschemata.

Screenshots unter `tmp/qa` wurden visuell kontrolliert. Feste Ersatzansichten liegen gesondert unter `output/ersatzansichten`. Die 3D-Ansichten sind individuell eingepasste räumliche Schemata; der gemeinsame quantitative Maßstab steht in den Vergleichsdiagrammen.

## Druckprüfung und Quellenkopie

`scripts/export-brief.mjs` erzeugt den Beispielbrief aus der laufenden App bei blockierten externen Anfragen. `pdfinfo` und `pypdf` bestätigten eine A4-Seite (ca. 595 × 842 pt). Poppler renderte die Ausgabe: keine abgeschnittenen Pflichtbestandteile, Überlappungen oder fehlenden Symbole.

Livezähler und sichtbares Druck-DOM stimmen mit **403 Wörtern** überein. Ein Test mit weniger als 450 Wörtern, aber zu viel Platzbedarf blockiert den Export korrekt; nach Wiederherstellung wird er freigegeben. Texte werden nicht abgeschnitten. Die Aufzählungseinzüge wurden bei der PDF-Sichtprüfung korrigiert.

Die PDF enthält die bearbeitbare **Beispielposition B im Basisszenario**, keine zwingende Förderempfehlung. Eigene Namen und eigene Position vor der persönlichen Abgabe ergänzen. Das Aufgaben-PDF wurde unverändert lokal kopiert; SHA-256 von Original und Kopie stimmt überein.

## Zusätzliche Abnahme der Blender- und Quellenüberarbeitung

- **Elf editierbare `.blend`-Dateien** mit Blender selbst erneut geöffnet: alle enthalten Mesh-Geometrie, keine fehlenden externen Bilddateien; vier komplette Modellszenen besitzen Kameras. Bericht: `output/blender/validation.json`.
- **Sieben lokale GLB-Dateien** auf glTF-2.0-Struktur, Blender-Exportkennung, positive Geometrie und eingebettete Ressourcen geprüft. Pflanzen sind instanziert; technische Teilmeshes werden nach Material zusammengefasst. Die sparsame Stufe verwendet ein separates Pflanzenmodell mit weniger Dreiecken.
- **Vier eigene Cycles-Renderings mit 2.048 × 1.408 Pixeln** visuell geprüft: Vertical Farm, Gewächshaus, Freiland und Pflanzen-Nahansicht. Nach Prüfung der zunächst kantigen Blätter wurden Blattgeometrie, Wellenfrequenz, Rundung und Oberflächen verfeinert und alle Bilder neu gerendert.
- Galerie auf alle vier tatsächlich geladenen Bilder geprüft, einschließlich Großansicht, Enter, Pfeiltasten, Escape und simuliertem Touch. Ihre Darstellung ist als feste Referenzansicht gekennzeichnet.
- Kamerafit für zehn Ebenen bei kleiner und großer Grundfläche korrigiert und erneut geprüft. Separate Szenenabnahme: sieben Prüfgruppen, alle sieben GLBs erfolgreich lokal geladen, keine Browserfehler; `tmp/qa/blender-realtime-checks.json`.
- Gewächshaus im interaktiven Modell ebenfalls auf Bodenbeete ohne künstliche Regalbeleuchtung angepasst, passend zu den Renderbildern und zur ausdrücklich benannten Vergleichsreferenz.
- Quellenwechsel je Kriterium: Auswahl, sichtbarer Kurzbeleg, genaue Fundstelle, Quellenfenster und Briefbibliografie stimmen überein. Wechsel über Barbosa, Blom und BLE sowie Tabwechsel/Neuladen geprüft; abgewählte, anderweitig ungenutzte Quellen verschwinden aus der Bibliografie. Eigene Aussageinhalte bleiben erhalten.
- In einer gezielten Messung auf der RTX 4070 benötigte die Eingabe von zehn Ebenen 21 ms, die vollständige Rücksetzung 34 ms. Das ist eine Einzelmessung auf diesem Rechner, keine Leistungszusage für andere Geräte.

## Abnahme der Gestaltungsüberarbeitung

- Der neue Produktionsstand besteht **18 Browserprüfgruppen**, darunter eine zusätzliche Prüfung des kompakten Einstiegs und der zunächst geschlossenen Hintergrundthemen. Alle 26 Rechen-/Quellentests und der Produktionsbuild sind weiterhin erfolgreich; die Rechenlogik wurde nicht geändert.
- Die Erkundungsseite beginnt auf 1.440 px Breite mit dem Modell bei y = 270,25 px statt zuvor etwa 519 px; die Kernergebnisse beginnen bei y = 806,84 px statt 1.124 px. Die anfängliche Seitenhöhe sinkt von 4.412 auf 1.423 px. Weitere Bildschirmgrößen und die Einordnung der Messung stehen in `docs/design-ueberarbeitung.md`.
- Auf Tablet (820 px) und Smartphone (390 px) kein globaler Seitenüberlauf. Die Rendergalerie und alle vier Hintergrundthemen sind zunächst geschlossen; ihre Inhalte und Quellen lassen sich weiterhin öffnen. Auf dem Smartphone stehen die Kernergebnisse vor dem Inspector.
- Quellenkatalog und direkte Quellenaufrufe, optionale Fundstellen, gespeicherte Quellenwahl, automatisch wachsende Textfelder sowie Galerie-Großansicht mit Maus, Tastatur und simuliertem Touch geprüft. Verzögerte Schließereignisse beider nativer Dialoge schließen keine neu geöffnete Ansicht mehr.
- Alle geprüften lokalen Blender-Modelle und Renderbilder wurden erfolgreich geladen; der Produktionsbericht enthält die HTTP-Statuscodes. Keine JavaScript-/Konsolenfehler und keine externen Laufzeitabrufe aufgezeichnet.
- Der Brief wurde aus diesem Stand erneut exportiert und visuell kontrolliert: eine A4-Seite, 403 Wörter, 914,58 CSS-Pixel Inhalt bei 1.031,81 verfügbaren Pixeln, keine abgeschnittenen Inhalte. Die fachliche Druckstruktur und Beispielposition bleiben erhalten.
- Sieben Ausgabeansichten wurden aus der Produktion erneuert und visuell geprüft: Laptopansicht, drei Anbausysteme, Basisvergleich, Sensitivität und Galerieaufnahme. Dateiliste in `docs/design-ueberarbeitung.md`.

## Verbleibende Grenzen

Die jüngste Ergänzung verbindet den ausschließlich für VF geltenden Rechner mit einer dazu passenden Modellansicht. Der Vergleich besitzt gemeinsame 3D-Grundflächen und maßstäbliche Grundrisse. Die neuen Prüfungen sind in `docs/szenarien-und-vergleich.md` beschrieben; die historischen Abnahmen oben beziehen sich auf ihre jeweiligen Zwischenstände.

- Kein Test auf physischem iPad, echtem iPhone, Safari, Beamer oder Drucker. Touch und Bildschirmgrößen wurden emuliert; eine kurze Probe am tatsächlichen Präsentationsgerät bleibt erforderlich.
- Kein vollständiges WCAG-/Screenreader-Audit und keine garantierte Bildrate auf unbekannter Hardware. Geprüft wurden die genannten Bedienwege, reduzierte Bewegung und relevante Layouts.
- Die Netzwerkkarte wurde nicht abgeschaltet. Der Offline-Nachweis blockiert sämtliche externen Browseranfragen bei erreichbarem lokalem Server. Bewusst geöffnete Originalquellen im Web benötigen Internet; ihre Angaben, Grenzen und das Unterrichtsmaterial sind lokal lesbar.
- Vite meldet einen Größenhinweis für das separat geladene 3D-Bündel (ca. 1.025 kB, ca. 275 kB komprimiert), keinen Buildfehler. Sparsame Grafik und Ersatzschema stehen bereit.
- In einem früheren ergänzenden Lauf mit erzwungenem Software-Rendering bestand ein Zehn-Ebenen-Klick nicht innerhalb des 10-Sekunden-Testlimits. Der aktuelle vollständige Produktionslauf auf der tatsächlichen Grafikkarte bestand alle 18 Gruppen. Mit `PLAYWRIGHT_SOFTWARE_RENDERING=1` lässt sich die langsamere Testvariante gezielt wiederholen; sie ist nicht der Standard des Browsertests.
- Lineares Modell mit unabhängigen Annahmen, keine standortspezifische Ganzjahreskalibrierung, Gewinnrechnung oder vollständige Ökobilanz. Referenzregionen, Kulturen, ältere Datenjahre und Wassergrenzen unterscheiden sich ausdrücklich.
- Namen und selbst bearbeitete Argumente müssen vor der Schulabgabe inhaltlich geprüft werden.
