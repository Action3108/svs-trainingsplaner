/**
 * Informationskarten der Übungsdetailansicht (Backlog §12):
 * klar getrennte Blöcke im Zwei-Spalten-Raster mit semantischen Icons.
 * Icons sind dekorativ (aria-hidden) – der ausgeschriebene Begriff bleibt
 * immer sichtbar. Auf sehr schmalen Displays bricht das Raster einspaltig um.
 */

import EquipmentList from './EquipmentList.jsx';

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** Einheitliches Icon-Set im Stil des Designsystems (Stroke, 20×20). */
export const INFO_ICONS = {
  material: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path {...stroke} d="M3 7l7-4 7 4v6l-7 4-7-4z" />
      <path {...stroke} d="M3 7l7 4 7-4M10 11v6" />
    </svg>
  ),
  aufbau: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect {...stroke} x="3" y="3" width="14" height="14" rx="1.5" />
      <path {...stroke} d="M10 3v14M3 10h14" />
    </svg>
  ),
  ablauf: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path {...stroke} d="M4 5h9M4 10h6M4 15h9" />
      <path {...stroke} d="M15 8l3 2-3 2" />
    </svg>
  ),
  regeln: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path {...stroke} d="M6 3h8a1 1 0 0 1 1 1v13l-5-2.5L5 17V4a1 1 0 0 1 1-1z" />
    </svg>
  ),
  coaching: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path {...stroke} d="M3 8v4l8 3V5L3 8z" />
      <path {...stroke} d="M11 6.5c2 .8 2 6.2 0 7M14 5c3 1.5 3 8.5 0 10" />
    </svg>
  ),
  regression: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path {...stroke} d="M10 4v12M5 11l5 5 5-5" />
    </svg>
  ),
  progression: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path {...stroke} d="M10 16V4M5 9l5-5 5 5" />
    </svg>
  ),
};

export function InfoBlock({ icon, title, text, content }) {
  if (!content && !String(text ?? '').trim()) return null;
  return (
    <section className="svs-info">
      <h4 className="svs-info__title">
        <span className="svs-info__icon">{INFO_ICONS[icon] ?? null}</span>
        {title}
      </h4>
      {content ? (
        <div className="svs-info__text">{content}</div>
      ) : (
        <p className="svs-info__text">{text}</p>
      )}
    </section>
  );
}

/**
 * Zwei-Spalten-Raster in konsistenter Platz-Reihenfolge:
 * Material → Aufbau → Ablauf → Regeln → Coaching → leichter/schwerer.
 */
export default function InfoGrid({ exercise }) {
  const e = exercise ?? {};
  const blocks = [
    {
      icon: 'material',
      title: 'Material',
      text: (e.equipment ?? []).join(', '),
      content: (e.equipment ?? []).length > 0 ? <EquipmentList items={e.equipment} /> : null,
    },
    { icon: 'aufbau', title: 'Aufbau', text: e.setup },
    { icon: 'ablauf', title: 'Ablauf', text: e.procedure },
    { icon: 'regeln', title: 'Regeln', text: e.rules },
    { icon: 'coaching', title: 'Coaching', text: e.coachingPoints },
    { icon: 'regression', title: 'Leichtere Variante', text: e.regression },
    { icon: 'progression', title: 'Schwierigere Variante', text: e.progression },
  ].filter((b) => b.content || String(b.text ?? '').trim());

  if (blocks.length === 0) return null;
  return (
    <div className="svs-info-grid">
      {blocks.map((b) => (
        <InfoBlock key={b.title} {...b} />
      ))}
    </div>
  );
}
