/**
 * Materialliste als Icon-Chips (2026-07-18): bekannte Materialien
 * (Ball, Hütchen, Tor, Leibchen, Stange, Reifen, Markierung) werden als
 * Icon dargestellt, Menge und Zusatz („10", „pro Kind") bleiben lesbar.
 * Unbekanntes Material erscheint weiterhin als Text. Der vollständige
 * Wortlaut steckt im title-/aria-label-Attribut (Barrierefreiheit).
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const ICONS = {
  ball: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle {...stroke} cx="10" cy="10" r="7" />
      <path {...stroke} d="M10 7.4l2.5 1.8-1 2.9h-3l-1-2.9z" />
    </svg>
  ),
  cone: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path {...stroke} d="M10 3.5L14 15H6z" />
      <path {...stroke} d="M4 16.5h12" />
    </svg>
  ),
  goal: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path {...stroke} d="M3 16V5h14v11" />
      <path {...stroke} d="M6.5 5v11M10 5v11M13.5 5v11" opacity="0.6" />
    </svg>
  ),
  bib: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        {...stroke}
        d="M7 3.5l3 1.5 3-1.5 3.5 3-2 2.5-1-.8V17h-7V8.2l-1 .8-2-2.5z"
      />
    </svg>
  ),
  pole: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path {...stroke} d="M10 3v14M7 17h6" />
    </svg>
  ),
  hoop: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <ellipse {...stroke} cx="10" cy="10" rx="7" ry="4.5" />
    </svg>
  ),
  marker: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <ellipse {...stroke} cx="10" cy="12" rx="6" ry="2.5" />
      <ellipse {...stroke} cx="10" cy="10" rx="6" ry="2.5" opacity="0.6" />
    </svg>
  ),
};

/** Reihenfolge wichtig: speziellere Begriffe zuerst (Minitor vor Tor). */
const MATCHERS = [
  { icon: 'ball', re: /b[aä]ll/i },
  { icon: 'cone', re: /h[üu]tchen|pylon|kegel/i },
  { icon: 'goal', re: /tor(e|en)?\b|minitor|jugendtor|gro[ßs]tor/i },
  { icon: 'bib', re: /leibchen|trikot|hemd/i },
  { icon: 'pole', re: /stange|slalom/i },
  { icon: 'hoop', re: /reifen|ring/i },
  { icon: 'marker', re: /markierung|teller|linie|kreide|flachh/i },
];

/** Entfernt das erkannte Materialwort, Menge/Zusatz bleiben („10 Hütchen" → „10"). */
function shortLabel(item, re) {
  const rest = item
    .split(/\s+/)
    .filter((w) => !re.test(w))
    .join(' ')
    .trim();
  return rest;
}

export default function EquipmentList({ items = [] }) {
  const list = (items ?? []).filter((s) => String(s ?? '').trim());
  if (list.length === 0) return null;
  return (
    <ul className="svs-equipment" aria-label="Material">
      {list.map((item) => {
        const m = MATCHERS.find((d) => d.re.test(item));
        const rest = m ? shortLabel(item, m.re) : item;
        return (
          <li
            key={item}
            className="svs-equipment__chip"
            title={item}
            aria-label={item}
          >
            {m && (
              <span className="svs-equipment__icon" aria-hidden="true">
                {ICONS[m.icon]}
              </span>
            )}
            {rest && <span aria-hidden={m ? 'true' : undefined}>{rest}</span>}
          </li>
        );
      })}
    </ul>
  );
}
