# Lehren aus dem 100-Einheiten-Großtest – Entscheidungsvorlage

Stand: 2026-07-17 · Datengrundlage: `docs/grosstest-2026-07-16.md` (Seed 42,
98 veröffentlichte Übungen, 6 Schwerpunkte). Alle Zahlen stammen aus dem
Protokoll; nichts ist geschätzt oder erfunden.

**Status: Vorschläge – noch nichts davon ist umgesetzt.** Jeder Punkt braucht
eine Entscheidung: `umsetzen` / `angepasst umsetzen` / `zurückstellen` / `verwerfen`.

## 1. Befundlage kompakt

| Kennzahl | Wert |
| --- | ---: |
| Testfälle / erfolgreich generiert | 100 / 62 |
| Ohne zulässige Kombination (klare Meldung) | 38 |
| Kritische / hohe Befunde in generierten Einheiten | 0 / 0 |
| Einheiten mit mehr als 1 Umbau | 34 |
| Einheiten mit Schwerpunktabdeckung unter 50 % der Phasen | 22 |
| Ø-Bewertung T17 / T50 / UX / DFB | 3,39 / 4,14 / 4,51 / 3,63 |

Die 38 Ausfälle konzentrieren sich auf: sehr kleine Kader (4–7 Spieler: 23 Fälle),
sehr große Kader (24–30: 10 Fälle) und die Altersklassen A und B (je 9 Fälle,
dünner Übungspool). Die Fehlermeldung selbst funktioniert wie gefordert.

## 2. Einordnung der Muster

| Muster | Kategorie | Zielgruppen | Nutzungsschritt | Häufigkeit |
| --- | --- | --- | --- | --- |
| Keine Einheit für kleine/große Kader und A/B | fachliche Schwäche (Datenlücke), verhindert Erstellung | alle | Generierung | 38× – regelmäßig |
| Fehlermeldung nennt Ursache, aber keinen Ausweg | Verständlichkeitsproblem | T17, T50 | Fehlerfall | in allen 38 Fällen |
| Mehr als 1 Umbau je Einheit | fachliche Schwäche (Organisation) | T17, DFB | Ergebnis/Platz | 34× – regelmäßig |
| Schwerpunkt in < 50 % der Phasen | fachliche Schwäche | DFB | Ergebnis | 22× – regelmäßig |
| 3 parallele Aktions-Buttons, 8 Schwerpunkte | unnötige Komplexität | T17, T50, UX | Eingabe/Ergebnis | behoben 2026-07-17 (1 Hauptaktion, 6 Schwerpunkte) |

Echte Fehler (falsche Dauer, Duplikate, Altersverstöße, >4 Teams): **keine** gefunden.

## 3. Drei priorisierte Vorschläge je Zielgruppe

### Trainer, 17 Jahre (kennt die App nicht)

| Prio | Vorschlag | Begründung aus dem Test |
| --- | --- | --- |
| 1 – hoch | **Fehlermeldung mit klickbaren Auswegen:** Wenn keine Einheit möglich ist, konkrete Alternativen berechnen und anbieten („Mit 8 statt 6 Spielern klappt es“ / „60 statt 75 Minuten wählen“). | 38 Fälle enden heute in einer Sackgasse; betrifft alle Zielgruppen und verhindert die Erstellung – höchste Priorität nach den Backlog-Kriterien. |
| 2 – mittel | ~~Umbauten weiter senken~~ **UMGESETZT 2026-07-17:** Feldgrößenklassen S/M/L/XL; wesentlicher Umbau = Klassenwechsel, Vorlagenwechsel in gleicher Klasse = kleine Anpassung. Ergebnis: Einheiten mit ≤ 1 wesentlichem Umbau 28 → 56 von 62. | vorher 34 Einheiten mit > 1 Umbau, nachher 6. |
| 3 – niedrig | **Ein Satz Mikro-Hilfe unter dem Formular** („Alter, Anzahl Kinder, Zeit und Thema wählen – fertig.“). | Kein Testbefund dagegen; reine Komfortverbesserung für den Erstkontakt. |

### Trainer, 50 Jahre (kennt die App nicht)

| Prio | Vorschlag | Begründung aus dem Test |
| --- | --- | --- |
| 1 – hoch | **Kompakte Einheit bei 60 Minuten klar kennzeichnen und bevorzugen:** Bei 60 min wirken 6 Phasen gehetzt (T50-Abzug im Test); die Kurzstruktur als Standard für 60 min prüfen und im Ergebnis verständlich benennen („Kompakte Einheit: 3 Blöcke“). | Heuristischer T50-Abzug trat bei allen 6-Phasen-60-min-Einheiten auf; Kurzstrukturen sind bereits implementiert, nur die Bevorzugung/Benennung ist offen. |
| 2 – mittel | **Überblickstabelle auch ins PDF** (Seite 1: Zeit · ID · Titel je Phase, wie neu in der App). | Gleiche Information, die am Bildschirm zur Orientierung eingeführt wurde, fehlt im Druck – Doppelnutzen ohne neue Datenfelder. |
| 3 – niedrig | **Begriffs-Check mit echten Trainerkollegen** („Spielform 1/2“, „Übungsform“). | Kein Testnachweis für ein Problem – erst mit Nutzern validieren, nicht vorab umbauen. |

### Senior UI/UX-Experte

| Prio | Vorschlag | Begründung aus dem Test |
| --- | --- | --- |
| 1 – hoch | **Sichtbares Feedback bei „Training erstellen“** (kurzer Ladezustand, danach automatischer Scroll/Fokus auf die Zusammenfassung, aria-live-Status). | Die Generierung durchsucht jetzt 98 Übungen über bis zu 3 Strukturen; ohne Feedback wirkt der Klick auf schwachen Geräten „tot“. UX-Bewertung ist gut (4,51), dies ist die größte verbliebene Lücke im Kernpfad. |
| 2 – mittel | **Austausch-Sheet entlasten:** Diagrammvorschauen erst beim Sichtbarwerden rendern (5 SVGs gleichzeitig sind auf älteren Smartphones spürbar). | Folgt aus der gewachsenen Datenbank; kein Testbefund „kritisch“, aber regelmäßiger Nutzungsschritt. |
| 3 – niedrig | **Kontrollmodus-Feinschliff:** Sprungliste nach Prüfstatus filtern („nur offene“). | Komfort für die anstehende 98er-Prüfung; keine Auswirkung auf reguläre Nutzer. |

### DFB-Stützpunkttrainer

| Prio | Vorschlag | Begründung aus dem Test |
| --- | --- | --- |
| 1 – hoch | **Schwerpunkt-Mindestregel im Generator:** Hauptteil (Übungsform + Spielformen) muss den gewählten Schwerpunkt abdecken, oder das Schwerpunkt-Gewicht in der Matrix anheben (derzeit 20 %). | 22 Einheiten decken den Schwerpunkt in weniger als der Hälfte der Phasen ab – führt zu fachlich verwässerten Einheiten (DFB Ø 3,63). |
| 2 – hoch | **Recherchepaket für die Lücken:** A-/B-Jugend sowie Varianten für 4–7 und 24–30 Spieler (Priorität: B/A je 9 Ausfälle, kleine Kader 23 Ausfälle). | Einzige Ursache der 38 Ausfälle ist der Übungspool, nicht der Generator. |
| 3 – mittel | **Belastungsverlauf als weiches Kriterium:** Steigerung von Intensität/Komplexität über die Einheit in die Kombinationsbewertung aufnehmen. | Im Test nur heuristisch bewertet; fachlich sinnvoll, aber kein nachgewiesener Mangel – daher hinter 1 und 2. |

## 4. Empfohlene Reihenfolge (zielgruppenübergreifend)

1. Fehlermeldung mit Auswegen (T17-1) – verhindert heute die Erstellung, trifft alle.
2. Recherchepaket Datenlücken (DFB-2) – gleiche Ursache, langfristige Lösung.
3. Schwerpunkt-Mindestregel (DFB-1) – fachliche Qualität der erzeugten Einheiten.
4. Umbau-Reduktion (T17-2) und Lade-Feedback (UX-1).
5. Rest nach Gelegenheit.
