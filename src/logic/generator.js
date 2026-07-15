import { PHASES } from './sheetSchema.js';

/**
 * Trainingsgenerator: erzeugt aus der Übungsdatenbank eine vollständige
 * Einheit mit genau sechs Phasen in fester Reihenfolge.
 *
 * Vorgehen:
 * 1. Harte Ausschlussregeln je Übung (Phase, Alter, Spielerzahl,
 *    ungerade Spielerzahl ohne Lösung, Zeitfenster).
 * 2. Bewertung je Übung nach der vereinbarten Matrix.
 * 3. Kombinationssuche über alle sechs Phasen: bewertet wird die GESAMTE
 *    Einheit inkl. Feldkompatibilität – Umbauten werden minimiert.
 * 4. Zeitverteilung innerhalb der Gesamtdauer (min/max je Übung).
 *
 * Es wird nichts erfunden: Ist keine vollständige Kombination möglich,
 * kommt eine klare Fehlermeldung mit den fehlenden Phasen zurück.
 */

export const PHASE_ORDER = PHASES;

export const PHASE_LABELS = {
  warmup_1: 'Aufwärmen 1',
  warmup_2: 'Aufwärmen 2',
  game_form_1: 'Spielform 1',
  exercise: 'Übungsform',
  game_form_2: 'Spielform 2',
  final_game: 'Abschlussspiel',
};

/** Bewertungsmatrix (Summe 100 %). Feldkompatibilität wirkt auf Kombinationsebene. */
export const WEIGHTS = {
  age: 0.2,
  focus: 0.2,
  players: 0.2,
  phase: 0.15,
  field: 0.15,
  duration: 0.05,
  material: 0.05,
};

const CANDIDATES_PER_PHASE = 6;
const MAX_VARIANTS = 5;

/** Feld-Schlüssel für Umbauvergleich (fieldTemplate, sonst Maße). */
export function fieldKey(e) {
  return e.fieldTemplate || `${e.fieldLength ?? '?'}x${e.fieldWidth ?? '?'}`;
}

/** Passt die Spielerzahl? Liefert auch die nötige Felderzahl. */
export function playerFit(e, players) {
  if (players >= e.minPlayers && players <= e.maxPlayers) {
    return { ok: true, fields: 1 };
  }
  if (e.parallelFieldsPossible && (e.playersPerField ?? 0) > 0 && players > e.maxPlayers) {
    const fields = Math.ceil(players / e.playersPerField);
    if (players / fields >= e.minPlayers) return { ok: true, fields };
  }
  return { ok: false, fields: 0 };
}

/** Harte Ausschlussregeln. Liefert null (ok) oder den Ausschlussgrund. */
export function hardExclusion(e, { ageGroup, players }) {
  if (!e.ageGroups?.includes(ageGroup)) return 'Altersgruppe unpassend';
  const fit = playerFit(e, players);
  if (!fit.ok) return 'Spielerzahl außerhalb der Grenzen';
  if (
    players % 2 === 1 &&
    !String(e.oddPlayerSolution ?? '').trim() &&
    !e.restPlayersAllowed
  ) {
    return 'keine Lösung für ungerade Spielerzahl';
  }
  return null;
}

/** Einzelbewertung (ohne Feldkompatibilität, die zählt je Kombination). */
export function scoreExercise(e, { ageGroup, focus, players }) {
  // Alter: enthalten (hart geprüft); spezifischere Übungen leicht bevorzugen
  const age = e.ageGroups.length <= 3 ? 1 : 0.8;

  // Schwerpunkt: Hauptschwerpunkt = 1, enthalten = 0.85, sonst 0
  const focusIdx = e.focusAreas.indexOf(focus);
  const focusScore = focusIdx === 0 ? 1 : focusIdx > 0 ? 0.85 : 0;

  // Spielerzahl: Nähe zur bevorzugten Zahl bzw. zur Bereichsmitte
  const ref = e.preferredPlayers ?? Math.round((e.minPlayers + e.maxPlayers) / 2);
  const span = Math.max(e.maxPlayers - e.minPlayers, 1);
  const playersScore = Math.max(0.3, 1 - Math.abs(players - ref) / span);

  // Dauer: großzügiges Zeitfenster ist flexibler
  const durationScore = e.durationMax - e.durationMin >= 4 ? 1 : 0.8;

  // Material: wenig Material = schneller Aufbau
  const items = e.equipment?.length ?? 0;
  const material = items <= 3 ? 1 : items <= 5 ? 0.8 : 0.6;

  return (
    WEIGHTS.age * age +
    WEIGHTS.focus * focusScore +
    WEIGHTS.players * playersScore +
    WEIGHTS.phase * 1 +
    WEIGHTS.duration * durationScore +
    WEIGHTS.material * material
  );
}

/**
 * Verteilt die Gesamtdauer auf die sechs Übungen (innerhalb min/max).
 * Liefert null, wenn die Gesamtdauer nicht erreichbar ist.
 */
export function allocateTime(exercises, totalDuration) {
  const mins = exercises.map((e) => e.durationMin);
  const maxs = exercises.map((e) => e.durationMax);
  const minSum = mins.reduce((a, b) => a + b, 0);
  const maxSum = maxs.reduce((a, b) => a + b, 0);
  if (minSum > totalDuration || maxSum < totalDuration) return null;

  const alloc = [...mins];
  let rest = totalDuration - minSum;
  while (rest > 0) {
    let grew = false;
    for (let i = 0; i < alloc.length && rest > 0; i++) {
      if (alloc[i] < maxs[i]) {
        alloc[i] += 1;
        rest -= 1;
        grew = true;
      }
    }
    if (!grew) break;
  }
  return rest === 0 ? alloc : null;
}

/** Mannschafts- und Feldorganisation für eine Übung (nur Arithmetik). */
export function organize(e, players) {
  const { fields } = playerFit(e, players);
  const perFieldBase = Math.floor(players / fields);
  const extra = players % fields;
  const perField = Array.from({ length: fields }, (_, i) =>
    i < extra ? perFieldBase + 1 : perFieldBase
  );
  const gk = e.goalkeepersRequired ?? 0;
  const outfield = perField[0] - gk;
  const teamSize = Math.floor(outfield / 2);
  const oddRest = outfield - teamSize * 2;
  return {
    fields,
    playersPerField: perField,
    goalkeepers: gk,
    teamsPerField: `${teamSize} gegen ${teamSize}${oddRest ? ' + 1' : ''}`,
    oddPlayerHint: oddRest ? e.oddPlayerSolution || null : null,
  };
}

/** Kandidaten je Phase: hart filtern, bewerten, sortieren. */
function candidatesPerPhase(exercises, inputs) {
  const byPhase = {};
  const reasons = {};
  PHASE_ORDER.forEach((phase) => {
    const inPhase = exercises.filter((e) => e.phase === phase);
    const list = [];
    inPhase.forEach((e) => {
      const reason = hardExclusion(e, inputs);
      if (reason) {
        (reasons[phase] ??= []).push(`${e.id}: ${reason}`);
        return;
      }
      list.push({ exercise: e, score: scoreExercise(e, inputs) });
    });
    list.sort((a, b) => b.score - a.score);
    byPhase[phase] = list.slice(0, CANDIDATES_PER_PHASE);
  });
  return { byPhase, reasons };
}

/** Zählt wesentliche Umbauten (Wechsel des Feld-Schlüssels) einer Kombination. */
export function countRebuilds(exercises) {
  let rebuilds = 0;
  const changes = [];
  for (let i = 1; i < exercises.length; i++) {
    if (fieldKey(exercises[i]) !== fieldKey(exercises[i - 1])) {
      rebuilds += 1;
      changes.push({
        afterPhase: exercises[i - 1].phase,
        beforePhase: exercises[i].phase,
        from: fieldKey(exercises[i - 1]),
        to: fieldKey(exercises[i]),
      });
    }
  }
  return { rebuilds, changes };
}

/**
 * Erzeugt eine vollständige Trainingseinheit.
 * @param {object} db - Datenbank aus loadDatabase() (db.exercises inkl. Diagramm)
 * @param {object} inputs - { ageGroup, duration, focus, players, variant? }
 */
export function generateTraining(db, { ageGroup, duration, focus, players, variant = 0 }) {
  const exercises = db?.exercises ?? [];
  const inputs = { ageGroup, focus, players };
  const { byPhase, reasons } = candidatesPerPhase(exercises, inputs);

  const missing = PHASE_ORDER.filter((p) => (byPhase[p] ?? []).length === 0);
  if (missing.length > 0) {
    return {
      ok: false,
      reason: 'Für folgende Phasen wurde keine passende Übung gefunden',
      missingPhases: missing.map((p) => PHASE_LABELS[p]),
      details: missing.flatMap((p) => reasons[p] ?? []),
    };
  }

  // Kombinationssuche: Gesamtscore = Summe Einzelscores + Feldkompatibilität.
  const maxSetupChanges = Number(db?.settings?.maxSetupChanges ?? 1);
  const combos = [];
  const walk = (phaseIdx, chosen, baseScore) => {
    if (phaseIdx === PHASE_ORDER.length) {
      const list = chosen.map((c) => c.exercise);
      const times = allocateTime(list, duration);
      if (!times) return; // Zeitbudget nicht erfüllbar → harte Regel
      const { rebuilds, changes } = countRebuilds(list);
      // Feldkompatibilität: 5 Übergänge, jeder ohne Umbau zählt voll
      const fieldScore = WEIGHTS.field * ((list.length - 1 - rebuilds) / (list.length - 1));
      const penalty = rebuilds > maxSetupChanges ? (rebuilds - maxSetupChanges) * 0.2 : 0;
      combos.push({
        exercises: list,
        times,
        rebuilds,
        changes,
        score: baseScore / list.length + fieldScore - penalty,
      });
      return;
    }
    for (const c of byPhase[PHASE_ORDER[phaseIdx]]) {
      walk(phaseIdx + 1, [...chosen, c], baseScore + c.score);
    }
  };
  walk(0, [], 0);

  if (combos.length === 0) {
    return {
      ok: false,
      reason:
        'Keine Kombination erfüllt die gewählte Gesamtdauer – bitte Dauer oder Schwerpunkt anpassen',
      missingPhases: [],
      details: [],
    };
  }

  combos.sort((a, b) => b.score - a.score);
  const top = combos.slice(0, MAX_VARIANTS);
  const pick = top[Math.min(variant, top.length - 1)];

  return {
    ok: true,
    variant: Math.min(variant, top.length - 1),
    variantsAvailable: top.length,
    totalDuration: duration,
    rebuilds: pick.rebuilds,
    rebuildChanges: pick.changes,
    equipment: [...new Set(pick.exercises.flatMap((e) => e.equipment ?? []))],
    phases: pick.exercises.map((e, i) => ({
      phase: e.phase,
      label: PHASE_LABELS[e.phase],
      duration: pick.times[i],
      exercise: e,
      organization: organize(e, players),
    })),
  };
}
