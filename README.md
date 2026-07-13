# SV Schöning Trainingsplaner

Mobile-first Web-App zur DFB-orientierten Planung von Jugendfußball-Trainingseinheiten für den SV Schöning 1926 e.V.

## Ziel
Trainerinnen und Trainer wählen Jugend (G–A), Dauer, Schwerpunkt und Spielerzahl – die App erzeugt eine vollständige Einheit aus sechs Phasen (Aufwärmen 1+2, Spielform 1, Übungsform, Spielform 2, Abschlussspiel) mit SVG-Feldgrafiken, Coachingpunkten, Varianten und PDF-Export. Jede Übung ist austauschbar.

## Architektur
- **Frontend:** React + Vite (JavaScript), SVG-Grafiken, PDF im Browser
- **Daten:** Veröffentlichtes Google Sheet (Exercises, Diagrams, Lists, Sources, Settings) als Single Source of Truth; Fallback: Browser-Cache → `src/data/fallbackExercises.json`
- **Hosting:** GitHub Pages (`/svs-trainingsplaner/`), Einbettung per iFrame in Jimdo
- Kein Login, keine Benutzerkonten, keine personenbezogenen Daten, kein Server

## Lokale Einrichtung
```bash
npm install
npm run dev      # Entwicklungsserver
npm run test     # Vitest
npm run lint     # ESLint
npm run build    # Produktionsbuild nach dist/
```

## Projektstruktur
```text
public/assets      Logo und statische Assets
src/components     UI-Komponenten
src/data           Fallback-Daten, Sheet-Anbindung-Konfiguration
src/logic          Trainingsgenerator, Bewertung, Austauschregeln
src/pdf            PDF-Erzeugung im Browser
src/styles         Design Tokens und CSS
docs               Dokumentation (Designsystem, Diagramm-Schema)
docs/project-brain Projektnotizen-Spiegel (Obsidian)
research           Recherche-Arbeitsstände (nicht produktiv)
tests              Vitest-Tests
```

## Phasenplan
1. ✅ Grundgerüst (React/Vite, ESLint, Vitest)
2. CI/Designsystem (Design Tokens, Komponenten-Vorschau)
3. Google-Sheet-Struktur und Beispieldaten
4. Visual Style Guide + SVG-Renderer
5. Sheet-Anbindung mit Cache und Fallback
6. Trainingsgenerator
7. Mobile UI
8. Übungsaustausch
9. YouTube-Links
10. PDF, Druck, Teilen
11. UX/UI-Review, Gesamttest
12. GitHub Pages Release, Jimdo-Einbettung

## Regeln
Siehe [CLAUDE.md](./CLAUDE.md). Keine Geheimnisse im Repo. Nichts ohne Freigabe veröffentlichen.
