# Herkunft, Assets und Lizenzen

Stand 16.11.2026. Die Anwendung übernimmt keine fremden Fotos, Bildsammlungen, Texturen oder heruntergeladenen 3D-Modelle. Fachquellen liefern belegte Daten und paraphrasierte Erkenntnisse; sie sind keine Dekorationsassets.

| Bestandteil | Herkunft | Nutzungs- und Weitergabehinweis |
|---|---|---|
| 3D-Pflanzen, NFT-Regalebenen, Tanks, Pumpen, Klima- und Erntetechnik | Selbst modelliert mit Blender; Aufbau unter `scripts/blender`, editierbare Dateien unter `output/blender`, GLB unter `public/models` | Eigene Geometrie und Materialien; keine fremden Modell- oder Texturdaten übernommen |
| Gerenderte Modellszenen | Eigene Blender-Szenen, lokal mit Cycles gerendert; Bilder unter `public/renders` | Feste Referenzansichten; Herkunft und Renderparameter in `docs/blender-modelle.md` und `public/renders/manifest.json` |
| Parametrische Gebäudehüllen, Leitungen und Kameraführung | Ergänzende eigene Geometrie und Interaktion in `FarmScene.tsx` | Erhält Ebenenzahl, Schnittansicht und veränderbare Modellgrößen |
| Ersatzschemata und Datenvisualisierung | Eigene SVG-/HTML-/CSS-Geometrie aus Modellwerten | Im Projekt erstellt; keine externen Bilddateien erforderlich |
| Oberfläche und Druckgestaltung | Projektcode und CSS | Im Projekt erstellt; Fachquellen bleiben separat benannt |
| Phosphor Icons | `@phosphor-icons/react`, Phosphor Icons | MIT, Copyright 2020 Phosphor Icons; Lizenz unter `node_modules/@phosphor-icons/react/LICENSE` |
| Manrope Variable | `@fontsource-variable/manrope`; Manrope Project Authors, 2019 | SIL Open Font License 1.1; lokal gebündelt, unveränderte Schrift. Lizenz unter `node_modules/@fontsource-variable/manrope/LICENSE` |
| Unterrichtsdossier | Vom Nutzer bereitgestellter Scan, unverändert in `public/material/aufgabenstellung.pdf` | Lokale fachliche Arbeitsgrundlage; keine pauschale Weiterveröffentlichungsfreigabe unterstellt |
| Literatur- und Institutsquellen | Vollständige Herkunft und Fundstellen in `src/data/catalog.ts` und Recherchedateien | Verlinkt und knapp paraphrasiert; keine vollständigen Originalpublikationen in die App übernommen |

## Verwendete Software

React, React DOM, Three.js, React Three Fiber, Drei, Vite und tsx sind unter MIT lizenziert. TypeScript und Playwright verwenden Apache-2.0. Manrope verwendet OFL-1.1. Versionen sind in `package-lock.json` festgehalten. Transitive Abhängigkeiten behalten ihre eigenen Lizenzbedingungen.

Die Lizenztexte der sieben direkt verwendeten Laufzeitpakete einschließlich Schrift und Symbolen liegen zusammen mit `NOTICE.txt` unter **`public/lizenzen`**. Vite übernimmt dieses Verzeichnis beim Build nach `dist/lizenzen`. Die Texte wurden unverändert aus den installierten Paketen kopiert. Da das R3F-Paket keinen Lizenztext enthielt, stammt dessen MIT-Text aus dem am 16.11.2026 geöffneten offiziellen Repository; Herkunft und Copyright sind im NOTICE vermerkt. Entwicklungswerkzeuge werden nicht pauschal in das Laufzeitverzeichnis kopiert.

Bei Weitergabe des Builds sind mitgelieferte Lizenz- und Copyright-Hinweise zu erhalten. MIT verlangt insbesondere die Beibehaltung des Copyright- und Lizenzhinweises; bei der Schrift ist die OFL mitzugeben. Das Nutzer-PDF darf durch diese Softwarelizenzen nicht als frei veröffentlichbar missverstanden werden. Eine externe Veröffentlichung der Anwendung wurde nicht beauftragt.

Offizielle Herkunft: [Phosphor](https://github.com/phosphor-icons/react), [Manrope](https://github.com/sharanda/manrope), [Fontsource](https://fontsource.org/fonts/manrope), [Three.js](https://github.com/mrdoob/three.js), [React Three Fiber](https://github.com/pmndrs/react-three-fiber).

