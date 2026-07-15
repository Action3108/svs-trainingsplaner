import { sy, VB_W, VB_H } from './scale.js';

/**
 * Marker-Komponenten: Spieler, Ball, Pylonen, Tore, Zonen.
 * Teams über Farbe unterscheidbar:
 * Blau = Kreis · Koralle = Kreis · Neutral = Sechseck ·
 * Torwart = Handschuh-Piktogramm (kompakt) · Trainer = Person-Piktogramm.
 * Ball = klassisch schwarz-weiß. Keine weißen Außenringe.
 */

const R = 3.8;

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

/** Klassischer Schwarz-Weiß-Ball (wiederverwendbar, auch für die Animation). */
export function BallGlyph({ cx = 0, cy = 0, r = 1.5 }) {
  const k = r / 1.5;
  return (
    <g filter="url(#dgm-shadow)">
      <circle cx={cx} cy={cy} r={r} fill="#ffffff" stroke="#101828" strokeWidth={0.28 * k} />
      {/* zentrales Fünfeck */}
      <polygon
        points={Array.from({ length: 5 }, (_, i) => {
          const a = ((Math.PI * 2) / 5) * i - Math.PI / 2;
          return `${cx + 0.62 * k * Math.cos(a)},${cy + 0.62 * k * Math.sin(a)}`;
        }).join(' ')}
        fill="#101828"
      />
      {/* angedeutete Randfelder */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = ((Math.PI * 2) / 5) * i - Math.PI / 2 + Math.PI / 5;
        return (
          <circle
            key={i}
            cx={cx + 1.18 * k * Math.cos(a)}
            cy={cy + 1.18 * k * Math.sin(a)}
            r={0.24 * k}
            fill="#101828"
          />
        );
      })}
    </g>
  );
}

/** Torwart: Plakette mit Handschuh-Piktogramm, halb so groß wie ein Feldspieler-Marker. */
function GoalkeeperMarker({ cx, cy }) {
  return (
    <g
      filter="url(#dgm-shadow)"
      transform={`translate(${cx} ${cy}) scale(0.5) translate(${-cx} ${-cy})`}
    >
      <rect x={cx - R} y={cy - R} width={R * 2} height={R * 2} rx="1.5" fill="var(--dgm-gk, #163a2d)" />
      <g fill="#ffffff">
        <rect x={cx - 1.5} y={cy - 1.9} width={3.0} height={3.1} rx="1.1" />
        <rect x={cx - 1.5} y={cy - 2.4} width={0.62} height={1.4} rx="0.3" />
        <rect x={cx - 0.72} y={cy - 2.75} width={0.62} height={1.7} rx="0.3" />
        <rect x={cx + 0.06} y={cy - 2.75} width={0.62} height={1.7} rx="0.3" />
        <rect x={cx + 0.84} y={cy - 2.4} width={0.62} height={1.4} rx="0.3" />
        <circle cx={cx + 1.75} cy={cy - 0.3} r="0.62" />
        <rect x={cx - 1.2} y={cy + 1.35} width={2.4} height={0.7} rx="0.3" />
      </g>
    </g>
  );
}

/** Trainer: Piktogramm einer stehenden Person (ohne Kontur). */
function CoachMarker({ cx, cy }) {
  const c = 'var(--dgm-coach, #101828)';
  return (
    <g filter="url(#dgm-shadow)">
      <circle cx={cx} cy={cy - 3.1} r="1.25" fill={c} />
      <path
        d={`M ${cx - 1.7} ${cy - 1.5}
            Q ${cx} ${cy - 2.1} ${cx + 1.7} ${cy - 1.5}
            L ${cx + 1.15} ${cy + 0.9}
            L ${cx - 1.15} ${cy + 0.9} Z`}
        fill={c}
      />
      <path d={`M ${cx - 1.0} ${cy + 0.9} L ${cx - 0.95} ${cy + 3.6} L ${cx - 0.25} ${cy + 3.6} L ${cx - 0.15} ${cy + 1.0} Z`} fill={c} />
      <path d={`M ${cx + 1.0} ${cy + 0.9} L ${cx + 0.95} ${cy + 3.6} L ${cx + 0.25} ${cy + 3.6} L ${cx + 0.15} ${cy + 1.0} Z`} fill={c} />
    </g>
  );
}

export function PlayerMarker({ p }) {
  const cx = p.x;
  const cy = sy(p.y);

  if (p.team === 'gk') return <GoalkeeperMarker cx={cx} cy={cy} />;
  if (p.team === 'coach') return <CoachMarker cx={cx} cy={cy} />;

  if (p.team === 'neutral') {
    return (
      <g filter="url(#dgm-shadow)">
        <polygon points={hexPoints(cx, cy, R + 0.2)} fill="var(--dgm-neutral, #7f56d9)" />
        <text x={cx} y={cy + 1.3} textAnchor="middle" fontSize="3.2" fontWeight="600" fill="#ffffff">N</text>
      </g>
    );
  }
  const isB = p.team === 'white';
  return (
    <g filter="url(#dgm-shadow)">
      <circle cx={cx} cy={cy} r={R}
        fill={isB ? 'var(--dgm-team-b, #f04438)' : 'var(--dgm-team-a, #2563eb)'} />
      <text x={cx} y={cy + 1.3} textAnchor="middle" fontSize="3.2" fontWeight="600" fill="#ffffff">
        {p.n ?? ''}
      </text>
    </g>
  );
}

export function BallMarker({ b }) {
  return <BallGlyph cx={b.x} cy={sy(b.y)} r={1.5} />;
}

/** Pylone: Standplatte, konischer Körper, Reflexstreifen. */
export function ConeMarker({ c }) {
  const cx = c.x;
  const cy = sy(c.y);
  return (
    <g filter="url(#dgm-shadow)">
      <rect x={cx - 1.7} y={cy + 1.15} width={3.4} height={0.75} rx="0.35"
        fill="var(--dgm-cone, #f97316)" stroke="#9a3412" strokeWidth="0.25" />
      <path
        d={`M ${cx - 0.55} ${cy - 2.1}
            Q ${cx} ${cy - 2.5} ${cx + 0.55} ${cy - 2.1}
            L ${cx + 1.15} ${cy + 1.15}
            L ${cx - 1.15} ${cy + 1.15} Z`}
        fill="var(--dgm-cone, #f97316)" stroke="#9a3412" strokeWidth="0.25"
      />
      <path d={`M ${cx - 0.78} ${cy - 0.85} L ${cx + 0.78} ${cy - 0.85} L ${cx + 0.9} ${cy - 0.2} L ${cx - 0.9} ${cy - 0.2} Z`} fill="#ffffff" opacity="0.9" />
    </g>
  );
}

/**
 * Tore: stehen minimal IM Feld, ausgearbeitet mit Pfosten und Netz.
 * Vorderkante (torlinienseitig) betont, Netzgitter innen.
 */
export function GoalMarker({ g }) {
  const cx = g.x;
  const cy = sy(g.y);
  const vertical = g.x <= 8 || g.x >= 92;
  const len = g.type === 'youth' ? 12 : 7;
  const depth = g.type === 'youth' ? 3.2 : 2.6;
  const inset = 0.7; // minimal im Feld

  let x, y, w, h, frontEdge;
  if (vertical) {
    const left = g.x <= 8;
    x = left ? inset : VB_W - inset - depth;
    y = Math.min(Math.max(cy - len / 2, inset), VB_H - inset - len);
    w = depth;
    h = len;
    frontEdge = left
      ? { x1: x + w, y1: y, x2: x + w, y2: y + h }
      : { x1: x, y1: y, x2: x, y2: y + h };
  } else {
    const top = g.y <= 8;
    y = top ? inset : VB_H - inset - depth;
    x = Math.min(Math.max(cx - len / 2, inset), VB_W - inset - len);
    w = len;
    h = depth;
    frontEdge = top
      ? { x1: x, y1: y + h, x2: x + w, y2: y + h }
      : { x1: x, y1: y, x2: x + w, y2: y };
  }

  const line = 'var(--dgm-goal-line, #667085)';
  const netN = g.type === 'youth' ? 5 : 3;
  const netM = 2;
  const nets = [];
  for (let i = 1; i <= (vertical ? netM : netN); i++) {
    const xx = x + (w / ((vertical ? netM : netN) + 1)) * i;
    nets.push(<line key={`v${i}`} x1={xx} y1={y + 0.3} x2={xx} y2={y + h - 0.3} />);
  }
  for (let i = 1; i <= (vertical ? netN : netM); i++) {
    const yy = y + (h / ((vertical ? netN : netM) + 1)) * i;
    nets.push(<line key={`h${i}`} x1={x + 0.3} y1={yy} x2={x + w - 0.3} y2={yy} />);
  }

  return (
    <g filter="url(#dgm-shadow)">
      <rect x={x} y={y} width={w} height={h} rx="0.5" fill="#ffffff" stroke={line} strokeWidth="0.5" />
      <g stroke={line} strokeWidth="0.16" opacity="0.75">{nets}</g>
      {/* Pfosten/Vorderkante zum Feld hin betont */}
      <line {...frontEdge} stroke="#344054" strokeWidth="0.7" strokeLinecap="round" />
    </g>
  );
}

/** Zielzone: schraffiert, minimal kleiner als das Spielfeld,
 *  damit sie sichtbar IM Feld liegt und nicht auf der Außenlinie. */
export function ZoneMarker({ z }) {
  const inset = 1.5;
  const x1 = Math.max(z.x, inset);
  const y1 = Math.max(sy(z.y), inset);
  const x2 = Math.min(z.x + z.w, VB_W - inset);
  const y2 = Math.min(sy(z.y + z.h), VB_H - inset);
  return (
    <g>
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} rx="4"
        fill="url(#dgm-zone-hatch)"
        stroke="var(--dgm-zone, #b7f36b)" strokeWidth="0.4" />
      {z.label && (
        <text x={x1 + (x2 - x1) / 2} y={y1 + 3.2} textAnchor="middle"
          fontSize="2.6" fontWeight="600" fill="var(--dgm-zone-label, #3f621a)">
          {z.label}
        </text>
      )}
    </g>
  );
}

export { R as PLAYER_RADIUS, VB_W };
