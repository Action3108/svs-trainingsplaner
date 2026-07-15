# Trainingsgenerator

Stand: 2026-07-15 · Implementierung: `src/logic/generator.js` · Tests: `tests/generator.test.js`

## Eingaben

`generateTraining(db, { ageGroup, duration, focus, players, variant })`

- `ageGroup`: G/F/E/D/C/B/A
- `duration`: Gesamtdauer in Minuten
- `focus`: Schwerpunkt (aus Lists → focusAreas)
- `players`: 4–30
- `variant`: 0–4 für alternative Gesamtpläne bei unveränderten Filtern

## Regeln

**Harte Ausschlüsse (vor jeder Bewertung):** Altersgruppe nicht enthalten ·
Spielerzahl außerhalb min/max (außer über parallele Felder lösbar) · ungerade
Spielerzahl ohne hinterlegte Lösung (`oddPlayerSolution`/`restPlayersAllowed`) ·
Kombination erreicht die Gesamtdauer nicht (Summe min/max aller sechs Übungen).
Nicht-published-Übungen und Übungen ohne gültiges Diagramm sind bereits durch
die Sheet-Anbindung ausgeschlossen.

**Bewertungsmatrix (je Übung):** Alter 20 % · Schwerpunkt 20 % (Hauptschwerpunkt
1,0 / enthalten 0,85 / sonst 0) · Spielerzahl 20 % (Nähe zu preferredPlayers) ·
Phase 15 % · Dauer 5 % · Material 5 %. Die Feldkompatibilität (15 %) wird auf
**Kombinationsebene** bewertet.

**Umbauoptimierung:** Bewertet wird die gesamte Einheit, nicht sechs Einzelwahlen.
Je Phase gehen die besten 6 Kandidaten in die Kombinationssuche; Übergänge mit
gleichem Feld-Schlüssel (`fieldTemplate`, sonst Feldmaße) erhöhen den Score,
Umbauten über `maxSetupChanges` (Settings, Standard 1) werden bestraft.
`rebuildChanges` liefert die Daten für die Umbauampel der UI.

**Zeitverteilung:** Start bei `durationMin` je Übung, Rest wird reihum bis
`durationMax` verteilt – die Summe entspricht immer exakt der Gesamtdauer.

**Organisation:** Felderzahl (parallele Felder), Spieler je Feld, Torhüter,
Mannschaftsaufteilung („4 gegen 4 + 1“) und die hinterlegte Lösung für den
überzähligen Spieler. Es wird nichts erfunden – bei fehlenden Kandidaten kommt
`{ ok: false, missingPhases, details }` zurück.

## Beispielausgabe (Fallback-DB, E-Jugend, 90 min, Passspiel, 8 Spieler)

```text
Aufwärmen 1   Dribbelgarten            12 min · 1 Feld · 4 gegen 4
Aufwärmen 2   Passquadrat              15 min
Spielform 1   3 gegen 3 auf 4 Minitore 15 min
Übungsform    Andribbeln und Torschuss 15 min
Spielform 2   3 gegen 3 mit Zielzone   15 min
Abschlussspiel Spiel auf zwei Tore     18 min
Summe: 90 min · Material: Bälle, Hütchen, Minitore, Jugendtore, Leibchen
```

## Offen für spätere Phasen

- UI (Filter, Ergebniskarten, Umbauampel) → Phase „Mobile Oberfläche“
- Übungsaustausch je Karte → eigene Phase (nutzt dieselben Filterregeln)
- Optionale Eingaben (Torhüterzahl, Tore, Material, Platzgröße, Niveau)
