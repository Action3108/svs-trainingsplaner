import { SHEET_TABS, csvUrlFor, CACHE_KEY, FETCH_TIMEOUT_MS } from '../config.js';
import { parseCsv } from './csv.js';
import { assembleDatabase, TAB_HEADERS } from './sheetSchema.js';
import fallbackDb from '../data/fallbackExercises.json';

/**
 * CSV → Objekte mit kanonischen Spaltennamen: Stimmt die Spaltenzahl der
 * Antwort mit dem Datenmodell überein, gelten die kanonischen Namen
 * (die gviz-Query-Engine ersetzt Spaltenköpfe teils durch Zellwerte).
 * Andernfalls wird die zurückgegebene Kopfzeile verwendet.
 */
function tabToObjects(tab, text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const canonical = TAB_HEADERS[tab];
  const header =
    canonical && rows[0].length === canonical.length
      ? canonical
      : rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    // Wiederholte Kopfzeilen überspringen (entstehen beim Anhängen
    // von CSV-Paketen im Sheet, z. B. eine Zeile mit id="id")
    .filter((r) => (r[0] ?? '').trim() !== header[0])
    .map((r) => {
      const obj = {};
      header.forEach((key, i) => {
        if (key) obj[key] = (r[i] ?? '').trim();
      });
      return obj;
    });
}

/**
 * Datenzugriff mit Fallback-Kette:
 * 1. aktuelles Google Sheet (Publish-CSV oder gviz-CSV)
 * 2. letzte gültige lokale Kopie (localStorage, mit Zeitstempel)
 * 3. kleine Fallback-Datenbank aus dem Repository (fallbackExercises.json)
 *
 * Rückgabe von loadDatabase():
 * { db, source: 'network'|'cache'|'fallback', updatedAt: ISO-String|null, errors: string[] }
 */

async function fetchCsvText(url, fetchImpl) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS) : null;
  try {
    // cache:'no-store' umgeht zusätzlich den HTTP-Cache des Browsers
    const options = { cache: 'no-store', ...(controller ? { signal: controller.signal } : {}) };
    const res = await fetchImpl(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Lädt alle vier Tabs und baut die Datenbank. Wirft bei Netzwerkfehlern. */
export async function loadFromNetwork(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch nicht verfügbar');
  const raw = {};
  const cacheBuster = `cb=${Date.now()}`;
  for (const tab of SHEET_TABS) {
    const url = csvUrlFor(tab);
    // Cache-Buster (Parameter ohne Unterstrich – „_cb“ wird von Google
    // entfernt): umgeht gecachte gviz-Antworten nach Sheet-Änderungen.
    const freshUrl = url + (url.includes('?') ? '&' : '?') + cacheBuster;
    const text = await fetchCsvText(freshUrl, fetchImpl);
    raw[tab.toLowerCase()] = tabToObjects(tab, text);
  }
  const db = assembleDatabase({
    settings: raw.settings,
    lists: raw.lists,
    exercises: raw.exercises,
    diagrams: raw.diagrams,
  });
  if (db.exercises.length === 0 && db.counts.exercisesTotal === 0) {
    // Leere Antwort (z. B. Berechtigungsseite statt CSV) nicht als Erfolg werten.
    throw new Error('Sheet lieferte keine Übungsdaten');
  }
  return db;
}

/** Cache-Zugriff: fehlertolerant (Safari-Privatmodus, iFrame-Einschränkungen). */
export function saveCache(db, storage = safeStorage()) {
  if (!storage) return false;
  try {
    storage.setItem(CACHE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), db }));
    return true;
  } catch {
    return false;
  }
}

export function readCache(storage = safeStorage()) {
  if (!storage) return null;
  try {
    const rawValue = storage.getItem(CACHE_KEY);
    if (!rawValue) return null;
    const parsed = JSON.parse(rawValue);
    if (!parsed?.db || !Array.isArray(parsed.db.exercises)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeStorage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/**
 * Hauptzugriff der App: liefert immer eine nutzbare Datenbank.
 * @param {{fetchImpl?: Function, storage?: Storage}} [options]
 */
export async function loadDatabase({ fetchImpl = globalThis.fetch, storage = safeStorage() } = {}) {
  // 1. Netzwerk
  try {
    const db = await loadFromNetwork(fetchImpl);
    const updatedAt = new Date().toISOString();
    // Eine leere published-Menge (z. B. durch veraltete Zwischenstände)
    // darf eine vorhandene gute Kopie nicht überschreiben.
    if (db.exercises.length > 0) saveCache(db, storage);
    return { db, source: 'network', updatedAt, errors: db.errors };
  } catch (err) {
    const networkError = `Sheet nicht erreichbar: ${err?.message ?? err}`;
    // 2. Cache
    const cached = readCache(storage);
    if (cached) {
      return {
        db: cached.db,
        source: 'cache',
        updatedAt: cached.savedAt,
        errors: [...(cached.db.errors ?? []), networkError],
      };
    }
    // 3. Fallback aus dem Repository
    return {
      db: fallbackDb,
      source: 'fallback',
      updatedAt: null,
      errors: [networkError, 'Verwende eingebaute Fallback-Übungen'],
    };
  }
}
