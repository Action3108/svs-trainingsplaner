# Kontrollmodus (interner QA-Modus)

Stand: 2026-07-16 · Backlog §10

## Aktivierung
- Aufruf über die nicht verlinkte interne Route: `<App-URL>/?review=1`
- Schalter: `REVIEW_MODE_ENABLED` in `src/config.js` (aktuell `true`)
- Deaktivieren (`false`) verbirgt den Modus, löscht aber keine Prüfdaten.

## Funktionsweise
- Lädt alle veröffentlichten Übungen aus dem führenden Google Sheet,
  Reihenfolge stabil aufsteigend nach Übungs-ID.
- Pro Übung: vollständige prüfrelevante Darstellung (Stammdaten, Diagramm,
  Informationskarten) + schlankes Prüfformular.

### Schnelle Bedienung (vereinfacht 2026-07-20)
- **Fortschrittszähler** oben, groß ablesbar im Format `geprüft/gesamt`
  (z. B. `22/134`) inkl. Anzahl offener Übungen.
- **Zwei Schnell-Buttons** statt Status-Dropdown:
  - „✓ Passt" setzt den Status auf `fehlerfrei` und springt sofort zur
    nächsten Übung (kein weiteres Feld nötig).
  - „✗ Fehler" öffnet ein einzelnes Pflicht-Freitextfeld
    („Was ist zu ändern?").
- **Details eingeklappt** (`<details>`): Bereich, Priorität,
  Korrekturvorschlag, Kommentar und weitere Befunde sind optional und nur bei
  Bedarf sichtbar.
- **Dropdown-Markierung:** bereits bearbeitete Übungen (Status ≠ „Prüfung
  offen") werden grün hinterlegt und mit „✓" markiert; offene mit „–".
- Pflichtfeld bei „Fehler gefunden": nur noch die Fehlerbeschreibung
  (Korrekturvorschlag ist jetzt optional).
- Speicherung: localStorage `svs-trainingsplaner-review-v1` (getrennt von den
  produktiven Daten; verändert niemals das Google Sheet). Jede Eingabe wird
  sofort automatisch gespeichert.
- Export: Markdown-Update-Protokoll + JSON-Prüfdatensatz (Download-Buttons).
- Import: JSON-Prüfdatensatz (Gerätewechsel); Zusammenführung nach checkedAt,
  lokale neuere Einträge werden nicht überschrieben.

## Prüf-Link an Mitarbeiter verteilen (neu 2026-07-17)

Im Kontrollmodus gibt es oben den Button **„Prüf-Link an Kollegen senden"**:
Er öffnet auf Mobilgeräten das native Teilen-Menü (WhatsApp, Mail …) mit dem
`?review=1`-Link samt Kurzanleitung; am Desktop wird der Link in die
Zwischenablage kopiert. Jeder Prüfer arbeitet auf dem eigenen Gerät
(localStorage), exportiert am Ende Markdown + JSON und schickt beide Dateien
zurück; André führt sie über „Prüfdatensatz importieren" zusammen.

## Prozess nach der Prüfung
1. André exportiert das Update-Protokoll.
2. Jeder Prüffall wird gemeinsam bewertet (umsetzen / angepasst umsetzen /
   zurückstellen / verwerfen) – keine Umsetzung ohne Freigabe.
3. Nach Abschluss und ausdrücklicher Bestätigung: REVIEW_MODE_ENABLED=false.
