import {
  scoreExercise,
  hardExclusion,
  organize,
  countRebuilds,
  fieldKey,
} from './generator.js';

/**
 * Übungsaustausch (Anleitung §14).
 *
 * findAlternatives: filtert Alternativen hart (gleiche Phase, Jugend,
 * Spielerzahl, Zeitfenster der aktuellen Position, keine Duplikate,
 * Hauptschwerpunkt bleibt abgedeckt) und sortiert nach Passung –
 * gleicher Feldaufbau wie die Nachbarphasen zählt als Bonus.
 *
 * applyExchange: ersetzt die Übung einer Phase und aktualisiert alle
 * abhängigen Angaben (Organisation, Material, Umbauampel). Die
 * Zeitverteilung bleibt erhalten (Alternative muss ins Fenster passen).
 */

export function findAlternatives(db, plan, phaseIndex, inputs, limit = 5) {
  if (!plan?.ok) return [];
  const slot = plan.phases[phaseIndex];
  if (!slot) return [];
  const usedIds = new Set(plan.phases.map((p) => p.exercise.id));
  const currentCoversFocus = slot.exercise.focusAreas.includes(inputs.focus);
  const neighborFields = [plan.phases[phaseIndex - 1], plan.phases[phaseIndex + 1]]
    .filter(Boolean)
    .map((p) => fieldKey(p.exercise));

  const candidates = [];
  (db?.exercises ?? []).forEach((e) => {
    if (e.phase !== slot.phase) return; // gleiche Trainingsphase
    if (usedIds.has(e.id)) return; // keine Übung doppelt in der Einheit
    if (hardExclusion(e, inputs)) return; // Jugend, Spielerzahl, ungerade Zahl
    // Hauptschwerpunkt muss abgedeckt bleiben, wenn die aktuelle Übung ihn abdeckt
    if (currentCoversFocus && !e.focusAreas.includes(inputs.focus)) return;
    // Zeitfenster: Alternative muss die eingeplante Dauer tragen können
    if (slot.duration < e.durationMin || slot.duration > e.durationMax) return;

    const sameField = neighborFields.includes(fieldKey(e));
    candidates.push({
      exercise: e,
      sameField,
      score: scoreExercise(e, inputs) + (sameField ? 0.15 : 0),
    });
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit);
}

export function applyExchange(plan, phaseIndex, newExercise, players) {
  const phases = plan.phases.map((p, i) =>
    i === phaseIndex
      ? { ...p, exercise: newExercise, organization: organize(newExercise, players) }
      : p
  );
  const list = phases.map((p) => p.exercise);
  const { rebuilds, changes } = countRebuilds(list);
  return {
    ...plan,
    phases,
    rebuilds,
    rebuildChanges: changes,
    equipment: [...new Set(list.flatMap((e) => e.equipment ?? []))],
  };
}
