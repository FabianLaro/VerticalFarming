# Eindeutige Szenarien und maßstäbliche Vergleichsgrafiken

Stand: 17.11.2026.

## Bedienung

„Szenarien“ zeigt ausschließlich eine Vertical Farm, passend zu allen Reglern, Formeln und Ergebnissen. Eine Auswahl von Gewächshaus oder Freiland ist dort nicht mehr möglich. „Erkunden“ behält seine zuletzt gewählte Variante auch dann, wenn im Rechner ein vorbereitetes VF-Szenario gewählt wird. Die vollständige Rücksetzung stellt wie zuvor auch die Standardansicht wieder her.

„Vergleichen“ enthält eine gemeinsame detaillierte 3D-Ansicht. Die Grundrissansicht und ihr Schalter wurden entfernt. Die Jahresernte wird als Zahlenwert und proportionaler Balken dargestellt. Der Maßstab bleibt unten rechts in der Grafikecke. Datentabelle, Quellen und Vergleichsgrenzen bleiben aufklappbar.

## Geometrie und Aussagegrenze

- Ein Meter entspricht in allen drei 3D-Modellen derselben Raumeinheit. Eine gemeinsame orthografische Kamera erfasst die gesamte Anordnung. Es gibt keine Vergrößerung einzelner Varianten.
- Jede dargestellte quadratische Parzelle hat die Seitenlänge √Grundfläche. Ihre Fläche entspricht damit dem jeweiligen Wert in m². Der Maßstabsbalken folgt der projizierten Breitenrichtung einer Parzelle. Seine Meterangabe wird passend zur verfügbaren Bildschirmbreite auf einen runden 1/2/5-Wert gewählt; Linienlänge und Neigung stammen aus der tatsächlichen Kameraprojektion. Die Verankerung unten rechts bleibt bei einem Wechsel von Perspektive und Bildschirmgröße erhalten.
- Bei gleicher Grundfläche sind die drei Parzellen gleich groß. Bei gleicher Jahresernte wird der Flächenbedarf aus den jeweiligen Erträgen berechnet: im Basisszenario 1.000 m² VF, 156.000 / 29,05 ≈ 5.370 m² Gewächshaus, 156.000 / 8,9 ≈ 17.528 m² Freiland. Die Seitenlänge des Freilands ist damit ungefähr 4,19-mal so groß wie die der VF, nicht 17,53-mal.
- Bei sechs Ebenen wächst die Zielernte auf 234 t. Die VF bleibt 1.000 m² groß; die beiden Referenzflächen wachsen proportional zur Zielernte. Der Vergleich übernimmt den aktuellen Rechnerstand.
- Quadratische Gebäudegrundrisse sind eine Darstellungsannahme, keine vermessenen Betriebspläne. Gebäudehöhen, Regale und Pflanzen sind ausdrücklich schematisch. Anzahl und Größe der Blattmodelle quantifizieren weder Pflanzdichte noch Jahresernte. Der Nutzanteil wird bei den VF-Regalflächen berücksichtigt; Gebäude- und Bruttogrundfläche bleiben davon verschieden.
- Die Pflanzen verwenden das detaillierte eigene Blender-Modell `public/models/lettuce.glb`. NFT-Regalböden, Tank, Pumpe, Lüftungsgerät und Erntewagen verwenden ebenfalls die vorhandenen eigenen Blender-GLBs. Gemeinsame Geometrie-/Materialpuffer, instanzierte Pflanzen und bedarfsgesteuertes Rendern begrenzen den Aufwand. Maßabhängige Gebäude- und Beetgeometrien, Glasflächen, Bewässerungsleitungen, lokale Oberflächentexturen, Umgebungslicht und Schatten verfeinern die Darstellung. Es handelt sich um Echtzeitgrafiken, nicht um neu gerenderte statische Cycles-Bilder.

Die fachlichen Referenzen, Jahresangaben und fehlenden harmonisierten Energie-/Klimadaten wurden nicht verändert. Die Grafik belegt keinen vollständigen Ressourcen-, Umwelt- oder Kostenvergleich.

## Prüfungen

33 Tests in acht Gruppen einschließlich vier Prüfungen für gemeinsame Flächen, unabhängig nachgerechnete Referenzflächen, sechs Ebenen und Randfälle sowie drei für die Kalibrierung des Maßstabsbalkens. 20 Produktions-Browserprüfgruppen decken zusätzlich den Wechsel aus Gewächshaus/Freiland in den VF-Rechner, erhaltene Erkundungsauswahl, echte WebGL-Grafik und wiederholte Vergleichswechsel ab. Tatsächliche 3D-Meshflächen, gemeinsame Bildschirmprojektion, sichtbare Linienlänge und Eckposition des Maßstabs werden auf Desktop, Tablet und Smartphone geprüft. Es gibt während des Modellaufbaus eine Ladeanzeige; keine Grundriss-Ersatzansicht. Bericht: `docs/browser-checks.json`.

TypeScript und Produktionsbuild bestanden. Der Brief bleibt bei 403 Wörtern und passt auf eine A4-Seite. Keine Prüfung auf physischem iPhone/Safari; keine Nutzerstudie.

## Geänderte Dateien

Die aktuelle Qualitätsüberarbeitung betrifft `src/components/ComparisonGraphic.tsx`, `ComparisonScene.tsx`, `comparison-graphic.css` und `src/lib/comparison-layout.ts`. `FarmScene.tsx` stellt seine vorhandenen Blender-Modell- und Lichtbausteine auch dem Vergleich bereit. Angepasst wurden `tests/browser.mjs`, `tests/comparison-layout.test.ts`, der Browserbericht, README und technische Dokumentation. Die feste Vergleichsansicht in `output/ersatzansichten` wurde aktualisiert. Die zuvor umgesetzte VF-Begrenzung liegt weiterhin in `src/App.tsx`.
