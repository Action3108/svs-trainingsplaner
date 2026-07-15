import { VB_W, VB_H } from './scale.js';

/**
 * Spielfeldkarte: helle grüne Fläche mit Rasenstreifen, weichen Linien
 * und abgerundeten Ecken. Rein dekorativ (aria-hidden im Diagram).
 */
export default function Field() {
  const stripes = [1, 3]; // alternierende Streifen (5 Bahnen)
  const stripeW = VB_W / 5;
  return (
    <g>
      <rect x="0" y="0" width={VB_W} height={VB_H} rx="4" fill="var(--dgm-field, #eaf6ec)" />
      <clipPath id="dgm-field-clip">
        <rect x="0" y="0" width={VB_W} height={VB_H} rx="4" />
      </clipPath>
      <g clipPath="url(#dgm-field-clip)">
        {stripes.map((i) => (
          <rect
            key={i}
            x={i * stripeW}
            y="0"
            width={stripeW}
            height={VB_H}
            fill="var(--dgm-field-alt, #ddf0e1)"
          />
        ))}
        {/* Quer-Mahd: dezentes Schachbrett für mehr Lebendigkeit */}
        {[1, 3].map((i) => (
          <rect
            key={`q${i}`}
            x="0"
            y={(VB_H / 5) * i}
            width={VB_W}
            height={VB_H / 5}
            fill="var(--dgm-field-alt, #ddf0e1)"
            opacity="0.45"
          />
        ))}
        {/* feine Rasenstruktur */}
        <pattern id="dgm-grass" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
          <line x1="0" y1="0" x2="0" y2="1.1" stroke="#c5e0cb" strokeWidth="0.22" strokeLinecap="round" />
        </pattern>
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#dgm-grass)" opacity="0.5" />
        {/* sanfte Lichtkante */}
        <radialGradient id="dgm-light" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#dgm-light)" />
        {/* Mittellinie und Mittelkreis – dezent, dekorativ */}
        <line x1={VB_W / 2} y1="0" x2={VB_W / 2} y2={VB_H} stroke="var(--dgm-field-line, #a7c9af)" strokeWidth="0.35" />
        <circle cx={VB_W / 2} cy={VB_H / 2} r="7" fill="none" stroke="var(--dgm-field-line, #a7c9af)" strokeWidth="0.35" />
      </g>
      <rect
        x="0.4" y="0.4"
        width={VB_W - 0.8} height={VB_H - 0.8}
        rx="3.6"
        fill="none"
        stroke="var(--dgm-field-line, #a7c9af)"
        strokeWidth="0.6"
      />
    </g>
  );
}
