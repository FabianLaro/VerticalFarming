# Stadtlabor 2040

**Soll unsere Stadt Vertical Farming fördern?** Eine lokale, deutschsprachige 3D-Anwendung für ein fünf Wochen umfassendes Geographieprojekt der Oberstufe. Sie verbindet räumliches Erkunden, nachvollziehbare Szenarien und ein bearbeitbares Förderurteil.

Das Ergebnis ist ein **Szenariomodell**, keine validierte Betriebsprognose für NRW. Es braucht keinen Account und keine Datenbank. Die App läuft lokal oder als statische Webseite auf Vercel.

## Sofort vorführen

1. Im Projektordner **„Stadtlabor starten.cmd“ doppelt anklicken**.
2. Im Browser öffnet sich **http://127.0.0.1:4173**. Falls der Browser schneller als der lokale Dienst startet, die Seite einmal neu laden.
3. Das kleine Startfenster während der Vorführung geöffnet lassen. Zum Beenden dort **Strg+C** drücken und die Rückfrage gegebenenfalls bestätigen.

Der fertige Produktionsbuild liegt in `dist`. Er wird über einen ausschließlich auf dem eigenen Rechner erreichbaren lokalen Dienst bereitgestellt. Die Datei `dist/index.html` deshalb nicht direkt doppelt anklicken.

Voraussetzung ist **Node.js ab 22.12**. Auf dem Erstellungsrechner war Node.js **22.18.0** vorhanden. Für den fertigen Build sind weder ein Paketdownload noch ein erneuter Build nötig. Auf einem anderen Rechner werden mindestens `dist`, `scripts/serve.mjs` und die Startdatei sowie Node.js benötigt; für vollständige Übergabe den gesamten Projektordner behalten.

## Der Weg durch die Anwendung

- **Erkunden:** Vertical Farm, Gewächshaus und Freiland mit selbst gebauten Blender-Modellen drehen und zoomen. „Schnitt“, „Hülle“ und „Aufbau“ öffnen verschiedene Ansichten. Beschriftete Bauteile und die Markierungen im Modell erklären die Technik. Hochauflösende Bilder stehen unter „Gerenderte Ansichten und Nahaufnahme“; vier Hintergrundthemen öffnen sich bei Bedarf.
- **Szenarien:** Acht offengelegte Eingaben verändern Fläche, Ernte, Ressourcen, Stromkosten und Strombeitrag. Vorbereitete Szenarien setzen jeweils bei der vollständigen Basis an. „Basis vollständig wiederherstellen“ setzt auch die Standardansicht zurück.
- **Vergleichen:** Gleiche Grundfläche oder gleiche Jahresernte wählen. Das veränderbare VF-Szenario wird mit gekennzeichneten niederländischen Kopfsalatreferenzen verglichen. Datenlücken bleiben sichtbar.
- **Entscheiden:** Drei Förderoptionen, fünf Kriterien und genau zwei begründete Prioritäten. Belegtext und Quelle sind je Kriterium wählbar; Kurzbeleg und Druckreferenzen folgen der Auswahl. Die Fundstelle lässt sich gesondert öffnen. Die Symbole ergeben keine Gesamtnote.

Die Hauptansicht zeigt Modell und Kernergebnisse zuerst. Hintergrund, Sensitivität, Vergleichstabelle und längere Entscheidungsfelder öffnen sich bei Bedarf. Die [kompakte Fassung](docs/kompakte-fassung.md) dokumentiert die weitere Verdichtung vom 17.11.2026; die [Gestaltungsüberarbeitung](docs/design-ueberarbeitung.md) den vorherigen Entwurf.

„**Vortrag starten**“ führt in sechs Schritten durch ungefähr elf Minuten. Details stehen im [Präsentationsleitfaden](docs/praesentationsleitfaden.md).

## Ergebnis als einseitiges PDF

Unter **Entscheiden** Namen, Datum und Position bearbeiten; die Druckvorschau öffnen. Der Brief übernimmt den aktuellen Szenariostand. Der Export wird erst bei vollständig ausgefüllten Pflichtfeldern, genau zwei Prioritäten, höchstens drei Sätzen für Empfehlung samt Bedingungen und höchstens **450 Wörtern einschließlich Beschriftungen** freigegeben.

„**Decision Brief als PDF drucken**“ wählen und im Browser **Als PDF speichern** einstellen: **A4, Hochformat, 100 %**, Browser-Kopf- und Fußzeilen aus. Die App prüft zusätzlich, ob der Text auf eine A4-Seite passt. Nach umfangreicher eigener Bearbeitung die Vorschau erneut prüfen.

Eine [Beispielausgabe im Basisszenario](output/pdf/decision-brief-basis.pdf) liegt unter `output/pdf`: eine A4-Seite innerhalb der 450-Wort-Grenze. Eigene Namen und das eigene Urteil vor der Abgabe anpassen. Statische Modelle und Ergebnisse liegen unter `output/ersatzansichten`; das [strukturierte Daten- und Quellenverzeichnis](output/daten-und-quellen.json) ist separat gespeichert.

## Eigene Blender-Modelle und Renderings

Die Pflanzen, NFT-Regalebenen, Tanks, Pumpen, Lüftungsgeräte und Erntewagen wurden für das Projekt selbst modelliert. Ihre editierbaren `.blend`-Dateien liegen unter `output/blender`, die lokalen Laufzeitmodelle unter `public/models`. Die drei vollständigen Modellszenen und ihre hochauflösenden Renderbilder sind ebenfalls lokal enthalten. Herkunft und Wiederherstellung beschreibt [Blender-Modelle](docs/blender-modelle.md).

Die Renderbilder sind feste Referenzansichten. Szenarioregler ändern weiterhin das echte interaktive Modell; sie berechnen kein neues Blender-Bild. Beide Darstellungen sind räumliche Schemata, keine Ausführungspläne.

Die bearbeitete Entscheidungsposition wird im lokalen Browser gespeichert. Bei gesperrtem Browserspeicher gilt sie nur für die Sitzung. Szenarioregler werden bei einem Neuladen auf die Basis gesetzt. Die Auswahl einer anderen Förderoption schreibt die Argumentation nicht automatisch um.

## Offline und technische Ersatzansichten

Nach Installation bzw. mit dem fertigen Build sind Schrift, Symbole, Geometrie, Diagramme, Quellenangaben und das bereitgestellte Aufgaben-PDF lokal vorhanden. **Originalquellen im Internet** benötigen eine Verbindung; ihre geprüften Angaben und Grenzen bleiben offline lesbar. Das Unterrichtsdossier ist unter `material/aufgabenstellung.pdf` innerhalb der laufenden Anwendung erreichbar.

Bei schwacher Grafik unter **Grafik → Sparsam** wechseln. Bei fehlender 3D-Unterstützung **Ersatzschema** wählen; Rechnungen, Erklärungen, Vergleich und Druck bleiben nutzbar. Die Kamera lässt sich über die Pfeil-/Zoomtasten oder „Kamera zurücksetzen“ bedienen. Eine PDF-Kopie des eigenen Briefs vor dem Vortrag speichern.

Der tatsächliche Prüfstand und die Grenzen der Geräteprüfung stehen im [Prüfprotokoll](docs/pruefprotokoll.md). Ein automatisiert emuliertes Tablet ist kein Test auf einem physischen iPad.

## Installation und Weiterentwicklung

Im Projektordner ein Terminal öffnen:

```text
npm ci
npm run dev
```

Der Entwicklungsserver zeigt seine lokale Adresse an, normalerweise `http://127.0.0.1:5173`. Der erste Paketdownload benötigt Internet. `npm ci` verwendet die festgehaltenen Versionen aus `package-lock.json`.

```text
npm test
npm run build
npm run preview
```

`npm test` prüft die zentralen Modellfunktionen; `npm run build` prüft TypeScript und erzeugt `dist`; `npm run preview` startet den fertigen Build auf Port 4173. Nach Codeänderungen vor einer Vorführung neu bauen.

Für die vorhandenen Browserprüfungen den Entwicklungsserver laufen lassen, einmalig `npx playwright install chromium` ausführen und dann `npm run test:browser` starten. Ein eigener Browserpfad lässt sich über `PLAYWRIGHT_BROWSER_PATH` angeben. Gegen den fertigen Build: `npm run test:browser -- http://127.0.0.1:4173` bei laufendem lokalen Dienst. Die Browserinstallation benötigt Internet; spätere Prüfungen blockieren externe Laufzeitabrufe gezielt.

## Dokumentation und vollständiger Code

| Inhalt | Datei / Ordner |
|---|---|
| Aufgabenanalyse und Umsetzungskontrolle | [Anforderungsmatrix](docs/anforderungsmatrix.md), [PDF-Auswertung](docs/pdf-auswertung.md) |
| Formeln, Basiswerte, Rechenbeispiel und Aussagegrenzen | [Modell und Grenzen](docs/modell-und-grenzen.md) |
| Originalquellenprüfung | [Literatur](docs/recherche-literatur.md), [Institute](docs/recherche-institute.md) |
| Zentrales strukturiertes Daten- und Quellenregister | `src/data/catalog.ts`; in „Belege“ als JSON speicherbar |
| Elfminütiger Vortrag und Fünfwochenplan | [Präsentationsleitfaden](docs/praesentationsleitfaden.md) |
| Gestaltung und technischer Aufbau | [Gestaltung und Technik](docs/gestaltung-und-technik.md) |
| Gestaltungsrecherche, Bestandsaudit und Überarbeitung | [Recherche](docs/design-recherche.md), [Audit](docs/design-audit.md), [Änderungsübersicht](docs/design-ueberarbeitung.md) |
| Herkunft und Nutzungsbedingungen | [Assets und Lizenzen](docs/assets-und-lizenzen.md) |
| Tatsächliche Prüfungen und Einschränkungen | [Prüfprotokoll](docs/pruefprotokoll.md) |
| Oberfläche und 3D-Modelle | `src/App.tsx`, `src/components`, `src/styles.css` |
| Reine Berechnungen und relevante Tests | `src/lib/model.ts`, `tests` |

