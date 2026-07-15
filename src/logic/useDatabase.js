import { useEffect, useState } from 'react';
import { loadDatabase } from './sheetClient.js';

/**
 * React-Hook: lädt die Übungsdatenbank beim Start.
 * Liefert { status: 'loading'|'ready', db, source, updatedAt, errors }.
 * Durch die Fallback-Kette endet der Ladevorgang immer in 'ready'.
 */
export function useDatabase() {
  const [state, setState] = useState({ status: 'loading', db: null, source: null, updatedAt: null, errors: [] });

  useEffect(() => {
    let active = true;
    loadDatabase().then((result) => {
      if (result.errors?.length) {
        // Übersprungene Zeilen und Ladeprobleme für die Fehlersuche protokollieren
        console.warn('[SVS Trainingsplaner] Datenprüfung:', result.errors);
      }
      if (active) setState({ status: 'ready', ...result });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

/** Formatiert einen ISO-Zeitstempel für die Statusanzeige. */
export function formatUpdatedAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
