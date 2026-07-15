import { sy } from './scale.js';

/**
 * Ablauf-Animation V2 – sequenziell statt parallel.
 *
 * Grundsätze:
 * - Die Aktionen laufen NACHEINANDER ab (Pass 1 → Pass 2 → Torschuss …),
 *   verkettet über SMIL-Syncbase (begin = "<vorherige-id>.end + Pause").
 * - Es bewegen sich die ECHTEN Symbole: Beim Pass rollt der vorhandene Ball,
 *   beim Laufweg läuft der Spieler selbst, beim Dribbling Spieler UND Ball.
 * - Nach der letzten Aktion startet die Sequenz nach kurzer Pause von vorn.
 *
 * buildAnimationPlan(d) liefert pro Spieler-/Ball-Index die animateMotion-
 * Segmente (relative Pfade zur Basisposition) sowie "Dummy"-Segmente für
 * Pfeile ohne bewegliches Symbol, damit die Zeitkette nicht abreißt.
 */

const DUR = { pass: 1.0, run: 1.4, dribble: 1.6, rotation: 1.6, shot: 0.7 };
const GAP = 0.25; // Pause zwischen zwei Aktionen (s)
const LOOP_PAUSE = 1.4; // Pause vor dem Neustart der Sequenz (s)
const PLAYER_MATCH_DIST = 12; // max. Abstand Pfeilstart ↔ Spieler (skaliert)

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearestIndex(points, target, maxDist = Infinity) {
  let best = -1;
  let bestD = maxDist;
  points.forEach((p, i) => {
    const d = dist(p, target);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** Punkt kurz vor dem Ziel (Ball stoppt am Fuß des Mitspielers). */
function pullBack(from, to, gap) {
  const d = dist(from, to) || 1;
  const t = Math.max(0, (d - gap) / d);
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

/** Punkt kurz hinter dem Ziel (Ball liegt beim Dribbling vor dem Fuß). */
function pushAhead(from, to, gap) {
  const d = dist(from, to) || 1;
  const t = (d + gap) / d;
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

export function buildAnimationPlan(d) {
  const arrows = d.arrows ?? [];
  const players = d.players ?? [];
  const balls = d.balls ?? [];

  // Basis- und Laufpositionen (skalierte Koordinaten)
  const pBase = players.map((p) => ({ x: p.x, y: sy(p.y) }));
  const bBase = balls.map((b) => ({ x: b.x, y: sy(b.y) }));
  const pPos = pBase.map((p) => ({ ...p }));
  const bPos = bBase.map((b) => ({ ...b }));

  const playerAnims = players.map(() => []);
  const ballAnims = balls.map(() => []);
  const dummies = [];
  const n = arrows.length;

  arrows.forEach((a, i) => {
    const id = `dgm-seq-${i}`;
    const dur = DUR[a.type] ?? 1.2;
    const begin =
      i === 0
        ? `0s;dgm-seq-${n - 1}.end+${LOOP_PAUSE}s`
        : `dgm-seq-${i - 1}.end+${GAP}s`;
    const from = { x: a.from.x, y: sy(a.from.y) };
    const to = { x: a.to.x, y: sy(a.to.y) };
    let idUsed = false;

    const movesPlayer = a.type === 'run' || a.type === 'dribble' || a.type === 'rotation';
    const movesBall = a.type === 'pass' || a.type === 'shot' || a.type === 'dribble';

    if (movesPlayer) {
      const pi = nearestIndex(pPos, from, PLAYER_MATCH_DIST);
      if (pi >= 0) {
        const base = pBase[pi];
        const start = pPos[pi];
        const rel = (pt) => `${(pt.x - base.x).toFixed(1)} ${(pt.y - base.y).toFixed(1)}`;
        let path;
        if (a.type === 'rotation') {
          const mid = {
            x: (start.x + to.x) / 2,
            y: Math.max(2, (start.y + to.y) / 2 - 8),
          };
          path = `M ${rel(start)} Q ${rel(mid)} ${rel(to)}`;
        } else {
          path = `M ${rel(start)} L ${rel(to)}`;
        }
        playerAnims[pi].push({ id, begin, dur, path });
        pPos[pi] = { ...to };
        idUsed = true;
      }
    }

    if (movesBall && balls.length > 0) {
      const bi = nearestIndex(bPos, from);
      const base = bBase[bi];
      const start = bPos[bi];
      let end = { ...to };
      if (a.type === 'pass') end = pullBack(start, to, 4.2);
      if (a.type === 'dribble') end = pushAhead(start, to, 2.0);
      const rel = (pt) => `${(pt.x - base.x).toFixed(1)} ${(pt.y - base.y).toFixed(1)}`;
      ballAnims[bi].push({
        id: idUsed ? undefined : id,
        begin,
        dur,
        path: `M ${rel(start)} L ${rel(end)}`,
      });
      bPos[bi] = end;
      idUsed = true;
    }

    // Kein bewegliches Symbol gefunden → unsichtbares Dummy hält die Kette zusammen.
    if (!idUsed) dummies.push({ id, begin, dur });
  });

  return { playerAnims, ballAnims, dummies };
}
