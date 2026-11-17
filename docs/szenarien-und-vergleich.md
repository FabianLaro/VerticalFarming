# Eindeutige Szenarien und maßstäbliche Vergleichsgrafiken

Stand: 17.11.2026.

## Bedienung

„Szenarien“ zeigt ausschließlich eine Vertical Farm, passend zu allen Reglern, Formeln und Ergebnissen. Eine Auswahl von Gewächshaus oder Freiland ist dort nicht mehr möglich. „Erkunden“ behält seine zuletzt gewählte Variante auch dann, wenn im Rechner ein vorbereitetes VF-Szenario gewählt wird. Die vollständige Rücksetzung stellt wie zuvor auch die Standardansicht wieder her.

„Vergleichen“ enthält eine gemeinsame 3D-Ansicht und einen umschaltbaren Grundriss. Beide zeigen dieselben aktuellen Vergleichsflächen. Die Jahresernte wird als Zahlenwert und proportionaler Balken dargestellt. Datentabelle, Quellen und Vergleichsgrenzen bleiben aufklappbar.

## Geometrie und Aussagegrenze

- Ein Meter entspricht in allen drei 3D-Modellen derselben Raumeinheit. Eine gemeinsame orthografische Kamera erfasst die gesamte Anordnung. Es gibt keine Vergrößerung einzelner Varianten.
- Jede dargestellte quadratische Parzelle hat die Seitenlänge √Grundfläche. Ihre Fläche entspricht damit dem jeweiligen Wert in m². Alle Grundrisse teilen dieselbe SVG-Projektion. Die Maßstabslinie bezeichnet eine tatsächliche Strecke in diesen Koordinaten.
- Bei gleicher Grundfläche sind die drei Parzellen gleich groß. Bei gleicher Jahresernte wird der Flächenbedarf aus den jeweiligen Erträgen berechnet: im Basisszenario 1.000 m² VF, 156.000 / 29,05 ≈ 5.370 m² Gewächshaus, 156.000 / 8,9 ≈ 17.528 m² Freiland. Die Seitenlänge des Freilands ist damit ungefähr 4,19-mal so groß wie die der VF, nicht 17,53-mal.
- Bei sechs Ebenen wächst die Zielernte auf 234 t. Die VF bleibt 1.000 m² groß; die beiden Referenzflächen wachsen proportional zur Zielernte. Der Vergleich übernimmt den aktuellen Rechnerstand.
- Quadratische Gebäudegrundrisse sind eine Darstellungsannahme, keine vermessenen Betriebspläne. Gebäudehöhen, Regale und Pflanzen sind ausdrücklich schematisch. Anzahl und Größe der Blattmodelle quantifizieren weder Pflanzdichte noch Jahresernte. Der Nutzanteil wird bei den VF-Regalflächen berücksichtigt; Gebäude- und Bruttogrundfläche bleiben davon verschieden.
- Die Pflanzen verwenden das vorhandene eigene Blender-Modell `public/models/lettuce-low.glb`. Die maßabhängigen Gebäude- und Beetgeometrien werden lokal berechnet, damit die Grafik auf Parameteränderungen reagiert. Es handelt sich um neue Echtzeitgrafiken, nicht um neu gerenderte statische Cycles-Bilder.

Die fachlichen Referenzen, Jahresangaben und fehlenden harmonisierten Energie-/Klimadaten wurden nicht verändert. Die Grafik belegt keinen vollständigen Ressourcen-, Umwelt- oder Kostenvergleich.

## Prüfungen

30 Tests in sieben Gruppen einschließlich vier Prüfungen für gemeinsame Flächen, unabhängig nachgerechnete Referenzflächen, sechs Ebenen und Randfälle. 20 Produktions-Browserprüfgruppen decken zusätzlich den Wechsel aus Gewächshaus/Freiland in den VF-Rechner, erhaltene Erkundungsauswahl, echte WebGL-Grafik, wiederholte Ansichtswechsel sowie das tatsächliche SVG-/Bildschirmflächenverhältnis auf Desktop, Tablet und Smartphone ab. Bericht: `docs/browser-checks.json`.

TypeScript und Produktionsbuild bestanden. Der Brief bleibt bei 403 Wörtern und passt auf eine A4-Seite. Keine Prüfung auf physischem iPhone/Safari; keine Nutzerstudie.

## Geänderte Dateien

`src/App.tsx`, `src/styles.css`, `src/components/ComparePanel.tsx`; neu `ComparisonGraphic.tsx`, `ComparisonScene.tsx` und `comparison-graphic.css` im selben Komponentenordner sowie `src/lib/comparison-layout.ts`. Angepasst wurden `tests/browser.mjs`, der Browserbericht, README und technische Dokumentation; neu `tests/comparison-layout.test.ts`. Die feste Vergleichsansicht in `output/ersatzansichten` wurde aktualisiert.
