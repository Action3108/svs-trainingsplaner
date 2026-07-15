# Designsystem V2 „Modern Coaching Workspace"

Stand: 2026-07-14 · Status: **zur Freigabe** (V1 bleibt bis zur Entscheidung erhalten, Umschalter in der Vorschau)

## Konzept

Massentaugliches, markenunabhängiges Erscheinungsbild für eine später monetarisierbare Trainingsapp: heller grün-getönter Workspace, dunkelgrüne Primärflächen, Limetten-Akzent für hervorgehobene Aktionen. Das Vereinslogo bleibt unverändert im Header; die Oberfläche funktioniert unabhängig von der Vereins-CI. **Übungsdiagramme behalten ihren eigenen Visual Style Guide** (voller Kontrast, unverändert).

## Design Tokens (V2, aktiv über `data-theme="v2"`)

| Token | Wert | Verwendung |
| --- | --- | --- |
| `--c-bg` | #F4F7F5 | Seitenhintergrund |
| `--c-surface` | #FFFFFF | Karten, Panels, Formulare |
| `--c-gray-soft` | #EAF2EC | sekundäre Flächen, Hover |
| `--c-primary` | #163A2D | Header, Primärbuttons, Badges |
| `--c-hover` | #0F2A20 | Hover/Aktiv auf Primär |
| `--c-accent` | #B7F36B | Akzent-Button, Hervorhebungen |
| `--c-text` | #101828 | Fließtext |
| `--c-text-muted` | #475467 | Sekundärtext |
| `--c-border` | #D0D5DD | Rahmen |
| `--c-info` | #2563EB | Informationskarte |
| `--c-warn-bg` / `--c-warn-text` | #FFF4CC / #7A4D00 | Warnkarte |
| `--c-danger` | #B42318 | Fehler |
| Typografie | Manrope 800 (Überschriften), Inter 400/600 (Text/Bedienung) | Google Fonts, Fallback system-ui |
| Abstände | 4/8/12/16/24/32/48 px (`--sp-1`…`--sp-7`) | unverändert |
| Radien | Karten 20 px, Formulare/Buttons 14 px | `--r-lg`/`--r-md` |
| Schatten | 0 1px 2px + 0 1px 3px rgba(16,24,40,…) | dezent |
| Touch | min. 48 px (`--touch-min`) | alle interaktiven Elemente |

## Komponenten und Zustände

| Komponente | Zustände |
| --- | --- |
| App-Header | Standard (dunkelgrün, Logo auf weißer Kachel, abgerundete Unterkante) |
| Primär-/Sekundär-/Akzent-Button | Standard, Hover, Fokus (Ring + Versatz), Aktiv, Deaktiviert, Laden (`.svs-btn--loading`, `aria-busy`) |
| Auswahl-Chip | Standard, Hover, Fokus, Ausgewählt (`aria-pressed` + Füllung **und** Häkchen), Deaktiviert |
| Formularfeld (SelectField) | Standard, Fokus, Fehler (`aria-invalid` + `role=alert`-Meldung) |
| Spielerzahl-Stepper | Buttons ≥48 px, Grenzwert-Deaktivierung, Slider mit `aria-valuetext`, Live-Wertanzeige |
| Hinweiskarte | Info (ℹ blau), Warnung (⚠ gelb), Fehler (✕ rot), Erfolg (✓ grün) – Icon + Balken, nie nur Farbe |
| Trainingskarte | Geschlossen, Geöffnet (grüne Kontur bei `details[open]`), Hover, Fokus |

## V1 vs. V2

| | V1 Anthrazit | V2 Coaching Workspace |
| --- | --- | --- |
| Grundstimmung | Vereins-CI schwarz/weiß | markenunabhängig, grün |
| Radien | 16/10 px | 20/14 px |
| Schrift | System | Manrope + Inter |
| Touch-Minimum | 44 px | 48 px |
| Akzent | Orange (nur funktional) | Limette #B7F36B (+ Orange bleibt in Diagrammen) |

Umschalter: `/?preview=1` → Buttons „Design V1 / Design V2" oben.

## WCAG-2.2-AA-Prüfung (rechnerisch)

#101828 auf #FFFFFF ≈ 17,4:1 · #101828 auf #F4F7F5 ≈ 16:1 · #475467 auf #FFFFFF ≈ 7,3:1 · #FFFFFF auf #163A2D ≈ 12,3:1 · #163A2D auf #B7F36B ≈ 8,1:1 · #7A4D00 auf #FFF4CC ≈ 6,3:1 · #B42318 auf #FFFFFF ≈ 6,9:1 – alle ≥ 4,5:1. Fokus: 3-px-Ring mit 2 px Versatz plus weißem Zwischenring (Form, nicht nur Farbe). Ausgewählt-Zustände tragen Häkchen. Slider und Buttons tastaturbedienbar; `aria-live`/`aria-valuetext` am Stepper; Layout nutzt relative Einheiten (200-%-Zoom-tauglich, Sichtprüfung offen).

## Offene Punkte

- Screenshots 375/1280 px und 200-%-Zoom: Sichtprüfung durch André (`npm run dev` → `/?preview=1`, F12-Gerätemodus)
- Freigabe V2 und Entscheidung, wann V1 entfernt wird → [[10 Entscheidungslog]]
- Fonts laden von Google Fonts (Datenschutzprüfung vor Release: ggf. Self-Hosting)

## Geänderte Dateien

`index.html` · `src/styles/theme-v2.css` (neu) · `src/styles/components.css` · `src/main.jsx` · `src/components/ui/Chip.jsx` (neu) · `src/components/ui/Stepper.jsx` (neu) · `src/components/ui/Button.jsx` (unverändert nutzbar, Akzent-Variante via CSS) · `src/ComponentPreview.jsx` · `tests/ui-v2.test.jsx` (neu) · `docs/design-system-v2.md` (neu)
