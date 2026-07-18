import { validateDiagramData } from './diagramSchema.js';

/**
 * Schema-Validierung und Normalisierung der Google-Sheet-Tabellen.
 * Grundsatz: Eine einzelne fehlerhafte Zeile blockiert nie die App –
 * sie wird übersprungen und im Fehlerprotokoll vermerkt.
 * Verwendet werden ausschließlich Zeilen mit status = published.
 */

export const PHASES = [
  'warmup_1',
  'warmup_2',
  'game_form_1',
  'exercise',
  'game_form_2',
  'final_game',
];

export const AGE_GROUPS = ['G', 'F', 'E', 'D', 'C', 'B', 'A'];

/**
 * Die sechs erlaubten Trainingsschwerpunkte (Folge-Backlog 2026-07-17, §3).
 * Interne Werte – die UI-Labels kommen aus dem Lists-Tab.
 */
export const ALLOWED_FOCUS_AREAS = [
  'Dribbling',
  'Passspiel',
  'Ballan- und -mitnahme',
  '1 gegen 1',
  'Umschalten',
  'Freilaufen und Anbieten',
];

/** Normalisierung alter Schwerpunktwerte (auch für Cache-/Fallback-Daten). */
export const FOCUS_AREA_MAP = {
  'Ballgewöhnung': 'Dribbling',
  '1 gegen 1 offensiv': '1 gegen 1',
  '1 gegen 1 defensiv': '1 gegen 1',
  Fintieren: 'Dribbling',
  Torschuss: '1 gegen 1',
  'Überzahl/Unterzahl': 'Freilaufen und Anbieten',
  Spielaufbau: 'Passspiel',
  Pressing: 'Umschalten',
  Verteidigen: '1 gegen 1',
  Kombinationen: 'Passspiel',
  Kopfball: 'Ballan- und -mitnahme',
  Koordination: 'Dribbling',
  'Schnelligkeit mit Ball': 'Dribbling',
};

/** Mappt Schwerpunkte auf die 8 erlaubten Werte und entfernt doppelte Tags. */
export function normalizeFocusAreas(list) {
  const out = [];
  (list ?? []).forEach((raw) => {
    const mapped = FOCUS_AREA_MAP[raw] ?? raw;
    if (ALLOWED_FOCUS_AREAS.includes(mapped) && !out.includes(mapped)) out.push(mapped);
  });
  return out;
}

/**
 * Entfernt das sichtbare Wort „ENTWURF“ aus Titeln und Texten.
 * Interne Statuswerte (draft/review/published) bleiben unberührt.
 */
export function stripDraftLabel(text) {
  return String(text ?? '')
    .replace(/entwurf:\s*/gi, '')
    .replace(/\s*\(entwurf[^)]*\)/gi, '')
    .replace(/entwurf\s*[–-]\s*/gi, '')
    .replace(/entwurf/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Kanonische Spaltenreihenfolge je Tab (Datenmodell, Anleitung §8).
 * Wird verwendet, weil die gviz-Query-Engine Spaltenköpfe teils durch
 * Zellwerte ersetzt (beobachtet: „status“ → „published“). Stimmt die
 * Spaltenzahl der Antwort mit der kanonischen Liste überein, gelten
 * diese Namen – die Spaltenreihenfolge im Sheet darf daher nicht
 * geändert werden.
 */
export const TAB_HEADERS = {
  Exercises: [
    'id', 'status', 'title', 'ageGroups', 'focusAreas', 'phase',
    'minPlayers', 'maxPlayers', 'preferredPlayers', 'groupSize',
    'parallelFieldsPossible', 'playersPerField', 'goalkeepersRequired',
    'oddPlayerSolution', 'restPlayersAllowed', 'maxWaitingPlayers',
    'durationMin', 'durationMax', 'intensity', 'complexity',
    'fieldTemplate', 'fieldLength', 'fieldWidth', 'goals', 'equipment',
    'objective', 'setup', 'procedure', 'rules', 'coachingPoints',
    'coachingCommands', 'commonMistakes', 'corrections', 'regression',
    'progression', 'transitionHints', 'dfbPrinciples', 'sourceTitle',
    'sourceUrl', 'adaptationNote', 'videoUrl', 'videoPlatform',
    'videoTitle', 'videoChannel', 'videoLanguage', 'videoVerified',
    'videoLastChecked', 'diagramId', 'updatedAt',
  ],
  Diagrams: [
    'diagramId', 'exerciseId', 'status', 'fieldTemplate', 'attackDirection',
    'diagramData', 'diagramCaption', 'diagramAltText', 'diagramVersion', 'updatedAt',
  ],
  Lists: ['listName', 'value', 'label', 'sortOrder'],
  Settings: ['key', 'value'],
};

/** Trennt Sheet-Listenfelder ("F;E" → ['F','E']). */
export function splitList(value) {
  return String(value ?? '')
    .split(';')
    .map((v) => v.trim())
    .filter(Boolean);
}

function toInt(value) {
  const n = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Validiert und normalisiert eine Exercises-Zeile.
 * @returns {{valid: boolean, errors: string[], exercise: object|null}}
 */
export function validateExerciseRow(row) {
  const errors = [];
  const id = String(row?.id ?? '').trim();
  if (!id) errors.push('id fehlt');
  if (!String(row?.title ?? '').trim()) errors.push('title fehlt');
  if (!PHASES.includes(row?.phase)) errors.push(`phase ungültig (${row?.phase})`);

  const ageGroups = splitList(row?.ageGroups);
  if (ageGroups.length === 0 || ageGroups.some((a) => !AGE_GROUPS.includes(a))) {
    errors.push(`ageGroups ungültig (${row?.ageGroups})`);
  }
  const focusAreas = normalizeFocusAreas(splitList(row?.focusAreas));
  if (focusAreas.length === 0) errors.push('focusAreas fehlt oder nur unbekannte Werte');

  const minPlayers = toInt(row?.minPlayers);
  const maxPlayers = toInt(row?.maxPlayers);
  if (minPlayers === null || minPlayers < 1) errors.push('minPlayers ungültig');
  if (maxPlayers === null || maxPlayers < 1) errors.push('maxPlayers ungültig');
  if (minPlayers !== null && maxPlayers !== null && maxPlayers < minPlayers) {
    errors.push('maxPlayers < minPlayers');
  }

  const durationMin = toInt(row?.durationMin);
  const durationMax = toInt(row?.durationMax);
  if (durationMin === null || durationMin < 1) errors.push('durationMin ungültig');
  if (durationMax === null || durationMax < durationMin) errors.push('durationMax ungültig');

  if (!String(row?.diagramId ?? '').trim()) errors.push('diagramId fehlt');

  if (errors.length > 0) {
    return { valid: false, errors: errors.map((e) => `Exercises ${id || '(ohne id)'}: ${e}`), exercise: null };
  }

  return {
    valid: true,
    errors: [],
    exercise: {
      ...row,
      id,
      title: stripDraftLabel(row?.title),
      sourceTitle: stripDraftLabel(row?.sourceTitle),
      adaptationNote: stripDraftLabel(row?.adaptationNote),
      ageGroups,
      focusAreas,
      equipment: splitList(row?.equipment),
      dfbPrinciples: splitList(row?.dfbPrinciples),
      minPlayers,
      maxPlayers,
      preferredPlayers: toInt(row?.preferredPlayers),
      playersPerField: toInt(row?.playersPerField),
      goalkeepersRequired: toInt(row?.goalkeepersRequired) ?? 0,
      maxWaitingPlayers: toInt(row?.maxWaitingPlayers) ?? 0,
      durationMin,
      durationMax,
      fieldLength: toInt(row?.fieldLength),
      fieldWidth: toInt(row?.fieldWidth),
      parallelFieldsPossible: String(row?.parallelFieldsPossible ?? '').toLowerCase() === 'yes',
      restPlayersAllowed: String(row?.restPlayersAllowed ?? '').toLowerCase() === 'yes',
      videoVerified: String(row?.videoVerified ?? '').toLowerCase() === 'yes',
    },
  };
}

/**
 * Validiert eine Diagrams-Zeile inkl. diagramData-JSON.
 * @returns {{valid: boolean, errors: string[], diagram: object|null}}
 */
export function validateDiagramRow(row) {
  const errors = [];
  const diagramId = String(row?.diagramId ?? '').trim();
  if (!diagramId) errors.push('diagramId fehlt');
  if (!String(row?.exerciseId ?? '').trim()) errors.push('exerciseId fehlt');

  const check = validateDiagramData(row?.diagramData);
  if (!check.valid) errors.push(...check.errors);

  if (errors.length > 0) {
    return { valid: false, errors: errors.map((e) => `Diagrams ${diagramId || '(ohne id)'}: ${e}`), diagram: null };
  }
  return {
    valid: true,
    errors: [],
    diagram: {
      ...row,
      diagramId,
      diagramCaption: stripDraftLabel(row?.diagramCaption),
      diagramAltText: stripDraftLabel(row?.diagramAltText),
      data: check.data,
    },
  };
}

/** Lists-Zeilen → gruppiertes Objekt { listName: [{value,label,sortOrder}] }. */
export function buildLists(rows) {
  const lists = {};
  const errors = [];
  (rows ?? []).forEach((row, i) => {
    const name = String(row?.listName ?? '').trim();
    const value = String(row?.value ?? '').trim();
    if (!name || !value) {
      errors.push(`Lists Zeile ${i + 2}: listName/value fehlt`);
      return;
    }
    (lists[name] ??= []).push({
      value,
      label: String(row?.label ?? value).trim() || value,
      sortOrder: toInt(row?.sortOrder) ?? 0,
    });
  });
  Object.values(lists).forEach((l) => l.sort((a, b) => a.sortOrder - b.sortOrder));

  // Nur die acht erlaubten Schwerpunkte anbieten (auch bei alten Cache-Daten):
  // alte Werte werden gemappt, Duplikate entfernt, Reihenfolge bleibt stabil.
  if (lists.focusAreas) {
    const seen = new Set();
    lists.focusAreas = lists.focusAreas
      .map((f) => ({ ...f, value: FOCUS_AREA_MAP[f.value] ?? f.value }))
      .filter((f) => {
        if (!ALLOWED_FOCUS_AREAS.includes(f.value) || seen.has(f.value)) return false;
        seen.add(f.value);
        return true;
      });
  }
  return { lists, errors };
}

/** Settings-Zeilen → Objekt { key: value }. Robust gegen gviz-Artefakte. */
export function buildSettings(rows) {
  const settings = {};
  (rows ?? []).forEach((row) => {
    const key = String(row?.key ?? '').trim();
    if (key) settings[key] = String(row?.value ?? '').trim();
  });
  return settings;
}

/**
 * Baut aus den vier Roh-Tabellen die App-Datenbank.
 * Nur published-Übungen mit gültigem published-Diagramm werden übernommen.
 * @returns {{settings, lists, exercises, errors, counts}}
 */
export function assembleDatabase({ settings = [], lists = [], exercises = [], diagrams = [] }) {
  const errors = [];

  const settingsObj = buildSettings(settings);
  const { lists: listsObj, errors: listErrors } = buildLists(lists);
  errors.push(...listErrors);

  // Diagramme indexieren (nur published + valide)
  const diagramById = new Map();
  diagrams.forEach((row) => {
    if (String(row?.status ?? '').trim() !== 'published') return;
    const { valid, errors: dErrors, diagram } = validateDiagramRow(row);
    if (!valid) {
      errors.push(...dErrors);
      return;
    }
    diagramById.set(diagram.diagramId, diagram);
  });

  const published = [];
  const seenIds = new Set();
  exercises.forEach((row) => {
    if (String(row?.status ?? '').trim() !== 'published') return;
    const { valid, errors: eErrors, exercise } = validateExerciseRow(row);
    if (!valid) {
      errors.push(...eErrors);
      return;
    }
    if (seenIds.has(exercise.id)) {
      errors.push(`Exercises ${exercise.id}: doppelte id – Zeile übersprungen`);
      return;
    }
    const diagram = diagramById.get(exercise.diagramId);
    if (!diagram) {
      errors.push(`Exercises ${exercise.id}: kein gültiges published-Diagramm (${exercise.diagramId})`);
      return;
    }
    seenIds.add(exercise.id);
    published.push({ ...exercise, diagram });
  });

  return {
    settings: settingsObj,
    lists: listsObj,
    exercises: published,
    errors,
    counts: {
      exercisesPublished: published.length,
      exercisesTotal: exercises.length,
      diagramsPublished: diagramById.size,
      errors: errors.length,
    },
  };
}
