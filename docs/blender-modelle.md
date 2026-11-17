# Eigene Blender-Modelle und Renderbilder

Die Modelle wurden am 16.11.2026 in **Blender 5.2.0 LTS** für dieses Projekt aufgebaut. Keine Stockmodelle, Fototexturen, HDRI-Dateien oder KI-generierten Bildvorlagen wurden verwendet. Sämtliche Geometrie, Materialien, Beleuchtung und Kamerapositionen entstehen aus den zwei lokal enthaltenen Python-Skripten. Die Formen sind fachliche Illustrationen, keine Ausführungsplanung eines konkreten Betriebs.

## Editierbare Originale

`output/blender` enthält `.blend`-Dateien für die drei Anbausysteme, die Nahansicht und die einzelnen Bauteile. Objekt- und Sammlungsnamen benennen die Modellbestandteile. Geometrie und PBR-Materialien bleiben editierbar.

- **Vertical Farm:** vier bepflanzte Anbauebenen, Aluprofile mit Langlöchern, vier NFT-Kanäle je Träger, Pflanzkragen, LED-Diffusoren, technische Zu- und Rückläufe, Tank mit Füllstandsskala, Motorpumpe mit Manometer, Klimagerät mit Schutzgittern und Ventilatorblättern, Rolltisch und Erntekisten.
- **Gewächshaus:** Bodenbeete und Sonnenlichtnutzung, Satteldach aus selbst modellierten Glasfeldern und Aluminiumrahmen, konstruktive Rippen, geöffneter Dachbereich, Bewässerung, IBC-Behälter und Erntekisten. Keine künstlich beleuchteten Regalebenen.
- **Freiland:** geformte Bodenbeete, geschnittenes Bodenprofil mit Schichten, Tropfrohre, Wasseranschluss/IBC und Erntebereich. Einfache lokale Bodenoberflächen werden durch selbst erzeugte Geometrie und prozedurale Shader beschrieben.
- **Salatdetail:** weich gekrümmte, breite elliptische Blätter mit gewellten Rändern, modellierter Mittelrippe, korrelierten Vertexfarben und feinem prozeduralem Aderrelief. Die Nahansicht zeigt außerdem NFT-Kanäle, Pflanzkragen und LED-Schienen.

Die Salatblätter wurden nach Nahansichtkontrolle überarbeitet: engere Abtastung an den gerundeten Blattspitzen, deutlich feinere Netze, niedrigere Wellenfrequenzen, sanfte Oberflächenglättung und räumlich zusammenhängende Farbverläufe ersetzen die zunächst zu spitzen Blattformen.

## Lokal gerenderte Grafiken

Unter `public/renders` liegen:

| Datei | Inhalt |
|---|---|
| `vertical-farm.png` | Schnittmodell der vertikalen Farm mit vier Ebenen |
| `greenhouse.png` | Sonnenlichtnutzendes Gewächshaus mit Bodenbeeten |
| `field.png` | Freiland mit sichtbarer Boden- und Bewässerungsstruktur |
| `lettuce-detail.png` | Perspektivische Nahansicht der Salate und Anbautechnik |
| `manifest.json` | Herkunft, Auflösung, Renderer, Kameratyp, Referenzzustand und zugehörige `.blend`-Dateien |

Alle vier finalen Bilder sind **2.048 × 1.408 Pixel**, mit **Cycles auf NVIDIA RTX 4070 über OptiX**, bis zu **128 adaptiven Samples** und Rauschreduktion gerendert. Drei große Flächenleuchten, eine neutrale Umgebung und weiches Sonnenlicht erzeugen die Architekturmodell-Aufnahmen. Die Nahansicht verwendet eine 67-mm-Perspektivkamera und zurückhaltende Schärfentiefe bei f/9. Die Belichtung wurde für bessere Materialtrennung um 0,2 Blendenstufen gesenkt.

Das sind **feste Referenzbilder**, keine Ansichten des aktuellen Rechenzustands. Die Abbildungen werden einzeln gerahmt und erlauben keinen gemeinsamen Längenmaßstab. Der quantitative Vergleich bleibt im Szenariorechner und seinen gekennzeichneten Diagrammen.

## Echtzeitmodelle

Die Anwendung erhält zusätzlich lokal exportierte, unkomprimierte **glTF-2.0-Dateien (`.glb`)** unter `public/models`. Blender-Z-up wird beim Export in glTF-Y-up umgewandelt. Alle Dateien enthalten ihre Geometrie und Materialien; es werden keine externen Decoder oder Texturen nachgeladen.

| Datei | Aufbau / Verwendung |
|---|---|
| `lettuce.glb` | Eine Geometrie, ein Material, 7.560 Dreiecke; modellierte Blattform und Vertexfarben |
| `lettuce-low.glb` | Gleiche Grundform mit 2.520 Dreiecken für sparsame Grafik |
| `rack-tier.glb` | NFT-Kanäle, Pflanzkragen, Endkappen und Aluträger; ohne LED-Schienen, die die interaktive Szene separat platziert |
| `tank.glb` | Tank, Deckel, Skala, Beschriftung und Anschluss |
| `pump.glb` | Pumpe, Motor, Kühlrippen, Schrauben, Anschlüsse und Manometer |
| `air-handler.glb` | Klimagerät mit Ventilatoren, Schutzgittern, Lüftungsschlitzen und Servicepaneelen |
| `harvest-cart.glb` | Rolltisch, Rollen, Kisten und Waage |

Die Echtzeit-Pflanzen können instanziert werden. Hochauflösende Renderpflanzen verwenden einen einmal geglätteten, gemeinsam genutzten Prototyp; dadurch entstehen nicht hunderte unabhängige, speicherintensive Subdivision-Kopien. Der Render-Shader ergänzt feinere Aderreliefs; die Echtzeitfassung bewahrt die geformten Mittelrippen und Vertexfarben.

## Reproduzieren

Im Projektordner in PowerShell:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python 'scripts\blender\build_assets.py' -- --assets
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python 'scripts\blender\build_assets.py' -- --detail --render-all
```

Die erste Zeile erzeugt die Echtzeitdateien und editierbaren Bauteile. Die zweite baut die Szenen, speichert deren `.blend`-Originale und rendert alle vier finalen Abbildungen. Eine schnelle Vorschau ist mit `--scene vertical --preview`, `--scene greenhouse --preview`, `--scene field --preview` oder `--detail --preview` möglich. Vorschauen landen unter `output/blender`.

Für fehlendes OptiX steht ein CPU-Fallback im Skript bereit. Das Skript verändert ausschließlich die eigene Blender-Szene und die hier genannten Projektdateien. Blender meldet für `Material.use_nodes`/`World.use_nodes` einen Hinweis auf eine künftige API-Änderung in Version 6.0; in der verwendeten Version ist dies kein Fehler.

## Prüfung und Grenzen

Die `.glb`-Dateien wurden aus Blender exportiert und ihr glTF-JSON geprüft: keine externen Buffer-/Bilddateien, Salat mit `POSITION`, `NORMAL` und `COLOR_0`, ein Material und die angegebenen Dreieckszahlen. Die vier endgültigen Renderbilder wurden visuell auf Materialwirkung, Geometrie, Kameraführung und Fehler geprüft. Alle elf `.blend`-Originale wurden mit Blender erneut geöffnet. Ergebnisse stehen in `output/blender/validation.json`; reproduzierbar mit `--background --python scripts/blender/verify_assets.py`. Die Browserprüfung kontrolliert zusätzlich Laden, Interaktion, Galerie und Grafikqualität.

Die Formvariation der Salate illustriert Pflanzen, sie ist weder ein botanisch kalibriertes Wachstumsmodell noch ein Nachweis garantierter Erträge. Geometrische Platzierung, technische Apparate und Renderbeleuchtung liefern keine Betriebsmesswerte oder Energiekennzahlen.
