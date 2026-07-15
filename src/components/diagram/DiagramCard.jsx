import { useRef, useState } from 'react';
import Diagram from './Diagram.jsx';
import { validateDiagramData } from '../../logic/diagramSchema.js';

/**
 * Diagrammkarte: Titel, Übungsart, Meta-Chips (Spieler, Feldgröße, Tore),
 * Spielfeld, kurze Erklärung, einklappbare Chip-Legende,
 * Vollbild-Button und optionale Ablauf-Animation.
 */

const LEGEND_CHIPS = [
  { key: 'pass', label: 'Pass', swatch: { borderBottom: '3px dashed var(--dgm-pass)' } },
  { key: 'run', label: 'Laufweg', swatch: { borderBottom: '3px solid var(--dgm-run)' } },
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
  animatable,
}) {
  const dialogRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const { valid, data: d } = validateDiagramData(data);
  const hasArrows = valid && (d?.arrows?.length ?? 0) > 0;
  // Spielformen und Abschlussspiel brauchen keine Ablauf-Animation
  // (freies Spiel statt fester Abfolge) – außer explizit übersteuert.
  const isGamePhase = /spielform|abschlussspiel/i.test(type ?? '');
  const canAnimate = (animatable ?? !isGamePhase) && hasArrows;

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

      <Diagram data={data} altText={altText} playing={canAnimate && playing} />

      {canAnimate && (
        <button
          type="button"
          className="dgm-card__play no-print"
          aria-pressed={playing}
          onClick={() => setPlaying((p) => !p)}
          style={{ marginTop: 'var(--sp-2, 8px)' }}
        >
          {playing ? '⏸ Animation anhalten' : '▶ Ablauf abspielen'}
        </button>
      )}

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
            <li className="dgm-chip">🔵 Team Blau · 🔴 Team Koralle · ⬡ N Neutral · 🧤 Torwart · 🧍 Trainer · Pylone</li>
          </ul>
        </details>
      )}

      {valid && (
        <dialog className="dgm-dialog" ref={dialogRef} aria-label={`${title ?? 'Diagramm'} – vergrößert`}>
          <Diagram data={data} altText={altText} playing={canAnimate && playing} />
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
