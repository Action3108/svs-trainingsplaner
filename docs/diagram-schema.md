# Diagramm-Schema (`diagramData`)

Stand: 2026-07-14 · Verbindlich für das Blatt **Diagrams** im Google Sheet und den SVG-Renderer.

## Grundregeln

Koordinatensystem 0–100 auf beiden Achsen (x nach rechts, y nach unten). Angriffsrichtung immer **links → rechts**. Maximal drei zentrale Aktionen (Pfeile) pro Grafik. `diagramData` ist ein JSON-Objekt in einer Zelle; jede Kategorie ist optional, leere Kategorien weglassen.

## Struktur

```json
{
  "field":   { "w": 100, "h": 100 },
  "players": [ { "team": "black", "n": 1, "x": 30, "y": 40 } ],
  "balls":   [ { "x": 32, "y": 42 } ],
  "cones":   [ { "x": 20, "y": 20 } ],
  "goals":   [ { "type": "mini", "x": 0, "y": 25 } ],
  "zones":   [ { "x": 80, "y": 0, "w": 20, "h": 100, "label": "Zielzone" } ],
  "lines":   [ { "from": {"x":50,"y":0}, "to": {"x":50,"y":100}, "style": "dashed", "label": "Mittellinie" } ],
  "arrows":  [ { "type": "pass", "from": {"x":30,"y":40}, "to": {"x":60,"y":40} } ]
}
```

## Zulässige Werte

| Feld | Werte | Darstellung |
| --- | --- | --- |
| `players[].team` | `black` | schwarzer Kreis, weiße Nummer (`n`) |
| | `white` | weißer Kreis, schwarze Kontur und Nummer |
| | `neutral` | grauer Kreis mit „N“ |
| | `gk` | weiße Raute mit „TW“ |
| | `coach` | schwarzes Quadrat mit „T“ |
| `goals[].type` | `mini`, `youth`, `cone` | Rechteck am Rand (Minitor 8, Jugendtor 14 Einheiten); Ausrichtung automatisch nach Randlage |
| `arrows[].type` | `pass` | gestrichelter Pfeil |
| | `run` | durchgezogener Pfeil |
| | `dribble` | gepunkteter Pfeil |
| | `shot` | dicker Pfeil |
| | `rotation` | gebogener Pfeil |
| `zones` | – | hellgrau schraffiert, gestrichelte Kontur, optionales Label |
| `lines` | – | dünne gestrichelte Hilfslinie (Mittellinie, Schusslinie), optionales Label |
| `balls` | – | oranger Kreis mit dunkler Kontur |
| `cones` | – | oranges Dreieck mit dunkler Kontur |

## Validierung

`src/logic/diagramSchema.js` → `validateDiagramData(objOrString)` liefert `{valid, errors, data}`. Der Renderer (`src/components/DiagramRenderer.jsx`) zeigt bei ungültigen Daten einen Hinweis und crasht nie – fehlerhafte Sheet-Zeilen blockieren die App nicht. Nur Übungen mit gültigem Diagramm gelten als published-fähig.

## Barrierefreiheit und Druck

Jedes Diagramm braucht `diagramAltText` (wird zu `aria-label`/`<title>`) und `diagramCaption`. Farben stammen aus dem Visual Style Guide und bleiben in Graustufen unterscheidbar (Form + Kontur tragen die Information, nicht nur Farbe). Das SVG skaliert verlustfrei für Bildschirm und PDF.
