/**
 * Zentrale Konfiguration der Datenquelle.
 *
 * Das Google Sheet ist die einzige maßgebliche Quelle für produktive Übungen
 * (Single Source of Truth). Gelesen wird per CSV:
 * - Bevorzugt: Publish-Links („Datei → Freigeben → Im Web veröffentlichen“,
 *   Format CSV je Tab) → in PUBLISHED_CSV_URLS eintragen.
 * - Solange kein Publish-Link hinterlegt ist, wird die gviz-CSV-Schnittstelle
 *   genutzt (funktioniert, zeigt aber z. B. den Settings-Tab leicht verzerrt –
 *   der Parser fängt das ab).
 */

export const SHEET_ID = '1a4ebuUnpBnagQpvFlNDYwwZWkgFmg3Fgy8nngZu1xjM';

/**
 * Das Sheet ist im Web veröffentlicht (2026-07-15):
 * https://docs.google.com/spreadsheets/d/e/2PACX-1vSe-GYR1Q5uVdUTvG-DyfQQV7iEU0IW9YKxqS5uzmRJTQXEw7Jv1I7HDfiDf9dj06a32EITaEQtJKoA/pubhtml
 * Für Publish-CSV-Links je Tab werden die gid-Werte benötigt
 * (…/pub?gid=<gid>&single=true&output=csv). Bis diese vorliegen,
 * bleibt der funktionierende gviz-Zugriff aktiv.
 */

export const SHEET_TABS = ['Settings', 'Lists', 'Exercises', 'Diagrams'];

/** Publish-CSV-Links je Tab. Leer = gviz-Fallback verwenden. */
export const PUBLISHED_CSV_URLS = {
  Settings: '',
  Lists: '',
  Exercises: '',
  Diagrams: '',
};

export function gvizCsvUrl(tab) {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}&headers=1`;
  // „tq=select *“ erzwingt die gviz-Query-Engine: Sie liefert aktuelle Daten,
  // während der reine CSV-Export-Pfad Änderungen teils sehr lange cacht
  // (beobachtet 2026-07-15: Export zeigte stundenlang alte draft-Stände).
  // Settings bleibt ohne tq, weil die Query-Engine in gemischten Spalten
  // Textwerte leert; dort sind veraltete Antworten unkritisch.
  return tab === 'Settings' ? base : `${base}&tq=${encodeURIComponent('select *')}`;
}

export function csvUrlFor(tab) {
  return PUBLISHED_CSV_URLS[tab] || gvizCsvUrl(tab);
}

/** localStorage-Schlüssel für die letzte gültige Datenbank-Kopie. */
export const CACHE_KEY = 'svs-trainingsplaner-db-v1';

/** Zeitlimit pro Tab-Abruf in Millisekunden. */
export const FETCH_TIMEOUT_MS = 10000;
