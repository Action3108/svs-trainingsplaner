import { formatUpdatedAt } from '../logic/useDatabase.js';

/**
 * Statusanzeige der Datenquelle:
 * - network: „Daten aktualisiert am …“
 * - cache: Offline-Hinweis mit Stand der letzten Kopie
 * - fallback: Warnung, dass eingebaute Beispielübungen genutzt werden
 */
export default function DataStatus({ status, source, updatedAt, db, errors = [] }) {
  if (status === 'loading') {
    return (
      <p className="svs-note svs-note--info" role="status">
        Übungsdaten werden geladen …
      </p>
    );
  }

  const when = formatUpdatedAt(updatedAt);
  const count = db?.counts?.exercisesPublished ?? db?.exercises?.length ?? 0;

  if (source === 'network') {
    // Daten kamen an, aber keine Übung hat die Prüfung bestanden:
    // die Gründe anzeigen statt still „0“ zu melden.
    if (count === 0 && errors.length > 0) {
      return (
        <div className="svs-note svs-note--warn" role="status">
          <p>
            Daten geladen am {when} Uhr, aber keine Übung hat die Prüfung
            bestanden ({errors.length} Meldungen):
          </p>
          <p className="svs-plan__error-details">{errors.slice(0, 4).join(' · ')}</p>
          <p className="svs-plan__error-details">
            Alle Meldungen stehen in der Browser-Konsole (F12).
          </p>
        </div>
      );
    }
    return (
      <p className="svs-note svs-note--success" role="status">
        Daten aktualisiert am {when} Uhr · {count} veröffentlichte Übungen
      </p>
    );
  }
  if (source === 'cache') {
    return (
      <p className="svs-note svs-note--warn" role="status">
        Keine Verbindung zur Übungsdatenbank. Es wird die letzte gespeicherte
        Version vom {when} Uhr verwendet ({count} Übungen).
      </p>
    );
  }
  return (
    <p className="svs-note svs-note--warn" role="status">
      Keine Verbindung und keine gespeicherte Kopie vorhanden. Es werden{' '}
      {count} eingebaute Beispielübungen verwendet – bitte später mit
      Internetverbindung neu laden.
    </p>
  );
}
