# Recherche und Gestaltungsprüfung

Stand: 16.11.2026. Die unten genannten Originalseiten wurden geöffnet und die relevanten Abschnitte gelesen. Geprüft wurden außerdem `src/App.tsx`, die Inhalts-, Vergleichs-, Szenario- und Galeriekomponenten sowie die vorhandene Laptopaufnahme unter `output/ansicht-laptop.png`.

## Aussagegrenze

Ein Farbton, eine Schrift, eine Karte oder ein großer Titel beweist keine KI-Autorschaft. Hier geht es um wiederholte, unpassende Gestaltungsmuster und deren Wirkung auf die Benutzung. Auch ein bewusst gestaltetes Produkt braucht vertraute Schaltflächen, Tabellen und Navigation. Eine neue modische Oberfläche allein beseitigt keine gestalterische Austauschbarkeit.

## Gelesene Quellen

### Empirische und konzeptionelle Forschung

**Goree, Doosti, Crandall und Su (CHI 2021): Investigating the Homogenization of Web Design: A Mixed-Methods Approach.** [Originalvolltext](https://aux.engineering.ucsc.edu/publications/Goree_Doosti_Crandall_Su-HomogenizationWebDesign-CHI21.pdf), DOI 10.1145/3411764.3445156. Fundstellen: S. 1–4, besonders Methode und Datensätze; Diskussion und Einschränkungen. Computer-Vision-Analyse von 227.802 Screenshots aus 10.482 Websites, historische Daten 2003–2019, ergänzt durch elf Experteninterviews. Die gemessene Layoutdifferenz sank im untersuchten Zeitraum deutlich. Wichtig für die Einordnung: Diese Konvergenz existierte bereits vor heutiger generativer KI. Archiv-, Auswahl- und englischsprachige US-Schwerpunkte begrenzen die Verallgemeinerung. Die Autoren erkennen auch den Nutzwert vertrauter Muster an. Die Studie ist kein KI-Erkennungsverfahren.

**Shin et al. (2026): Interrogating Design Homogenization in Web Vibe Coding.** [Originalvolltext](https://arxiv.org/html/2603.13036v1), eingereicht 13.03.2026. Fundstellen: § 3.1 Methoden, § 5 Gegenmaßnahmen, § 7 Grenzen. Literatur- und Toolanalyse, soziotechnische Risikoanalyse und konzeptionelle Fallstudien beschreiben, wie ungeprüfte Standardausgaben Gestaltung verengen können. Bewusstes Prüfen von Annahmen und kontextbezogene Entscheidungen werden als Gegenmaßnahmen vorgeschlagen. Es handelt sich nicht um eine repräsentative Messung aller KI-Websites und nicht um eine validierte Merkmalsliste zur Autorschaftsbestimmung. Für diese Anwendung folgt daraus eine bewusste Aufgabenhierarchie statt bloß anderer Farben.

### Nutzbarkeit und Textmenge

**Jakob Nielsen / Nielsen Norman Group (03.12.2006): Progressive Disclosure.** [Originalartikel](https://www.nngroup.com/articles/progressive-disclosure/). Fundstellen: „Benefits“ und „Usability Criteria“. Häufig gebrauchte Optionen gehören in die Hauptansicht; spezialisierte Funktionen und Detailinformationen werden verständlich beschriftet nach Bedarf geöffnet. Das bedeutet nicht, notwendige Funktionen zu verstecken. Entscheidend ist die passende Trennung für die konkrete Aufgabe. Für Stadtlabor bleiben Modell, Systemwechsel, wichtige Resultate und Belegzugang unmittelbar erreichbar; ausführliche Herleitungen und Kontexttexte können nachgeordnet werden.

**John Morkes und Jakob Nielsen (1997): Concise, Scannable, and Objective: How to Write for the Web.** [Originalstudienbericht](https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/). Fundstellen: Studie 3, Tabelle 2, Grenzen/Future Research. 51 Personen testeten fünf Textvarianten einer Website. Kürzere, überfliegbare und sachliche Texte waren im untersuchten Szenario vorteilhaft. Die alten, begrenzten Versuchsanordnungen liefern keine Prozentprognose für unsere App. Übertragbar ist die zu prüfende Gestaltungsregel: konkrete Titel, passende Textmenge und Informationen, die die aktuelle Aufgabe unterstützen. Keine Werbesprache oder wiederholten Einleitungen als Füllmaterial.

**Kelley Gordon / Nielsen Norman Group (2020, geprüft 01.09.2026): 5 Principles of Visual Design in UX.** [Originalartikel](https://www.nngroup.com/articles/principles-visual-design/). Fundstellen: Scale, Visual Hierarchy, Balance, Contrast. Größe, Anordnung, Kontrast und Abstand sollen der Wichtigkeit folgen. Symmetrie und Asymmetrie können beide sinnvoll sein; größere Schrift oder mehr Weißraum sind kein Selbstzweck. Für die App hat das räumliche Modell Vorrang vor dekorativen Zwischenüberschriften. Kleine Belegtexte dürfen nachgeordnet sein, müssen aber lesbar bleiben.

### Designkritik, keine allgemeinen Beweise

**Vanessa Porter / Creative Bloq (06.06.2026): Everything looks the same. Now what?** [Artikel](https://www.creativebloq.com/ai/everything-looks-the-same-now-what). Der Kommentar beschreibt die Verstärkung schon vorhandener Branchenschablonen und fordert bewusst gewählte, eigenständige Referenzen. Das ist gestalterische Kritik, kein kontrollierter Nachweis typischer KI-Merkmale. Für Stadtlabor sind die eigens gebauten Modelle eine konkrete Stärke; sie brauchen keine zusätzliche, austauschbare Werbeinszenierung.

**Weston Baker / Morphic: Why AI-Generated Websites All Start to Look the Same.** [Originalanalyse](https://www.getmorphic.com/resources/ai-creative-intelligence/why-ai-generated-websites-look-the-same/), Abruf 16.11.2026, kein verlässlich ausgewiesenes Publikationsdatum. 17 generierte Homepages für dieselbe fiktive Firma wurden redaktionell in etwa fünf gestalterische Familien eingeordnet. Trotz anderer Farben blieb die Kommunikationsstruktur häufig ähnlich. Die Einordnung ist subjektiv, klein und stammt von einem Anbieter mit Geschäftsinteresse. Der Artikel warnt selbst vor einer pauschalen Verbotsliste für Karten, Schriften oder Weißraum.

Ungeprüfte Reddit-Statistiken, Detektorwerbung und Suchausschnitte wurden nicht als Belege übernommen.

## Befunde am bisherigen Stadtlabor

Die folgenden Bewertungen sind eine konkrete Gestaltungsprüfung, keine statistische KI-Diagnose.

| Befund | Fundstelle / Wirkung | Konsequenz für die Überarbeitung |
|---|---|---|
| Sehr großer globaler Einstieg auf jedem Bereich | `App.tsx`: dieselbe große Förderfrage, Unterzeile und Statusangabe bleiben über Rechner, Vergleich und Editor stehen. Die eigentliche Arbeit beginnt auf dem Laptop erst nach einem hohen Kopfbereich. | Kompakter Einstieg; funktionsbezogene Seitentitel. Das Modell früher und größer zugänglich machen. |
| Viele dekorative Zwischenetiketten | `eyebrow`-Texte in App, Knowledge, Szenario, Vergleich und Galerie; oft sehr klein, versperrt und großgeschrieben. | Auf wenige tatsächlich orientierende Kennzeichnungen reduzieren. Labels wie Einheiten und Quellen behalten; dekorative Zweitüberschriften streichen. |
| Inhalt wird als Slogan verpackt | Beispielsweise „Eine Referenz ist noch kein Betrieb“, „Drei Systeme. Zwei Perspektiven“, wiederkehrende zweiteilige Titel. | Direkte Titel wie „Vergleich“, „Daten aus M3“ oder „Modellannahmen“. Keine neue austauschbare Marketingmetapher als Ersatz. |
| Erkundung wird zur sehr langen Abfolge gleich gewichtiger Abschnitte | Interaktives Modell, große Rendergalerie, Ressourcen, drei Standorttexte, Behauptungscheck, Datenkritik und Zielkonflikte folgen nacheinander. | Die erste Ansicht auf Erkunden ausrichten. Pflichtwissen zugänglich erhalten, aber gruppiert und bedarfsabhängig anzeigen. Renderansichten als erkennbare Alternative/Ergänzung anbieten. |
| Viel Fläche für Etiketten, wenig für gut lesbare Arbeitsinformation | Zahlreiche 8–11-px-Texte, kleine Quellenlinks und große Abstandszonen; gleiche Naturfarbe für fast jede Oberfläche. | Weniger Typostufen, größere normale Schrift, klarerer Kontrast zwischen Arbeitsfläche, Ergebnissen und Details. Kein pauschaler Schriftwechsel nötig. |
| Mehrere gleichartige visuelle Rahmungen | Umrandete Schaltergruppen, runde Nummern, Panelrahmen, Kennzahlen und Galerierahmen konkurrieren. | Rahmen nur dort verwenden, wo sie Funktion oder Zugehörigkeit erklären. Gewöhnliche erklärende Absätze brauchen keine eigene Karte. |
| Warnungen wiederholen sich in ähnlicher Form | Szenariomodell, keine Betriebsprognose, Teilkosten, Teilbilanz, Referenzgrenzen erscheinen an vielen Stellen. | Eine präzise, gut sichtbare Grundkennzeichnung plus kontextbezogene Einschränkungen; vollständige Erläuterungen im Belegbereich. Die Bedeutung von Kosten und Emissionen weiterhin direkt am Wert nennen. |

## Was erhalten bleiben sollte

- Eigene Blender-Modelle und lokale Renderings statt austauschbarer Fremdbilder.
- Echte Daten, Einheiten, Aussagegrenzen und anklickbare Quellen; keine erfundene Nachhaltigkeitsrangliste.
- Die vier verständlichen Arbeitsbereiche und funktionierende Rechner-, Vergleichs- und Druckwege.
- Sichtbare Tastaturfokusse, Touchbedienung, reduzierte Bewegung und technische Ersatzansichten.
- Begründete Förderentscheidung und alle schulischen Pflichtinhalte, auch wenn sie nicht alle sofort aufgeklappt erscheinen.

## Maßstab für die Umsetzung

Das Ziel ist eine sachliche Arbeitsoberfläche für eine Geographiepräsentation. Ein gutes Ergebnis lässt schnell erkennen, was man ansehen, verändern, vergleichen und entscheiden kann. Fachliche Tiefe bleibt erreichbar; wiederholte Einleitungen, dekorative Etiketten und unbegründete Layoutwiederholungen werden reduziert. Ein bewusst ungewöhnlicher, aber schlechter bedienbarer Entwurf wäre kein Fortschritt.
