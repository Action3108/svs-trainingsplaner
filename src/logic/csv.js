/**
 * Robuster CSV-Parser nach RFC 4180 für die Google-Sheet-Exporte.
 * Verarbeitet: Anführungszeichen, doppelte Anführungszeichen (""),
 * Kommas und Zeilenumbrüche innerhalb von Zellen, CRLF/LF sowie ein
 * führendes BOM. Keine externen Abhängigkeiten.
 */

/** Parst CSV-Text in ein Array von Zeilen (jede Zeile = Array von Strings). */
export function parseCsv(text) {
  if (typeof text !== 'string') return [];
  // BOM entfernen
  let s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  // letzte Zelle/Zeile (Datei ohne abschließenden Zeilenumbruch)
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  // komplett leere Zeilen entfernen
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/**
 * Wandelt geparste Zeilen in Objekte um (erste Zeile = Spaltenköpfe).
 * Spaltenköpfe werden getrimmt; fehlende Zellen werden zu ''.
 */
export function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((key, i) => {
      if (key) obj[key] = (r[i] ?? '').trim();
    });
    return obj;
  });
}

/** Komfort: CSV-Text direkt in Objekte umwandeln. */
export function csvToObjects(text) {
  return rowsToObjects(parseCsv(text));
}
