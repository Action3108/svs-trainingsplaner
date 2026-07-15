# Visual Style Guide – Übungsgrafiken

Stand: 2026-07-14 · **Aktuell: Renderer V3 „Moderne Spielfeldkarte"** (siehe unten). Datenformat unverändert: [Diagramm-Schema](./diagram-schema.md).

## Renderer V3 „Moderne Spielfeldkarte" (verbindlich seit 2026-07-14)

Ein einziger datengetriebener Renderer (`src/components/diagram/`) stellt alle Diagramme aus den unveränderten 0–100-Koordinaten dar, gerendert im 16:10-Format. Tokens zentral in `src/styles/diagram-tokens.css`.

**Karte:** Weiß, Radius 18 px, Rahmen 1 px #D0D5DD, Schatten 0 6px 18px rgba(16,24,40,.08), max. 720 px breit, Innenabstand 12/16 px. **Feld:** #EAF6EC mit Rasenstreifen #DDF0E1, Linien #A7C9AF (außen 2 px, innen dünner), Radius 12 px, dezente Mittellinie/Mittelkreis, kein schwarzer Rahmen. **Spieler** (≥28 px, weißer Ring, Schatten, weiße Nummer): Team Blau #2563EB Kreis · Team Koralle #F04438 Kreis mit Strich · Neutral #7F56D9 Sechseck „N" · Torwart #163A2D abgerundetes Quadrat „TW" · Trainer #101828 Quadrat „T" – Unterscheidung immer über Form UND Farbe. **Material:** Ball #F59E0B mit dunklem Rand, Hütchen #F97316, Minitore weiß mit #667085-Kontur, Jugendtore mit angedeutetem Netz, Zonen #B7F36B bei 22 % Deckkraft mit Label. **Bewegungslinien** (einheitliche Pfeilspitzen, ≥8 px Abstand zu Symbolen): Pass #2563EB gestrichelt · Laufweg #344054 durchgezogen · Dribbling #F59E0B gepunktet · Torschuss #F04438 dick – Bedeutung über Muster/Stärke, nie nur Farbe.

**Informationshierarchie (DiagramCard):** oben Titel, Übungsart, Meta-Chips (Spieler/Feldgröße/Tore) und Vollbild-Button; unten max. zwei Erklärungssätze und einklappbare Chip-Legende. Alt-Text am SVG (`role="img"` + `<title>`), dekorative Ebenen `aria-hidden`. Fokusrahmen 3 px #2563EB mit 2 px Versatz. Ablauf-Animation per Play-Button (`animateMotion`), `prefers-reduced-motion` respektiert, im Druck ausgeblendet.

Der frühere Renderer (V1/V2-Look, unten dokumentiert) bleibt vorerst als Vergleich unter „Vergleich: bisheriger Renderer" in der Vorschau.

---

## Archiv: Klassischer Style Guide (V1/V2-Renderer)

## Grundsätze

Jede Grafik wird ausschließlich vom SVG-Renderer aus strukturierten `diagramData` erzeugt – keine fremden Grafiken, keine handgebauten SVGs. Angriffsrichtung immer links → rechts, Koordinaten 0–100, maximal drei zentrale Aktionen pro Grafik. Jede Grafik hat Alternativtext und Bildunterschrift; die erste Grafik einer Ansicht zeigt die Legende.

In den Übungsgrafiken gilt – anders als in der entschärften UI – **voller Kontrast**: Linien `#111111` auf Feld `#F5F5F3`. Die Grafiken müssen auf dem Platz, im Sonnenlicht, im Graustufen-Druck und auf kleinen Displays funktionieren.

## Elemente

| Element | Darstellung | Farbe |
| --- | --- | --- |
| Feld | Rechteck mit dünner Kontur | Fläche #F5F5F3, Linien #111111 |
| Team Schwarz | Kreis (r=3), weiße Nummer | #111111 |
| Team Weiß | Kreis, dunkle Kontur und Nummer | #FFFFFF |
| Neutraler Spieler | grauer Kreis mit „N“ | #A3A3A3 |
| Torwart | weiße Raute mit „TW“ | #FFFFFF |
| Trainer | dunkles Quadrat mit „T“ | #111111 |
| Ball | kleiner Kreis (r=1,5) mit Kontur | #F59E0B |
| Hütchen | Dreieck mit Kontur | #F97316 |
| Minitor / Jugendtor | Rechteck am Feldrand (8 bzw. 14 Einheiten) | weiß mit dunkler Kontur |
| Laufweg | durchgezogener Pfeil | #111111 |
| Pass | gestrichelter Pfeil (2,5/1,8) | #111111 |
| Dribbling | gepunkteter Pfeil (0,6/1,6) | #111111 |
| Torschuss | dicker Pfeil (Strichstärke 2) | #111111 |
| Rotation | gebogener Pfeil (Quadratik) | #111111 |
| Zielzone | hellgrau schraffiert (45°), gestrichelte Kontur | #A3A3A3 |
| Hilfslinie (Mittellinie, Schusslinie) | dünn gestrichelt mit Label | #111111 |

## Graustufen-Regel

Information liegt nie allein in der Farbe: Teams unterscheiden sich durch Füllung (voll/leer/grau), Rollen durch Form (Kreis/Raute/Quadrat/Dreieck), Aktionen durch Strichmuster und -stärke. Ball und Hütchen tragen zusätzlich eine dunkle Kontur.

## Responsivität und PDF

Der Renderer gibt ein `viewBox`-basiertes SVG ohne feste Pixelmaße aus (`width: 100%`). Schriftgrößen sind in Viewbox-Einheiten definiert und skalieren mit. Dieselben SVGs werden unverändert in der PDF-Erzeugung verwendet.

## Theme-Anpassung (V2, ergänzt 2026-07-14)

Die Diagrammfarben laufen über CSS-Variablen (`--dia-field`, `--dia-line`, `--dia-team-dark`, `--dia-neutral`) mit den klassischen Werten als Fallback. Im V2-Theme: Feld `#EAF2EC`, Linien/Team Dunkel `#163A2D` (Kontrast ≈ 10:1), Neutral `#94A39B`. Ball und Hütchen bleiben orange (funktionale Farben). Formen und Strichmuster sind unverändert – die Graustufen-Regel gilt weiter.

## Ablauf-Animation (ergänzt 2026-07-14)

Jedes Diagramm mit Aktionspfeilen erhält den Button „▶ Ablauf abspielen": Marker laufen die Pfeile nacheinander entlang (`animateMotion`, Versatz 1,8 s pro Aktion, Endlosschleife). Ball-Marker (orange) für Pass/Torschuss, Spieler-Marker (dunkel) für Lauf/Dribbling; Torschuss läuft schneller (0,9 s). Die Animation ist rein additiv: Standard ist das statische Bild, der Button fehlt im Druck/PDF, `prefers-reduced-motion` wird respektiert, und die Diagrammdaten bleiben unverändert – es wird nichts zusätzlich gepflegt.

## Umsetzung

- Renderer: `src/components/DiagramRenderer.jsx`
- Validierung: `src/logic/diagramSchema.js`
- Beispiele: `src/data/exampleDiagrams.js` (Aufwärmen, Passspiel, Dribbling, Torschuss, kleine Spielform, Abschlussspiel)
- Tests: `tests/diagram.test.jsx`
- Vorschau: `/?preview=1` → Abschnitt „Übungsdiagramme“
