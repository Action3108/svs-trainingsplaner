import { sy } from './scale.js';

/**
 * Bewegungslinien: Bedeutung über Farbe UND Strichmuster/-stärke.
 * Pass = blau gestrichelt · Laufweg = grau durchgezogen ·
 * Dribbling = orange gepunktet · Torschuss = koralle dick ·
 * Rotation = grau gebogen. Linien halten Abstand zu Symbolen.
 */

const STYLE = {
  pass: { stroke: 'var(--dgm-pass, #2563eb)', width: 0.65, dash: '2.4 1.7', marker: 'pass' },
  run: { stroke: 'var(--dgm-run, #344054)', width: 0.65, dash: null, marker: 'run' },
  dribble: { stroke: 'var(--dgm-dribble, #f59e0b)', width: 0.7, dash: '0.4 1.5', marker: 'dribble' },
  shot: { stroke: 'var(--dgm-shot, #f04438)', width: 1.2, dash: null, marker: 'shot' },
  rotation: { stroke: 'var(--dgm-run, #344054)', width: 0.65, dash: null, marker: 'run' },
};

/** Verkürzt die Linie an beiden Enden (Abstand zu Spielern/Bällen). */
function shorten(from, to, gap = 5.2) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const g = Math.min(gap, len * 0.22);
  const ux = dx / len;
  const uy = dy / len;
  return {
    from: { x: from.x + ux * g, y: from.y + uy * g },
    to: { x: to.x - ux * g, y: to.y - uy * g },
  };
}

export function motionPath(a) {
  const from = { x: a.from.x, y: sy(a.from.y) };
  const to = { x: a.to.x, y: sy(a.to.y) };
  const s = shorten(from, to);
  if (a.type === 'rotation') {
    const mx = (s.from.x + s.to.x) / 2;
    const my = Math.max(2, (s.from.y + s.to.y) / 2 - 8);
    return `M ${s.from.x.toFixed(1)} ${s.from.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${s.to.x.toFixed(1)} ${s.to.y.toFixed(1)}`;
  }
  return `M ${s.from.x.toFixed(1)} ${s.from.y.toFixed(1)} L ${s.to.x.toFixed(1)} ${s.to.y.toFixed(1)}`;
}

export default function MotionLine({ a }) {
  const st = STYLE[a.type] ?? STYLE.run;
  return (
    <path
      d={motionPath(a)}
      fill="none"
      stroke={st.stroke}
      strokeWidth={st.width}
      strokeDasharray={st.dash ?? undefined}
      strokeLinecap="round"
      markerEnd={`url(#dgm-arrow-${st.marker})`}
    />
  );
}

/** Pfeilspitzen-Definitionen für alle Linienfarben. */
export function MotionMarkerDefs() {
  const colors = {
    pass: 'var(--dgm-pass, #2563eb)',
    run: 'var(--dgm-run, #344054)',
    dribble: 'var(--dgm-dribble, #f59e0b)',
    shot: 'var(--dgm-shot, #f04438)',
  };
  return (
    <>
      {Object.entries(colors).map(([k, color]) => (
        <marker
          key={k}
          id={`dgm-arrow-${k}`}
          viewBox="0 0 8 8"
          refX="6.5"
          refY="4"
          markerWidth={k === 'shot' ? 3.4 : 4.6}
          markerHeight={k === 'shot' ? 3.4 : 4.6}
          orient="auto-start-reverse"
        >
          <path d="M0.5,0.5 L7.5,4 L0.5,7.5 Z" fill={color} />
        </marker>
      ))}
    </>
  );
}
