# Designsystem – SV Schöning Trainingsplaner

Stand: 2026-07-13 · Verbindlich für alle UI-Arbeit.

## Grundsätze

Schwarz und Weiß sind die Vereinsfarben, in der UI aber bewusst entschärft: **Anthrazit `#383834`** ersetzt reines Schwarz auf allen Flächen und Überschriften, Fließtext ist `#33332F`, der Seitenhintergrund ist Hellgrau `#F5F5F3` mit weißen Karten darauf, abgesetzte Flächen nutzen **Soft-Grau `#ECECE9`**. Das vermeidet harte Maximalkontraste bei langem Lesen. **Reines Schwarz `#000000` bleibt ausschließlich dem Vereinslogo und den Übungsgrafiken vorbehalten** (dort gilt der Visual Style Guide unverändert). Orange (`#F59E0B` Ball, `#F97316` Hütchen) ist ausschließlich funktional: in Übungsgrafiken, für den Fokus-Ring und für Hinweise – nie dekorativ. Mobile-first ab 320 px, Touchflächen mindestens 44×44 px, keine Funktion nur per Hover.

## Logo

Schwarz-weißes Wappen mit Diagonalbanner „SCHÖNING", „SV" oben links, „1926" unten rechts. Regeln: nie verzerren, nie einfärben, Schutzraum mindestens ¼ der Logohöhe an allen Seiten. Im schwarzen Header liegt es auf weißer Kachel (`.svs-header__logo`), damit das schwarze Wappen sichtbar bleibt. Datei: `public/assets/sv-schoening-logo.png` (SVG-Ersatz wünschenswert, siehe Offene Punkte).

## Design Tokens

Alle Werte in `src/styles/tokens.css` als CSS-Custom-Properties. Kurzreferenz:

| Gruppe | Tokens |
| --- | --- |
| Farben | `--c-black` #000 (nur Logo/Grafiken), `--c-anthracite` #383834 (= `--c-primary`), `--c-heading` #1C1C1A, `--c-text` #33332F, `--c-text-muted` #5D5D58, `--c-bg` #F5F5F3, `--c-surface` #FFF, `--c-gray-soft` #ECECE9, `--c-gray-mid` #A3A3A3, `--c-border`, `--c-accent-ball` #F59E0B, `--c-accent-cone` #F97316, `--c-danger`, `--c-success` |
| Zustände | `--c-hover`, `--c-active`, `--c-focus-ring` (orange, 3px), `--c-disabled-*` |
| Typografie | System-Font-Stack; `--fs-xs` 12px bis `--fs-2xl` 28px; Fließtext nie unter 16px |
| Abstände | 4er-Raster `--sp-1` (4px) bis `--sp-7` (48px) |
| Radien | `--r-sm` 6, `--r-md` 10, `--r-lg` 16, `--r-full` |
| Schatten | `--shadow-card`, `--shadow-raised`, `--shadow-sheet` |
| Interaktion | `--touch-min` 44px, `--focus-outline` |

## Komponenten (`src/components/ui/`)

| Komponente | Zweck | Hinweise |
| --- | --- | --- |
| `Header` | Logo + Titel, schwarzer Balken | Druckansicht: weiß mit schwarzer Unterkante |
| `Button` | Varianten primary/secondary/ghost/danger, `block` | immer ≥ 44px, sichtbarer Fokus-Ring |
| `SelectField` | Label + Select + Hint/Fehler | Label programmatisch verknüpft, Fehler mit `role=alert` |
| `TrainingCard` | Aufklappbare Übungskarte (`<details>`) | Phase-Badge, Meta rechts; im Druck immer offen |
| `Dialog` | Modal auf `<dialog>`-Basis | Bestätigungen (z. B. Übung ersetzen) |
| `BottomSheet` | Mobiles Auswahlpanel von unten | Escape + Backdrop-Klick schließen; ab 768px zentriert |
| `.svs-note` (CSS) | Hinweis mit orangem Balken | einzige dekorativ sichtbare Orange-Nutzung |

## Kontraste

Alle Kombinationen bleiben deutlich über WCAG AA: Anthrazit #383834 auf Weiß ≈ 11,4:1, Fließtext #33332F auf #F5F5F3 ≈ 11:1, Weiß auf Anthrazit ≈ 11,4:1, `--c-text-muted` #5D5D58 auf Weiß ≈ 6,6:1. Bewusst kein 21:1-Maximalkontrast im Lesetext. Orange wird nie als Textfarbe auf Weiß verwendet (nur Balken/Fokus/Grafikobjekte).

## Komponenten-Vorschau

`npm run dev`, dann `http://localhost:5173/svs-trainingsplaner/?preview=1` – zeigt alle Komponenten inkl. Dialog und Bottom Sheet. Prüfbreiten: 320 / 375 / 390 / 430 / 600 / 768 / 1024 px.
