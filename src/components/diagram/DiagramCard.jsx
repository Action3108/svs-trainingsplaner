import { useRef } from 'react';
import Diagram from './Diagram.jsx';
import { validateDiagramData } from '../../logic/diagramSchema.js';

/**
 * Diagrammkarte: Titel, Übungsart, Meta-Chips (Spieler, Feldgröße, Tore),
 * Spielfeld, kurze Erklärung, einklappbare Chip-Legende und Vollbild-Button.
 * Entscheidung 2026-07-17: Laufwege und Ablauf-Animation sind ausgeblendet –
 * die Grafiken zeigen den ruhigen Grundaufbau mit Ball.
 */

const LEGEND_CHIPS = [
  { key: 'pass', label: 'Pass', swatch: { borderBottom: '3px dashed var(--dgm-pass)' } },
  { key: 'dribble', label: 'Dribbling', swatch: { borderBottom: '3px dotted var(--dgm-dribble)' } },
  { key: 'shot', label: 'Torschuss', swatch: { borderBottom: '4px solid var(--dgm-shot)' } },
  { key: 'ball', label: '⚽ Ball' },
  { key: 'cone', label: 'Hütchen', dot: 'var(--dgm-cone)' },
];

export default function DiagramCard({
  title,
  type,
  meta = {},
  description,
  data,
  altText,
  defaultLegendOpen = false,
}) {
  const dialogRef = useRef(null);
  const { valid } = validateDiagramData(data);

  const metaChips = [
    meta.players && { icon: '👥', label: meta.players },
    meta.field && { icon: '📐', label: meta.field },
    meta.goals && { icon: '🥅', label: meta.goals },
  ].filter(Boolean);

  return (
    <article className="dgm-card">
      <div className="dgm-card__head">
        <div className="dgm-card__titles">
          {title && <h3 className="dgm-card__title">{title}</h3>}
          {type && <p className="dgm-card__type">{type}</p>}
        </div>
        {valid && (
          <button
            type="button"
            className="dgm-card__fullscreen no-print"
            aria-label="Diagramm vergrößern"
            onClick={() => dialogRef.current?.showModal()}
          >
            ⛶
          </button>
        )}
      </div>

      {metaChips.length > 0 && (
        <ul className="dgm-card__meta">
          {metaChips.map((c) => (
            <li key={c.label} className="dgm-chip">
              <span aria-hidden="true">{c.icon}</span> {c.label}
            </li>
          ))}
        </ul>
      )}

      <Diagram data={data} altText={altText} />

      {description && <p className="dgm-card__desc">{description}</p>}

      {valid && (
        <details className="dgm-card__legend" open={defaultLegendOpen}>
          <summary>Legende anzeigen</summary>
          <ul className="dgm-card__legend-chips">
            {LEGEND_CHIPS.map((c) => (
              <li key={c.key} className="dgm-chip">
                {c.swatch && <span className="dgm-chip__swatch" style={c.swatch} aria-hidden="true" />}
                {c.dot && <span className="dgm-chip__dot" style={{ background: c.dot }} aria-hidden="true" />}
                {c.label}
              </li>
            ))}
            <li className="dgm-chip">🔵 Team Blau · 🔴 Team Rot · ⬡ N Neutral · 🧤 Torwart · 🧍 Trainer · Pylone</li>
          </ul>
        </details>
      )}

      {valid && (
        <dialog className="dgm-dialog" ref={dialogRef} aria-label={`${title ?? 'Diagramm'} – vergrößert`}>
          <Diagram data={data} altText={altText} />
          <button
            type="button"
            className="dgm-card__play"
            style={{ marginTop: 12 }}
            onClick={() => dialogRef.current?.close()}
          >
            Schließen
          </button>
        </dialog>
      )}
    </article>
  );
}
