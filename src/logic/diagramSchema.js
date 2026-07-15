/**
 * Schema-Validierung für Übungsdiagramme (diagramData-JSON aus dem Google Sheet).
 * Koordinatensystem: 0–100 auf beiden Achsen, Angriffsrichtung links → rechts.
 */

export const TEAM_TYPES = ['black', 'white', 'neutral', 'gk', 'coach'];
export const ARROW_TYPES = ['pass', 'run', 'dribble', 'shot', 'rotation'];
export const GOAL_TYPES = ['mini', 'youth', 'cone'];

function isCoord(v) {
  return typeof v === 'number' && v >= 0 && v <= 100;
}

function checkPoint(p, path, errors) {
  if (!p || typeof p !== 'object') {
    errors.push(`${path}: Punkt fehlt`);
    return;
  }
  if (!isCoord(p.x)) errors.push(`${path}.x: ungültig (${p?.x})`);
  if (!isCoord(p.y)) errors.push(`${path}.y: ungültig (${p?.y})`);
}

/**
 * Validiert ein Diagramm-Datenobjekt.
 * @param {object|string} data - geparstes Objekt oder JSON-String
 * @returns {{valid: boolean, errors: string[], data: object|null}}
 */
export function validateDiagramData(data) {
  const errors = [];
  let obj = data;

  if (typeof data === 'string') {
    try {
      obj = JSON.parse(data);
    } catch {
      return { valid: false, errors: ['diagramData ist kein gültiges JSON'], data: null };
    }
  }
  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['diagramData fehlt oder ist kein Objekt'], data: null };
  }

  (obj.players ?? []).forEach((p, i) => {
    checkPoint(p, `players[${i}]`, errors);
    if (!TEAM_TYPES.includes(p?.team)) {
      errors.push(`players[${i}].team: unbekannt (${p?.team})`);
    }
  });

  (obj.balls ?? []).forEach((b, i) => checkPoint(b, `balls[${i}]`, errors));
  (obj.cones ?? []).forEach((c, i) => checkPoint(c, `cones[${i}]`, errors));

  (obj.goals ?? []).forEach((g, i) => {
    checkPoint(g, `goals[${i}]`, errors);
    if (!GOAL_TYPES.includes(g?.type)) {
      errors.push(`goals[${i}].type: unbekannt (${g?.type})`);
    }
  });

  (obj.zones ?? []).forEach((z, i) => {
    checkPoint(z, `zones[${i}]`, errors);
    if (!(typeof z?.w === 'number' && z.w > 0 && z.x + z.w <= 100.5)) {
      errors.push(`zones[${i}].w: ungültig`);
    }
    if (!(typeof z?.h === 'number' && z.h > 0 && z.y + z.h <= 100.5)) {
      errors.push(`zones[${i}].h: ungültig`);
    }
  });

  (obj.arrows ?? []).forEach((a, i) => {
    if (!ARROW_TYPES.includes(a?.type)) {
      errors.push(`arrows[${i}].type: unbekannt (${a?.type})`);
    }
    checkPoint(a?.from, `arrows[${i}].from`, errors);
    checkPoint(a?.to, `arrows[${i}].to`, errors);
  });

  (obj.lines ?? []).forEach((l, i) => {
    checkPoint(l?.from, `lines[${i}].from`, errors);
    checkPoint(l?.to, `lines[${i}].to`, errors);
  });

  return { valid: errors.length === 0, errors, data: obj };
}
