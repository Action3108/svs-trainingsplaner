# CLAUDE.md – Dauerhafte Projektregeln

Projekt: SV Schöning Trainingsplaner · Verein: SV Schöning 1926 e.V.

## Architektur
1. Mobile-first: React, Vite, JavaScript, SVG. Hosting: GitHub Pages (Base `/svs-trainingsplaner/`), Einbettung per Jimdo-iFrame.
2. Google Sheet (veröffentlicht) ist die einzige maßgebliche Quelle für produktive Übungen. GitHub enthält nur Code plus kleine Fallback-Datenbank (`src/data/fallbackExercises.json`).
3. Kein Login, keine Benutzerkonten, kein Firebase, keine personenbezogenen Spielerdaten, keine serverseitige Datenbank, keine Geheimnisse im Repo.

## Fachlich
4. Trainingsvorschläge folgen den DFB-Prinzipien: Freude, Intensität, Wiederholung, kleine Spielformen, hohe Nettospielzeit, viele Ballaktionen, altersgerechte Komplexität, wenig Wartezeit.
5. Jede Einheit enthält genau: Aufwärmen 1, Aufwärmen 2, Spielform 1, Übungsform, Spielform 2, Abschlussspiel.
6. Pflichtparameter: Jugend, Dauer, Schwerpunkt, Spielerzahl. Umbauten minimieren (max. 1 wesentlicher Umbau). Austauschübungen pro Abschnitt anbieten.
7. Nur `status = published`-Übungen mit gültigen Diagrammdaten verwenden. Keine Übungen oder Anpassungen erfinden.

## Grafiken und Quellen
8. Alle Übungsgrafiken selbst als SVG nach dem Visual Style Guide (docs/visual-style-guide.md). Keine fremden Grafiken kopieren. Koordinaten 0–100, Angriffsrichtung links → rechts.
9. Keine vollständigen fremden Texte/Bilder/PDFs/Videos übernehmen. Quelle und eigenständige Adaption dokumentieren. YouTube nur als geprüfter externer Link (`videoVerified = yes`).

## Vorgehen
10. PDFs vollständig im Browser erzeugen.
11. Testen ab 320 px Breite, Tablet, Desktop, Jimdo-iFrame. Touchflächen ≥ 44 px, kein horizontales Scrollen, keine Hover-Pflicht.
12. Vor jeder Aufgabe die Obsidian-Projektnotizen (Projekte/SVS Trainingsplaner) auf Entscheidungen und offene Punkte prüfen; danach aktualisieren.
13. Jede Phase mit Ziel/Risiken/Abnahmekriterien beginnen, nur freigegebene Phasen implementieren, nach jeder Phase testen und dokumentieren.
14. Nichts ohne ausdrückliche Freigabe veröffentlichen.
