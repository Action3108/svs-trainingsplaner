import { useState } from 'react';
import { validateDiagramData } from '../logic/diagramSchema.js';

/**
 * SVG-Renderer für Übungsdiagramme nach dem Visual Style Guide.
 * Verarbeitet ausschließlich strukturierte diagramData (0–100, Angriff links → rechts).
 * Farben laufen über CSS-Variablen (--dia-*) und passen sich dem aktiven Theme an;
 * die Fallbacks entsprechen dem klassischen Style Guide (V1).
 * Optional: Ablauf-Animation – Marker laufen die Aktionspfeile entlang.
 */

const C = {
  field: 'var(--dia-field, #f5f5f3)',
  line: 'var(--dia-line, #111111)',
  teamDark: 'var(--dia-team-dark, #111111)',
  white: '#ffffff',
  gray: 'var(--dia-neutral, #a3a3a3)',
  ball: '#f59e0b',
  cone: '#f97316',
};

function Player({ p }) {
  if (p.team === 'gk') {
    return (
      <g>
        <rect
          x={p.x - 3} y={p.y - 3} width="6" height="6"
          transform={`rotate(45 ${p.x} ${p.y})`}
          fill={C.white} stroke={C.line} strokeWidth="0.7"
        />
        <text x={p.x} y={p.y + 1.2} textAnchor="middle" fontSize="3" fontWeight="bold" fill={C.line}>TW</text>
      </g>
    );
  }
  if (p.team === 'coach') {
    return (
      <g>
        <rect x={p.x - 2.8} y={p.y - 2.8} width="5.6" height="5.6" fill={C.teamDark} />
        <text x={p.x} y={p.y + 1.3} textAnchor="middle" fontSize="3.4" fontWeight="bold" fill={C.white}>T</text>
      </g>
    );
  }
  const label = p.team === 'neutral' ? 'N' : String(p.n ?? '');
  const fill = p.team === 'black' ? C.teamDark : p.team === 'neutral' ? C.gray : C.white;
  const textFill = p.team === 'white' ? C.line : C.white;
  return (
    <g>
      <circle cx={p.x} cy={p.y} r="3" fill={fill} stroke={C.line} strokeWidth="0.7" />
      <text x={p.x} y={p.y + 1.3} textAnchor="middle" fontSize="3.4" fontWeight="bold" fill={textFill}>
        {label}
      </text>
    </g>
  );
}

function Goal({ g }) {
  const vertical = g.x <= 8 || g.x >= 92;
  const len = g.type === 'youth' ? 14 : 8;
  const depth = 2.5;
  const x = vertical ? (g.x <= 8 ? g.x - depth : g.x) : g.x - len / 2;
  const y = vertical ? g.y - len / 2 : g.y <= 8 ? g.y - depth : g.y;
  return (
    <rect
      x={x} y={y}
      width={vertical ? depth : len}
      height={vertical ? len : depth}
      fill={g.type === 'cone' ? 'none' : C.white}
      stroke={C.line} strokeWidth="1"
    />
  );
}

function arrowPath(a) {
  if (a.type === 'rotation') {
    const mx = (a.from.x + a.to.x) / 2;
    const my = (a.from.y + a.to.y) / 2 - 10;
    return `M ${a.from.x} ${a.from.y} Q ${mx} ${my} ${a.to.x} ${a.to.y}`;
  }
  return `M ${a.from.x} ${a.from.y} L ${a.to.x} ${a.to.y}`;
}

function arrowStyle(type) {
  switch (type) {
    case 'pass': return { strokeWidth: 0.8, dash: '2.5 1.8' };
    case 'dribble': return { strokeWidth: 0.9, dash: '0.6 1.6' };
    case 'shot': return { strokeWidth: 2, dash: 'none' };
    default: return { strokeWidth: 0.8, dash: 'none' };
  }
}

function Arrow({ a }) {
  const s = arrowStyle(a.type);
  return (
    <path
      d={arrowPath(a)}
      fill="none"
      stroke={C.line}
      strokeWidth={s.strokeWidth}
      strokeDasharray={s.dash === 'none' ? undefined : s.dash}
      markerEnd={a.type === 'shot' ? 'url(#svs-arrow-big)' : 'url(#svs-arrow)'}
      strokeLinecap="round"
    />
  );
}

/** Animierter Marker, der den Pfeilpfad entlangläuft (Ball bei Pass/Schuss, Spielerpunkt bei Lauf/Dribbling). */
function ActionDot({ a, index }) {
  const isBall = a.type === 'pass' || a.type === 'shot';
  const dur = a.type === 'shot' ? '0.9s' : '1.6s';
  const begin = `${index * 1.8}s`;
  return (
    <g opacity="0.95">
      {isBall ? (
        <circle r="1.8" fill={C.ball} stroke={C.line} strokeWidth="0.5">
          <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={arrowPath(a)} />
        </circle>
      ) : (
        <circle r="2.3" fill={C.teamDark} stroke={C.white} strokeWidth="0.6">
          <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={arrowPath(a)} />
        </circle>
      )}
    </g>
  );
}

const LEGEND = [
  ['pass', 'Pass (gestrichelt)'],
  ['run', 'Laufweg (durchgezogen)'],
  ['dribble', 'Dribbling (gepunktet)'],
  ['shot', 'Torschuss (dick)'],
];

export default function DiagramRenderer({ data, altText, caption, showLegend = false, animatable = true }) {
  const [playing, setPlaying] = useState(false);
  const { valid, data: d } = validateDiagramData(data);
  if (!valid || !d) {
    return (
      <p className="svs-note" role="note">
        Für diese Übung liegt keine gültige Grafik vor.
      </p>
    );
  }
  const arrows = d.arrows ?? [];
  return (
    <figure className="svs-diagram" style={{ margin: 0 }}>
      <svg
        viewBox="-6 -6 112 112"
        role="img"
        aria-label={altText || caption || 'Übungsgrafik'}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <title>{altText || caption || 'Übungsgrafik'}</title>
        <defs>
          <marker id="svs-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 z" fill={C.line} />
          </marker>
          <marker id="svs-arrow-big" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 z" fill={C.line} />
          </marker>
          <pattern id="svs-hatch" width="3" height="3" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="3" stroke={C.gray} strokeWidth="0.8" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="100" height="100" fill={C.field} stroke={C.line} strokeWidth="0.8" rx="1.5" />

        {(d.zones ?? []).map((z, i) => (
          <g key={`z${i}`}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} fill="url(#svs-hatch)" fillOpacity="0.5" stroke={C.gray} strokeWidth="0.5" strokeDasharray="2 1.5" />
            {z.label && (
              <text x={z.x + z.w / 2} y={z.y + 4.5} textAnchor="middle" fontSize="3" fill={C.line}>{z.label}</text>
            )}
          </g>
        ))}

        {(d.lines ?? []).map((l, i) => (
          <g key={`l${i}`}>
            <line x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y} stroke={C.line} strokeWidth="0.5" strokeDasharray="3 2" />
            {l.label && (
              <text x={(l.from.x + l.to.x) / 2 + 1.5} y={(l.from.y + l.to.y) / 2} fontSize="2.6" fill={C.line}>{l.label}</text>
            )}
          </g>
        ))}

        {(d.goals ?? []).map((g, i) => <Goal key={`g${i}`} g={g} />)}
        {arrows.map((a, i) => <Arrow key={`a${i}`} a={a} />)}

        {(d.cones ?? []).map((c, i) => (
          <path
            key={`c${i}`}
            d={`M ${c.x} ${c.y - 2.2} L ${c.x + 1.9} ${c.y + 1.4} L ${c.x - 1.9} ${c.y + 1.4} Z`}
            fill={C.cone} stroke={C.line} strokeWidth="0.4"
          />
        ))}

        {(d.balls ?? []).map((b, i) => (
          <circle key={`b${i}`} cx={b.x} cy={b.y} r="1.5" fill={C.ball} stroke={C.line} strokeWidth="0.5" />
        ))}

        {(d.players ?? []).map((p, i) => <Player key={`p${i}`} p={p} />)}

        {/* Ablauf-Animation: Marker laufen die Pfeile nacheinander ab */}
        {playing && arrows.map((a, i) => <ActionDot key={`m${i}`} a={a} index={i} />)}
      </svg>

      {animatable && arrows.length > 0 && (
        <button
          type="button"
          className="svs-btn svs-btn--ghost no-print svs-diagram__play"
          aria-pressed={playing}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? '⏸ Animation anhalten' : '▶ Ablauf abspielen'}
        </button>
      )}

      {caption && (
        <figcaption style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)', marginTop: 'var(--sp-1)' }}>
          {caption}
        </figcaption>
      )}
      {showLegend && (
        <ul className="svs-diagram-legend" style={{ listStyle: 'none', padding: 0, margin: 'var(--sp-2) 0 0', display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)', fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>
          {LEGEND.map(([k, label]) => (
            <li key={k}>{label}</li>
          ))}
          <li>⬤ Team Dunkel · ◯ Team Weiß · N Neutral · ◆ TW Torwart · ■ T Trainer</li>
          <li>▲ Hütchen (orange) · ● Ball (orange)</li>
        </ul>
      )}
    </figure>
  );
}
