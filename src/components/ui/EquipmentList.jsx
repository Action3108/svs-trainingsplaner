/**
 * Materialliste als Icon-Chips (2026-07-18): bekannte Materialien
 * (Ball, Hütchen, Tor, Leibchen, Stange, Reifen, Markierung) werden als
 * Icon dargestellt, Menge und Zusatz („10", „pro Kind") bleiben lesbar.
 * Unbekanntes Material erscheint weiterhin als Text. Der vollständige
 * Wortlaut steckt im title-/aria-label-Attribut (Barrierefreiheit).
 */

/**
 * Detailreiche, farbige Icons (2026-07-18): Ball schwarz-weiß,
 * Hütchen/Leibchen/Stange in den funktionalen Orangetönen des CI
 * (#F97316 Hütchen, #F59E0B Ball-Akzent). Feste Farben, damit die
 * Chips auch im Druck und in Graustufen erkennbar bleiben.
 */
const C = {
  black: '#111111',
  white: '#FFFFFF',
  orange: '#F97316',
  orangeDark: '#C2410C',
  amber: '#F59E0B',
  net: '#9CA3AF',
};

const ICONS = {
  // Klassischer Fußball: weiß mit schwarzem Fünfeck und Nähten
  ball: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="7.4" fill={C.white} stroke={C.black} strokeWidth="1.2" />
      <path d="M10 6.9l2.9 2.1-1.1 3.4H8.2L7.1 9z" fill={C.black} />
      <path
        d="M10 6.9V3.7M12.9 9l2.95-1.3M11.8 12.4l1.85 2.55M8.2 12.4l-1.85 2.55M7.1 9L4.15 7.7"
        stroke={C.black}
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
  // Oranges Hütchen mit weißem Streifen und Fußplatte
  cone: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M10 2.8L14.1 14.6H5.9z" fill={C.orange} stroke={C.orangeDark} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M7.8 8.3h4.4l.85 2.5H6.95z" fill={C.white} />
      <rect x="3.8" y="14.6" width="12.4" height="2.4" rx="1.2" fill={C.orange} stroke={C.orangeDark} strokeWidth="0.8" />
    </svg>
  ),
  // Tor mit Netz
  goal: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M6 5.2v10.6M8.7 5.2v10.6M11.3 5.2v10.6M14 5.2v10.6M3.6 8.5h12.8M3.6 11.5h12.8" stroke={C.net} strokeWidth="0.6" fill="none" />
      <path d="M3.5 16.2V4.8h13v11.4" stroke={C.black} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M2.2 16.2h15.6" stroke={C.black} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  ),
  // Oranges Leibchen
  bib: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M7 3.4l3 1.4 3-1.4 3.4 2.9-1.9 2.4-1-.8v8.6H6.5V7.9l-1 .8-1.9-2.4z"
        fill={C.orange}
        stroke={C.orangeDark}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path d="M8.3 4l1.7.8L11.7 4" stroke={C.white} strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </svg>
  ),
  // Slalomstange orange-weiß gestreift mit Spitze
  pole: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="8.9" y="3" width="2.2" height="14" rx="1" fill={C.orange} />
      <rect x="8.9" y="6.2" width="2.2" height="2.8" fill={C.white} />
      <rect x="8.9" y="11.8" width="2.2" height="2.8" fill={C.white} />
      <rect x="8.9" y="3" width="2.2" height="14" rx="1" fill="none" stroke={C.orangeDark} strokeWidth="0.7" />
      <path d="M6.6 17h6.8" stroke={C.orangeDark} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  ),
  // Reifen
  hoop: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <ellipse cx="10" cy="10.5" rx="7" ry="4.6" fill="none" stroke={C.amber} strokeWidth="2.2" />
      <ellipse cx="10" cy="10.5" rx="7" ry="4.6" fill="none" stroke={C.orangeDark} strokeWidth="0.5" opacity="0.5" />
    </svg>
  ),
  // Flache Markierungsscheibe (Teller) mit Griffloch
  marker: (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <ellipse cx="10" cy="12.3" rx="6.6" ry="2.7" fill={C.orange} stroke={C.orangeDark} strokeWidth="0.8" />
      <ellipse cx="10" cy="11.5" rx="3" ry="1.15" fill={C.white} />
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

/**
 * Ranghöhe einer Materialangabe für die Zusammenfassung:
 * „pro Kind/Spieler" bzw. „jeder" > „viele" > größte Zahl > ohne Zahl.
 */
function amountRank(item) {
  if (/pro\s+(kind|spieler)|jede[rms]?\b|je\s+(kind|spieler)/i.test(item)) {
    return Number.POSITIVE_INFINITY;
  }
  if (/viele/i.test(item)) return 1e6;
  const m = String(item).match(/\d+/);
  return m ? Number(m[0]) : 0;
}

/**
 * Merge-Schlüssel: gleiche Icon-Kategorie = gleiches Material.
 * Ausnahme Tore: Minitore und Jugend-/Großtore werden getrennt gezählt,
 * weil beide gleichzeitig gebraucht werden können.
 */
function mergeKey(item) {
  const m = MATCHERS.find((d) => d.re.test(item));
  if (!m) return `text:${String(item).toLowerCase()}`;
  if (m.icon === 'goal') return /minitor/i.test(item) ? 'goal:mini' : 'goal:gross';
  return m.icon;
}

/**
 * Fasst gleiche Materialien zusammen und behält je Gruppe nur die höchste
 * Anforderung – z. B. „4 Bälle" + „1 Ball pro Kind" → „1 Ball pro Kind".
 */
export function mergeEquipment(items = []) {
  const groups = new Map();
  for (const item of items ?? []) {
    if (!String(item ?? '').trim()) continue;
    const key = mergeKey(item);
    const prev = groups.get(key);
    if (prev === undefined || amountRank(item) > amountRank(prev)) {
      groups.set(key, item);
    }
  }
  return [...groups.values()];
}

export default function EquipmentList({ items = [], merge = false }) {
  const source = merge ? mergeEquipment(items) : items ?? [];
  const list = source.filter((s) => String(s ?? '').trim());
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
