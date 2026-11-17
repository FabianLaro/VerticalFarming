# Kompakte Fassung vom 17.11.2026

Navigation und Projektname stehen auf großen Bildschirmen in einer Zeile. Modellhöhe, Abstände und Formulare sind verdichtet; die Schrift der Erklärungstexte bleibt lesbar. Hintergrundwissen und Sensitivität öffnen sich gezielt. Beim Vergleich ist das Diagramm sofort sichtbar, die vollständige Datentabelle samt Grenzen aufklappbar. In der Entscheidung sind Prioritäten, Kriterien und Empfehlung getrennt aufklappbar. Die aktuell gewählten Prioritäten stehen schon in der geschlossenen Übersicht.

Rechnungen, Referenzdaten, eigene Blender-Modelle, Quellenwahl, lokale Speicherung und Druckstruktur bleiben erhalten. Die Kernansicht zeigt weiterhin den Charakter als Szenariomodell, Teilkosten und Aussagegrenzen.

## Gemessene Seitenhöhen

Ausgangszustand nach Neuladen, Details geschlossen, Chromium. Werte in CSS-Pixeln; die Dokumenthöhe beträgt mindestens die Fensterhöhe. Die kürzere Ansicht misst Platzverbrauch, keinen Lernerfolg.

| Bereich | Laptop 1440 × 900 vorher → nachher | Smartphone 390 × 844 vorher → nachher |
|---|---:|---:|
| Erkunden | 1.423 → 920 | 2.048 → 1.579 |
| Szenarien | 1.653 → 1.090 | 2.733 → 1.905 |
| Vergleichen | 1.482 → 900 | 1.931 → 907 |
| Entscheiden | 2.968 → 943 | 4.206 → 1.323 |

Auf dem Laptop beginnt das Modell jetzt bei y = 165 statt 270 Pixeln; die Erkundungsergebnisse bei y = 613 statt 807. Die Ansichten wurden auch bei 1280 × 800 und 820 × 1180 geprüft. Kein globaler horizontaler Seitenüberlauf. Messdateien und Screenshots liegen lokal unter `tmp/qa/compact-*`.

## Prüfung und Veröffentlichung

26 Rechen- und Quellentests, TypeScript und Produktionsbuild bestanden. Die vorhandenen 18 Browserprüfgruppen berücksichtigen die neuen aufklappbaren Bereiche einschließlich Tastaturbedienung. Quellenwechsel, Speicherung, Echtzeitmodelle, Galerie, Vortragsmodus und A4-Druck werden weiterhin geprüft. Nachweise stehen in `docs/browser-checks.json`; der Drucktext enthält weiterhin 403 Wörter auf einer A4-Seite.

`vercel.json` legt Vite, `npm run build` und `dist` fest. Der Projektstand wird im bestehenden Repository `FabianLaro/VerticalFarming` bereitgestellt. Die Vercel-Veröffentlichung verwendet dessen Git-Verbindung. Zugangsschutz und andere Projekte werden nicht verändert. Lokale Zugangsdaten, Paketordner, Zwischenstände und Blender-Sicherungskopien sind von Git ausgeschlossen.

Physische Safari-/iPhone-Prüfung und eine Nutzerstudie wurden nicht durchgeführt. Es bleibt ein nicht betrieblich kalibriertes Szenariomodell.

## Geänderte Dateien

- `src/App.tsx`, `src/styles.css`
- `src/components/Knowledge.tsx`, `ComparePanel.tsx`, `Decision.tsx`, `decision.css`
- `tests/browser.mjs`, `docs/browser-checks.json`
- `.gitignore`, `vercel.json`, `README.md`, diese Datei, `docs/gestaltung-und-technik.md`, `docs/pruefprotokoll.md`
- Aktualisierte App-Aufnahme, fünf Ersatzansichten und Galerieaufnahme unter `output`

Die erstmalige Git-Veröffentlichung enthält zusätzlich die bereits vorhandenen Appdateien, Fachnotizen, Modellierungsquellen und Laufzeitressourcen.
