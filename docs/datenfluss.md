# Datenfluss: Google Sheet → App

Stand: 2026-07-15

## Quelle

Das Google Sheet (`SV Schöning – Übungsdatenbank Trainingsplaner`) ist die
einzige maßgebliche Quelle für produktive Übungen. Die App liest vier Tabs
als CSV: `Settings`, `Lists`, `Exercises`, `Diagrams`.

- Bevorzugt: Publish-CSV-Links („Datei → Freigeben → Im Web veröffentlichen“),
  eingetragen in `src/config.js` → `PUBLISHED_CSV_URLS`.
- Solange dort kein Link steht, nutzt die App die gviz-CSV-Schnittstelle
  (`/gviz/tq?tqx=out:csv&sheet=<Tab>&headers=1`).

## Ablauf beim App-Start

1. `loadDatabase()` (`src/logic/sheetClient.js`) lädt alle vier Tabs
   (Timeout je Tab: 10 s).
2. `csv.js` parst RFC-4180-konform (Anführungszeichen, Kommas und
   Zeilenumbrüche in Zellen, BOM, CRLF).
3. `sheetSchema.js` validiert jede Zeile. Nur `status = published` wird
   verwendet; eine Übung braucht zusätzlich ein gültiges published-Diagramm
   (`diagramData`-JSON wird gegen das Diagramm-Schema geprüft).
4. Fehlerhafte Zeilen werden übersprungen und im Fehlerprotokoll
   (`db.errors`) vermerkt – sie blockieren nie die App.
5. Bei Erfolg wird die Datenbank mit Zeitstempel im `localStorage`
   gespeichert (`CACHE_KEY` in `src/config.js`, versioniert).

## Fallback-Kette

1. aktuelles Google Sheet (Netz)
2. letzte gültige lokale Kopie (localStorage, mit Zeitstempel)
3. `src/data/fallbackExercises.json` (6 eigene Übungen, eine je Phase,
   `databaseVersion = fallback`)

`useDatabase()` (React-Hook) liefert `{ status, db, source, updatedAt, errors }`;
`DataStatus.jsx` zeigt „Daten aktualisiert am …“, den Offline-Hinweis mit
Cache-Stand oder die Fallback-Warnung.

## Grenzen / Hinweise

- localStorage kann im Jimdo-iFrame (Safari/ITP) blockiert sein – der Zugriff
  ist fehlertolerant gekapselt; dann greift direkt der Repo-Fallback.
- Eine leere Sheet-Antwort (z. B. Berechtigungsseite statt CSV) wird als
  Fehler gewertet, damit kein leerer Datenstand den Cache überschreibt.
- Tests: `tests/sheet.test.js` (Parser, Schema, published-Filter,
  Fallback-Kette, defekte Zeilen, HTTP-Fehler).
