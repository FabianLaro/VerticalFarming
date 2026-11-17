# Gestaltung und technische Entscheidungen

Stand 16.11.2026. Eine sachliche Arbeitsoberfläche für ein Geographieprojekt: helle neutrale Grundflächen, dunkle Schrift und Waldgrün für Auswahl und Hauptaktionen. Die eigenen 3D-Modelle und aktuelle Rechenergebnisse stehen im Mittelpunkt. Hintergründe, feste Renderansichten und vollständige Belege bleiben gezielt erreichbar. Recherche, Ausgangsbefunde und Umsetzung sind in `docs/design-recherche.md`, `docs/design-audit.md` und `docs/design-ueberarbeitung.md` dokumentiert. Gestaltungsmuster werden als konkrete Nutzbarkeitsfragen beurteilt, nicht als Nachweis einer KI-Autorschaft.

## Lesbarkeit und Bedienung

Manrope bleibt lokal eingebunden. Wenige Schriftgrößen, lesbare Beschriftungen und konkrete Bereichstitel ersetzen große wiederholte Einstiege, dekorative Großbuchstaben-Labels, Ordnungszahlen und Statusschmuck. Die Förderfrage steht bei „Erkunden“, der Rechner erhält einen eigenen Titel; Vergleich und Entscheidung beginnen unmittelbar mit ihrer Aufgabe. Die Förderoptionen stehen als übersichtliche Auswahlzeilen statt als drei gleichgewichtige Karten.

Seit der Verdichtung vom 17.11.2026 ist das interaktive Modell regulär 310 px, auf schmalen Mobilansichten 270 px hoch; weitere Größenanpassungen stehen in den Medienregeln. Navigation und Projektname teilen sich auf breiten Bildschirmen eine Zeile. Auf dem Smartphone stehen die Kernergebnisse vor dem Bauteil-/Parameterbereich. Hintergrundwissen enthält vier Themen in einem aufklappbaren Bereich. Galerie, Sensitivität, Datentabelle und längere Entscheidungsfelder öffnen sich ebenfalls auf Anfrage. Die zentralen Werte, Einheiten und Kennzeichnung als Szenariomodell bleiben direkt sichtbar. Messwerte und Änderungen stehen in `docs/kompakte-fassung.md`.

Maus- und Touchbedienung ergänzen sich durch normale Tastatur-Schaltflächen: Bauteile sind beschriftet auswählbar, ihre Nummern bleiben zur Zuordnung im Modell erhalten. Kamera und Zoom besitzen eigene Schalter. Quellenzugänge bleiben an Aussagen und Eingaben erreichbar. Der Quellenkatalog beginnt mit geschlossenen Einträgen; ein direkt aufgerufener Beleg wird geöffnet. Bei der Kriterienbewertung ist die genaue Fundstelle optional aufklappbar. Textfelder wachsen mit ihrem Inhalt, damit bearbeitete Aussagen lesbar bleiben.

Beide nativen Dialoge unterstützen Schließen und Escape. Ihre Zustände berücksichtigen verzögerte `close`-Ereignisse, damit ein gerade erneut geöffneter Dialog nicht durch ein altes Ereignis geschlossen wird. Der Vortragsmodus führt weiterhin durch dieselben sechs Schritte.

Die Seitenstruktur passt sich an schmale Ansichten an; breite Vergleichstabellen haben einen gekennzeichneten eigenen Scrollbereich. Die 3D-Modelle drehen nicht automatisch. Die Anwendung berücksichtigt die Systemeinstellung für reduzierte Bewegung. Physische iPad-, Smartphone- oder Beamerprüfungen werden nur behauptet, wenn sie im Prüfprotokoll tatsächlich dokumentiert sind.

## Architektur

| Schicht | Verantwortung |
|---|---|
| `src/data/catalog.ts` | Quellen, Eingaberegister, Referenzdaten, Ergebnisdefinitionen und Grenzen |
| `src/lib/model.ts` | Zustandsfreie Jahresrechnung, Validierung, Szenarien, Vergleich, Sensitivität |
| `src/lib/format.ts` | Einheitliche deutsche Zahlendarstellung |
| `src/App.tsx` | Gemeinsamer aktueller Szenariostand, Bereiche, Vortragsführung, Quellenfenster |
| `src/components/FarmScene.tsx` | Drei echte 3D-Systeme, Kamera, Material, Licht, Interaktion |
| `src/components/SceneFallback.tsx` | Lokales Ersatzschema ohne WebGL |
| `src/components/ScenarioPanel.tsx`, `ComparePanel.tsx`, `Sensitivity.tsx` | Bedienung und Diagramme aus denselben Modellfunktionen |
| `src/components/Decision.tsx`, `Brief.tsx` | Bearbeitbares Urteil, lokale Speicherung, Pflichtprüfung, einseitige Druckansicht |
| `src/lib/citations.ts` | Synchronisierte Quellenwahl, Kurzbelege und aktuelle Druckbibliografie |
| `src/components/ComparisonGraphic.tsx`, `ComparisonScene.tsx`, `src/lib/comparison-layout.ts` | Gemeinsame metrische Grundflächen in 3D und als Grundrisse, dynamisch aus den Vergleichswerten |
| `src/components/RenderGallery.tsx` | Lokale Renderbilder, Referenz-/Detailansichten und zugängliche Großansicht |
| `scripts/serve.mjs` | Kleiner lokaler Dienst für den fertigen Build, auf 127.0.0.1 begrenzt |
| `tests` | Rechen- und Browserprüfungen; Ergebnisse gesondert dokumentiert |

Es gibt keinen Account, kein externes Backend und keine Datenbank. Entscheidungsformulierungen werden optional nur im Browser gespeichert. Quellenlinks werden vom Nutzer geöffnet. Der App-Betrieb braucht nach Installation keine externen Bilder, Schriften, Karten oder 3D-Dienste.

## Bibliotheken und Kompatibilität

Die am 16.11.2026 verwendeten Paketstände sind in `package-lock.json` reproduzierbar festgehalten. Zum Dokumentationszeitpunkt lokal installiert:

| Bestandteil | Version | Zweck |
|---|---:|---|
| React / React DOM | 19.3.1 | Oberfläche und Zustand |
| React Three Fiber | 9.8.2 | React-Anbindung für Three.js |
| Three.js | 0.187.0 | Geometrie, Materialien, Kameras und Beleuchtung |
| Drei | 10.7.9 | OrbitControls für Maus und Touch |
| Vite | 8.3.8 | Lokale Entwicklung und Produktionsbündel |
| TypeScript | 7.0.2 | Typprüfung |
| Phosphor React | 2.1.10 | Einheitliche Symbole |
| Manrope Variable | 5.3.0 | Lokal gebündelte Schrift |
| Playwright | 1.65.1 | Automatisierte Browserprüfung |
| tsx | 4.23.15 | Ausführung der Modelltests |

Die [offizielle Vite-Anleitung](https://vite.dev/guide/) nennt Node 20.19+ bzw. 22.12+; für diese Übergabe wird **Node ab 22.12** verwendet. Vorhanden war 22.18.0. Die [R3F-Dokumentation](https://r3f.docs.pmnd.rs/getting-started/introduction) ordnet R3F 9 ausdrücklich React 19 zu; R3F 10 war dort als Alpha gekennzeichnet. Deshalb wird die stabile 9er-Reihe verwendet. [Three.js-Dokumentation](https://threejs.org/docs/) liefert die verwendeten Raum-, Material- und Kamerafunktionen. Dokumentation und Paketstände wurden geprüft; die finale Build-/Laufzeitprüfung ist im Prüfprotokoll festgehalten.

## 3D, Leistung und Aussagekraft

Pflanzen und technische Bauteile wurden in Blender selbst modelliert und als lokale GLB-Dateien exportiert. Organisch gekrümmte Blattflächen mit Vertexfarben ersetzen die früheren vereinfachten Blattkörper. NFT-Ebenen, Tank, Pumpe, Lüftungsgerät und Erntewagen besitzen modellierte Details. Gebäudehüllen, Leitungen und variable Anordnung bleiben im React-Modell parametrisch. Die Ebenenzahl baut tatsächlich mehr oder weniger Regalebenen; die Grundfläche beeinflusst die horizontale Ausdehnung. Kamera und Markierungen reagieren auf Modellgröße und Ansichtsformat.

Eine zunächst geschlossene Galerie zeigt separat berechnete Blender-Renderbilder mit eigener Kamera und Beleuchtung. Sie sind deutlich als feste Referenzansichten gekennzeichnet und lassen sich per Maus, Touch und Tastatur vergrößern. Sie ersetzen keine aktuellen Rechenwerte. Editierbare Quellen und Wiederherstellung stehen in `docs/blender-modelle.md`.

Wiederholte Pflanzenblätter verwenden Instanzen. Der Renderer zeichnet bedarfsgesteuert; es gibt keine dauerhaft laufende Schauanimation. „Sparsam“ reduziert Auflösung, Pflanzengeometrie, Kantenglättung und Schattenaufwand. Die Szene wird verzögert geladen, Fehlergrenzen und ein manuell erreichbares Ersatzschema halten die Lerninhalte zugänglich. React Three Fiber verwaltet die an die Komponentenszene gebundenen Ressourcen beim Abbau.

Die Modelle sind räumliche **Schemata**, keine Ausführungspläne und keine pro Pflanze kalibrierten Produktionsabbilder. Ansichten werden einzeln eingepasst; faire Flächenvergleiche erfolgen im gemeinsamen Maßstab der Diagramme. Stoffwege erläutern Prozesse ohne unbelegte Mengenverhältnisse. Standorteignung, Statik und Genehmigungen bleiben reale Prüfaufgaben.

Die neue Vergleichsgrafik verwendet dagegen für alle drei Grundflächen einen gemeinsamen Metermaßstab und eine gemeinsame orthografische Kamera. Ein umschaltbarer Grundriss zeigt dieselben Flächen; Gebäudehöhen und Pflanzen bleiben schematisch. Der Rechner stellt ausschließlich die Vertical Farm dar. Details und Prüfungen stehen in `docs/szenarien-und-vergleich.md`.

## Druck und Rückfallebene

Der A4-Brief wird mit eigenen Druckregeln gerendert und übernimmt die aktuelle Rechnung sowie die editierte Position. Die App kontrolliert Pflichttexte, zwei Prioritäten, Satz- und Wortgrenze. Die Bildschirmanwendung und Navigation verschwinden beim Drucken. Eine gespeicherte PDF und das integrierte Ersatzschema ergänzen die 3D-Vorführung. Eine sichere Aussage zur konkreten Bildschirm-, Drucker- oder Beamerhardware setzt deren eigene Probe voraus.

