import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './ui/Header.jsx';
import Button from './ui/Button.jsx';
import SelectField from './ui/SelectField.jsx';
import DiagramCard from './diagram/DiagramCard.jsx';
import InfoGrid from './ui/InfoGrid.jsx';
import { useDatabase } from '../logic/useDatabase.js';
import { REVIEW_MODE_ENABLED, REVIEW_STORAGE_KEY } from '../config.js';

/**
 * Temporärer Kontrollmodus für die Qualitätssicherung (Backlog §10).
 *
 * - Kein reguläres Produktfeature: nur über die nicht verlinkte interne
 *   Route ?review=1 erreichbar und über REVIEW_MODE_ENABLED abschaltbar.
 * - Zeigt alle veröffentlichten Übungen in stabiler Reihenfolge
 *   (aufsteigend nach Übungs-ID) mit allen prüfrelevanten Inhalten.
 * - Prüfeingaben werden verlustfrei in localStorage gehalten (getrennt von
 *   den produktiven Daten – ein Prüfvermerk verändert nie das Google Sheet)
 *   und lassen sich als Markdown-Update-Protokoll und JSON exportieren
 *   sowie aus einem JSON-Export wieder importieren (Gerätewechsel).
 * - Das Deaktivieren des Modus löscht keine erfassten Prüfergebnisse.
 */

// Kleine Stroke-Icons für die Stammdaten-Zeile (erben die Textfarbe).
const metaStroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};
const PersonIcon = (
  <svg className="svs-meta-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <circle {...metaStroke} cx="10" cy="6.2" r="3.1" />
    <path {...metaStroke} d="M4.2 16.6c0-3.2 2.6-5.7 5.8-5.7s5.8 2.5 5.8 5.7" />
  </svg>
);
const StopwatchIcon = (
  <svg className="svs-meta-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path {...metaStroke} d="M8.1 2.4h3.8M10 2.4v1.7" />
    <circle {...metaStroke} cx="10" cy="11.4" r="6" />
    <path {...metaStroke} d="M10 11.4V7.9M14.6 6.9l1-1" />
  </svg>
);

export const REVIEW_AREAS = [
  'Stammdaten',
  'Aufbau',
  'Ablauf',
  'Regeln',
  'Coaching',
  'Diagramm',
  'Animation',
  'Generatorzuordnung',
  'UI/UX',
];
export const REVIEW_STATUS = ['Prüfung offen', 'fehlerfrei', 'Fehler gefunden'];
export const REVIEW_PRIORITIES = ['kritisch', 'hoch', 'mittel', 'niedrig'];

const emptyFinding = () => ({
  area: 'Stammdaten',
  priority: 'mittel',
  description: '',
  suggestion: '',
  comment: '',
});

export function loadReviewState() {
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && parsed.entries ? parsed : { entries: {} };
  } catch {
    return { entries: {} };
  }
}

export function saveReviewState(state) {
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Speicher voll o. Ä. – Zustand bleibt im React-State erhalten
  }
}

/** Erzeugt das konsolidierte Update-Protokoll als Markdown (Backlog §10). */
export function buildProtocolMarkdown(state, exercises) {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const ids = Object.keys(state.entries).sort();
  const rows = [];
  let n = 0;
  ids.forEach((id) => {
    const entry = state.entries[id];
    if (entry.status !== 'Fehler gefunden') return;
    (entry.findings ?? []).forEach((f) => {
      n += 1;
      rows.push({ n, id, title: byId.get(id)?.title ?? entry.title ?? '', entry, f });
    });
  });

  const checked = ids.filter((id) => state.entries[id].status !== 'Prüfung offen').length;
  const ok = ids.filter((id) => state.entries[id].status === 'fehlerfrei').length;

  let md = `# Update-Protokoll Übungsprüfung – SV Schöning Trainingsplaner\n\n`;
  md += `Exportiert: ${new Date().toISOString()}\n\n`;
  md += `## Gesamtstatus\n\n`;
  md += `| Kennzahl | Wert |\n| --- | ---: |\n`;
  md += `| Übungen insgesamt | ${exercises.length} |\n`;
  md += `| geprüft | ${checked} |\n`;
  md += `| fehlerfrei | ${ok} |\n`;
  md += `| mit Fehlern | ${ids.filter((id) => state.entries[id].status === 'Fehler gefunden').length} |\n`;
  md += `| Prüffälle | ${rows.length} |\n\n`;
  md += `## Prüffälle\n\n`;
  if (rows.length === 0) {
    md += `Keine offenen Prüffälle.\n`;
    return md;
  }
  rows.forEach((r) => {
    md += `### Prüffall ${r.n}: ${r.id} · ${r.title}\n\n`;
    md += `| Feld | Inhalt |\n| --- | --- |\n`;
    md += `| Prüfstatus | ${r.entry.status} |\n`;
    md += `| Betroffener Bereich | ${r.f.area} |\n`;
    md += `| Fehlerbeschreibung | ${r.f.description} |\n`;
    md += `| Korrekturvorschlag | ${r.f.suggestion} |\n`;
    md += `| Priorität | ${r.f.priority} |\n`;
    if (r.f.comment) md += `| Zusatzkommentar | ${r.f.comment} |\n`;
    md += `| Geprüft am | ${r.entry.checkedAt ?? ''} |\n`;
    md += `| Bearbeitungsstatus | offen |\n\n`;
  });
  return md;
}

function download(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReviewMode() {
  const { status, db } = useDatabase();
  const [state, setState] = useState(loadReviewState);
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileRef = useRef(null);

  // Stabile, reproduzierbare Reihenfolge: aufsteigend nach Übungs-ID
  const exercises = useMemo(
    () => [...(db?.exercises ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
    [db]
  );

  // Jede Änderung sofort persistieren – kein Datenverlust bei Navigation/Reload
  useEffect(() => {
    saveReviewState(state);
  }, [state]);

  if (!REVIEW_MODE_ENABLED) {
    return (
      <main className="theme-scope" data-theme="v2">
        <Header subtitle="Kontrollmodus" />
        <div className="app">
          <p className="svs-note svs-note--info">
            Der Kontrollmodus ist derzeit deaktiviert. Bereits erfasste
            Prüfergebnisse bleiben gespeichert.
          </p>
        </div>
      </main>
    );
  }

  if (status !== 'ready') {
    return (
      <main className="theme-scope" data-theme="v2">
        <Header subtitle="Kontrollmodus" />
        <div className="app">
          <p className="svs-note svs-note--info" role="status">
            Übungsdaten werden geladen …
          </p>
        </div>
      </main>
    );
  }

  const total = exercises.length;
  const e = exercises[Math.min(index, total - 1)];
  const entry = state.entries[e?.id] ?? { status: 'Prüfung offen', findings: [emptyFinding()] };
  const checkedCount = exercises.filter(
    (x) => (state.entries[x.id]?.status ?? 'Prüfung offen') !== 'Prüfung offen'
  ).length;

  const updateEntry = (patch) => {
    setState((s) => ({
      ...s,
      entries: {
        ...s.entries,
        [e.id]: {
          ...entry,
          title: e.title,
          ...patch,
          checkedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const updateFinding = (i, patch) => {
    const findings = (entry.findings ?? [emptyFinding()]).map((f, j) =>
      j === i ? { ...f, ...patch } : f
    );
    updateEntry({ findings });
  };

  const validate = () => {
    if (entry.status === 'Fehler gefunden') {
      const bad = (entry.findings ?? []).some((f) => !f.description.trim());
      if (bad) {
        setValidationError('Bitte kurz beschreiben, was zu ändern ist.');
        return false;
      }
    }
    setValidationError(null);
    return true;
  };

  const goto = (next) => {
    if (!validate()) return;
    setIndex(Math.min(Math.max(next, 0), total - 1));
    setMessage(null);
  };

  // Schnellweg „Passt“: Status setzen und sofort zur nächsten Übung – ohne
  // Pflichtfeldprüfung, damit ein zuvor offener Fehler-Entwurf nicht blockiert.
  const markOkAndNext = () => {
    updateEntry({ status: 'fehlerfrei' });
    setValidationError(null);
    setMessage(null);
    setIndex((i) => Math.min(i + 1, total - 1));
  };

  const exportProtocol = () => {
    if (!validate()) return;
    const today = new Date().toISOString().slice(0, 10);
    download(`SVS_Update-Protokoll_${today}.md`, buildProtocolMarkdown(state, exercises), 'text/markdown');
    download(`SVS_Pruefdaten_${today}.json`, JSON.stringify(state, null, 2), 'application/json');
    setMessage('Update-Protokoll (Markdown) und Prüfdatensatz (JSON) wurden heruntergeladen.');
  };

  // Prüf-Link für Mitarbeiter teilen: nutzt das native Teilen-Menü des
  // Geräts (WhatsApp, Mail …), sonst wird der Link in die Zwischenablage
  // kopiert. Jeder Prüfer arbeitet auf seinem Gerät und schickt am Ende
  // die exportierten Protokolldateien zurück (Import-Funktion unten).
  const shareReviewLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?review=1`;
    const payload = {
      title: 'SV Schöning Trainingsplaner – Übungsprüfung',
      text:
        'Bitte prüfe die Übungen im Kontrollmodus. Wenn du fertig bist: ' +
        '„Update-Protokoll exportieren“ klicken und mir beide Dateien schicken.',
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        // Teilen abgebrochen → Fallback unten
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage(`Prüf-Link kopiert – einfach einfügen und verschicken: ${url}`);
    } catch {
      setMessage(`Prüf-Link zum Weitergeben: ${url}`);
    }
  };

  const importJson = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed?.entries) throw new Error('kein Prüfdatensatz');
        // Import ergänzt, ohne lokale Einträge zu überschreiben, außer der
        // Import ist neuer (checkedAt) – kein stiller Datenverlust.
        setState((s) => {
          const merged = { ...s.entries };
          Object.entries(parsed.entries).forEach(([id, imp]) => {
            const local = merged[id];
            if (!local || String(imp.checkedAt ?? '') > String(local.checkedAt ?? '')) {
              merged[id] = imp;
            }
          });
          return { ...s, entries: merged };
        });
        setMessage('Prüfdatensatz importiert und mit lokalen Eingaben zusammengeführt.');
      } catch {
        setMessage('Import fehlgeschlagen: Datei ist kein gültiger Prüfdatensatz (JSON).');
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="theme-scope" data-theme="v2">
      <Header subtitle="Kontrollmodus – Übungsprüfung (intern)" />
      <div className="app">
        <p className="svs-note svs-note--warn">
          Interner Prüfmodus: Eingaben verändern niemals die Übungsdatenbank.
          Fortschritt wird in diesem Browser gespeichert.
        </p>

        <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={shareReviewLink}>
            Prüf-Link an Kollegen senden
          </Button>
        </p>

        <div className="svs-review-counter" role="status" aria-live="polite">
          <span className="svs-review-counter__value">
            {checkedCount}/{total}
          </span>
          <span className="svs-review-counter__label">geprüft</span>
          <span className="svs-review-counter__sub">
            (offen: {total - checkedCount})
          </span>
        </div>

        {/* Eigene Auswahlliste statt <select>: native Options lassen sich in
            vielen Browsern/auf Handys nicht grün einfärben. Hier ist die grüne
            Markierung bereits geprüfter Übungen überall zuverlässig sichtbar. */}
        <div className="svs-review-picker">
          <button
            type="button"
            className="svs-review-picker__toggle"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((o) => !o)}
          >
            <span>Zu Übung springen</span>
            <span className="svs-review-picker__chev" aria-hidden="true">
              {pickerOpen ? '▲' : '▼'}
            </span>
          </button>
          {pickerOpen && (
            <ul className="svs-review-picker__list" role="listbox" aria-label="Übung auswählen">
              {exercises.map((x, i) => {
                const st = state.entries[x.id]?.status ?? 'Prüfung offen';
                const done = st !== 'Prüfung offen';
                return (
                  <li key={x.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === index}
                      className={
                        'svs-review-picker__item' +
                        (done ? ' is-done' : '') +
                        (i === index ? ' is-current' : '')
                      }
                      onClick={() => {
                        goto(i);
                        setPickerOpen(false);
                      }}
                    >
                      <span className="svs-review-picker__mark" aria-hidden="true">
                        {done ? '✓' : '○'}
                      </span>
                      <span className="svs-review-picker__label">
                        {x.id} · {x.title}
                      </span>
                      <span className="svs-review-picker__status">{st}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <article className="svs-card" style={{ padding: 'var(--sp-3, 12px)' }}>
          <h2 className="svs-card__title">
            <span className="svs-card__id">{e.id} · </span>
            {e.title}
          </h2>
          <p
            className="svs-card__meta"
            style={{
              whiteSpace: 'normal',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '3px 12px',
            }}
          >
            <span>{e.focusAreas.join(', ')}</span>
            <span>Jugend: {e.ageGroups.join(', ')}</span>
            <span className="svs-meta-chip" title={`${e.minPlayers}–${e.maxPlayers} Spieler`}>
              {PersonIcon}
              {e.minPlayers}–{e.maxPlayers}
            </span>
            <span
              className="svs-meta-chip"
              title={`${e.durationMin}–${e.durationMax} Minuten`}
            >
              {StopwatchIcon}
              {e.durationMin}–{e.durationMax}
            </span>
            <span>Phase: {e.phase}</span>
          </p>
          <DiagramCard
            type={e.phase}
            phase={e.phase}
            data={e.diagram?.data}
            altText={e.diagram?.diagramAltText || `Übungsgrafik: ${e.title}`}
            meta={{
              players: `${e.minPlayers}–${e.maxPlayers} Spieler`,
              field:
                e.fieldLength && e.fieldWidth ? `${e.fieldLength} × ${e.fieldWidth} m` : null,
              goals: e.goals,
            }}
          />
          {e.objective && (
            <p>
              <strong>Trainingsziel: </strong>
              {e.objective}
            </p>
          )}
          <InfoGrid exercise={e} />
        </article>

        <article className="svs-card" style={{ padding: 'var(--sp-3, 12px)' }} aria-label="Prüfeingaben">
          <h3 className="svs-card__title">Prüfung</h3>
          <div className="svs-review-quick">
            <Button
              className={`svs-review-quick__btn${
                entry.status === 'fehlerfrei' ? ' is-active is-ok' : ''
              }`}
              variant="secondary"
              onClick={markOkAndNext}
            >
              ✓ Passt
            </Button>
            <Button
              className={`svs-review-quick__btn${
                entry.status === 'Fehler gefunden' ? ' is-active is-error' : ''
              }`}
              variant="secondary"
              onClick={() =>
                updateEntry({
                  status: 'Fehler gefunden',
                  findings: entry.findings?.length ? entry.findings : [emptyFinding()],
                })
              }
            >
              ✗ Fehler
            </Button>
          </div>

          {entry.status === 'Fehler gefunden' && (
            <>
              <div className="svs-field">
                <label className="svs-field__label" htmlFor={`fb-${e.id}`}>
                  Was ist zu ändern? (Pflicht)
                </label>
                <textarea
                  id={`fb-${e.id}`}
                  className="svs-field__control"
                  rows={3}
                  placeholder="Kurz notieren, was nicht passt …"
                  value={(entry.findings ?? [emptyFinding()])[0].description}
                  onChange={(ev) => updateFinding(0, { description: ev.target.value })}
                />
              </div>

              <details className="svs-review-details">
                <summary>Details &amp; weitere Befunde (optional)</summary>

                <SelectField
                  label="Betroffener Bereich"
                  options={REVIEW_AREAS.map((a) => ({ value: a, label: a }))}
                  value={(entry.findings ?? [emptyFinding()])[0].area}
                  onChange={(ev) => updateFinding(0, { area: ev.target.value })}
                />
                <SelectField
                  label="Priorität"
                  options={REVIEW_PRIORITIES.map((p) => ({ value: p, label: p }))}
                  value={(entry.findings ?? [emptyFinding()])[0].priority}
                  onChange={(ev) => updateFinding(0, { priority: ev.target.value })}
                />
                <div className="svs-field">
                  <label className="svs-field__label" htmlFor={`sugg-${e.id}-0`}>
                    Korrekturvorschlag (optional)
                  </label>
                  <textarea
                    id={`sugg-${e.id}-0`}
                    className="svs-field__control"
                    rows={2}
                    value={(entry.findings ?? [emptyFinding()])[0].suggestion}
                    onChange={(ev) => updateFinding(0, { suggestion: ev.target.value })}
                  />
                </div>
                <div className="svs-field">
                  <label className="svs-field__label" htmlFor={`comm-${e.id}-0`}>
                    Zusatzkommentar (optional)
                  </label>
                  <textarea
                    id={`comm-${e.id}-0`}
                    className="svs-field__control"
                    rows={2}
                    value={(entry.findings ?? [emptyFinding()])[0].comment}
                    onChange={(ev) => updateFinding(0, { comment: ev.target.value })}
                  />
                </div>

                {(entry.findings ?? []).slice(1).map((f, j) => {
                  const i = j + 1;
                  return (
                    <fieldset key={i} className="svs-review-finding">
                      <legend>Weiterer Befund {i}</legend>
                      <SelectField
                        label="Betroffener Bereich"
                        options={REVIEW_AREAS.map((a) => ({ value: a, label: a }))}
                        value={f.area}
                        onChange={(ev) => updateFinding(i, { area: ev.target.value })}
                      />
                      <SelectField
                        label="Priorität"
                        options={REVIEW_PRIORITIES.map((p) => ({ value: p, label: p }))}
                        value={f.priority}
                        onChange={(ev) => updateFinding(i, { priority: ev.target.value })}
                      />
                      <div className="svs-field">
                        <label className="svs-field__label" htmlFor={`desc-${e.id}-${i}`}>
                          Fehlerbeschreibung (Pflicht)
                        </label>
                        <textarea
                          id={`desc-${e.id}-${i}`}
                          className="svs-field__control"
                          rows={3}
                          value={f.description}
                          onChange={(ev) => updateFinding(i, { description: ev.target.value })}
                        />
                      </div>
                      <div className="svs-field">
                        <label className="svs-field__label" htmlFor={`sugg-${e.id}-${i}`}>
                          Korrekturvorschlag (optional)
                        </label>
                        <textarea
                          id={`sugg-${e.id}-${i}`}
                          className="svs-field__control"
                          rows={2}
                          value={f.suggestion}
                          onChange={(ev) => updateFinding(i, { suggestion: ev.target.value })}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          updateEntry({ findings: entry.findings.filter((_, k) => k !== i) })
                        }
                      >
                        Befund entfernen
                      </Button>
                    </fieldset>
                  );
                })}

                <Button
                  variant="secondary"
                  onClick={() =>
                    updateEntry({ findings: [...(entry.findings ?? [emptyFinding()]), emptyFinding()] })
                  }
                >
                  Weiteren Befund hinzufügen
                </Button>
              </details>
            </>
          )}

          {validationError && (
            <p className="svs-note svs-note--error" role="alert">
              {validationError}
            </p>
          )}
          {message && (
            <p className="svs-note svs-note--success" role="status">
              {message}
            </p>
          )}

          <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => goto(index - 1)} disabled={index === 0}>
              ← Zurück
            </Button>
            <Button
              onClick={() => {
                if (validate()) {
                  updateEntry({});
                  setMessage('Prüfung gespeichert.');
                }
              }}
            >
              Prüfung speichern
            </Button>
            <Button variant="secondary" onClick={() => goto(index + 1)} disabled={index >= total - 1}>
              Weiter →
            </Button>
          </p>
          <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={exportProtocol}>
              Update-Protokoll exportieren
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              Prüfdatensatz importieren
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              aria-label="Prüfdatensatz (JSON) auswählen"
              onChange={(ev) => {
                const file = ev.target.files?.[0];
                if (file) importJson(file);
                ev.target.value = '';
              }}
            />
          </p>
        </article>
      </div>
    </main>
  );
}
