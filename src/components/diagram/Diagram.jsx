import { useLayoutEffect, useRef } from 'react';
import { validateDiagramData } from '../../logic/diagramSchema.js';
import { VB_W, VB_H, sy } from './scale.js';
import Field from './Field.jsx';
import MotionLine, { MotionMarkerDefs } from './MotionLine.jsx';
import { PlayerMarker, BallMarker, ConeMarker, GoalMarker, ZoneMarker } from './markers.jsx';
import { buildAnimationPlan } from './animation.js';

/** animateMotion-Segmente für ein Symbol (animiert die umgebende Gruppe). */
function MotionSegments({ segments }) {
  return segments.map((s, j) => (
    <animateMotion
      key={j}
      id={s.id}
      dur={`${s.dur}s`}
      begin={s.begin}
      fill="freeze"
      path={s.path}
    />
  ));
}

/**
 * Datengetriebener SVG-Renderer V3 „Moderne Spielfeldkarte“.
 * Ein Renderer für alle Diagramme – Eingabe sind ausschließlich
 * die vorhandenen diagramData (Koordinaten 0–100), gerendert im 16:10-Format.
 */
export default function Diagram({ data, altText, playing = false }) {
  const svgRef = useRef(null);

  // SMIL-Zeitbasis: begin="0s" bezieht sich auf den Start der SVG-Zeitleiste
  // (Seitenladezeitpunkt). Da die Animationselemente erst beim Klick auf
  // „Abspielen“ eingefügt werden, läge ihr Start sonst in der Vergangenheit –
  // mit fill="freeze" spränge alles sofort an die Endposition. Deshalb wird
  // die Zeitleiste beim Start der Wiedergabe auf 0 zurückgesetzt.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (playing && typeof svg?.setCurrentTime === 'function') {
      svg.setCurrentTime(0);
      svg.unpauseAnimations?.();
    }
  }, [playing]);

  const { valid, data: d } = validateDiagramData(data);
  if (!valid || !d) {
    return (
      <p className="svs-note svs-note--error" role="note">
        Für diese Übung liegt keine gültige Grafik vor.
      </p>
    );
  }
  const arrows = d.arrows ?? [];
  // Sequenzieller Ablaufplan: echte Spieler/Bälle laufen die Aktionen nacheinander ab.
  const plan = playing ? buildAnimationPlan(d) : null;
  return (
    <svg
      ref={svgRef}
      className="dgm-stage"
      viewBox={`-1.5 -1.5 ${VB_W + 3} ${VB_H + 3}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={altText || 'Übungsgrafik'}
    >
      <title>{altText || 'Übungsgrafik'}</title>
      <defs>
        <MotionMarkerDefs />
        <filter id="dgm-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodColor="#101828" floodOpacity="0.25" />
        </filter>
        {/* Schraffur für Zielzonen */}
        <pattern id="dgm-zone-hatch" width="2.4" height="2.4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="2.4" height="2.4" fill="var(--dgm-zone, #b7f36b)" fillOpacity="0.12" />
          <line x1="0" y1="0" x2="0" y2="2.4" stroke="var(--dgm-zone, #b7f36b)" strokeWidth="0.55" strokeOpacity="0.75" />
        </pattern>
      </defs>

      {/* Spielfeld – dekorativ */}
      <g aria-hidden="true">
        <Field />
      </g>

      {/* Zonen */}
      <g aria-hidden="true">
        {(d.zones ?? []).map((z, i) => <ZoneMarker key={`z${i}`} z={z} />)}
      </g>

      {/* Hilfslinien (Mittellinie, Schusslinie …) – Beschriftung am Diagrammrand */}
      <g aria-hidden="true">
        {(d.lines ?? []).map((l, i) => {
          const isVertical = Math.abs(l.from.x - l.to.x) < Math.abs(l.from.y - l.to.y);
          return (
            <g key={`l${i}`}>
              <line
                x1={l.from.x} y1={sy(l.from.y)} x2={l.to.x} y2={sy(l.to.y)}
                stroke="var(--dgm-field-line, #a7c9af)" strokeWidth="0.7" strokeDasharray="2.2 1.6"
              />
              {l.label && (
                <text
                  x={isVertical ? (l.from.x + l.to.x) / 2 + 1.2 : 1.5}
                  y={isVertical ? 2.8 : (sy(l.from.y) + sy(l.to.y)) / 2 - 1}
                  fontSize="2.4"
                  fontWeight="600"
                  fill="var(--dgm-muted, #475467)"
                >
                  {l.label}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Tore */}
      <g aria-hidden="true">
        {(d.goals ?? []).map((g, i) => <GoalMarker key={`g${i}`} g={g} />)}
      </g>

      {/* Bewegungslinien – während der Animation ausgeblendet
          (die Bewegung selbst zeigt den Ablauf) */}
      {!playing && (
        <g aria-hidden="true">
          {arrows.map((a, i) => <MotionLine key={`a${i}`} a={a} />)}
        </g>
      )}

      {/* Material – Bälle laufen bei aktiver Animation selbst mit */}
      <g aria-hidden="true">
        {(d.cones ?? []).map((c, i) => <ConeMarker key={`c${i}`} c={c} />)}
        {(d.balls ?? []).map((b, i) => (
          <g key={`b${i}`}>
            <BallMarker b={b} />
            {plan && <MotionSegments segments={plan.ballAnims[i]} />}
          </g>
        ))}
      </g>

      {/* Spieler – zuletzt, damit nichts die Nummern überdeckt;
          bei aktiver Animation laufen die Spieler ihre Wege selbst ab */}
      <g aria-hidden="true">
        {(d.players ?? []).map((p, i) => (
          <g key={`p${i}`}>
            <PlayerMarker p={p} />
            {plan && <MotionSegments segments={plan.playerAnims[i]} />}
          </g>
        ))}
      </g>

      {/* Unsichtbare Platzhalter halten die Zeitkette zusammen,
          wenn ein Pfeil kein bewegliches Symbol hat */}
      {plan?.dummies.map((s) => (
        <circle key={s.id} r="0.001" cx="-10" cy="-10" opacity="0" aria-hidden="true">
          <animateMotion id={s.id} dur={`${s.dur}s`} begin={s.begin} path="M 0 0 L 0.1 0" />
        </circle>
      ))}
    </svg>
  );
}
