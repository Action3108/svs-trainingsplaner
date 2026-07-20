import { PHASES, effectiveAge } from './sheetSchema.js';

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

/**
 * Trainingsstrukturen (Backlog §6):
 * - standard: sechs Phasen für ältere Jahrgänge und längere Einheiten.
 * - kurz_a/kurz_b: verkürzte Drei-Phasen-Strukturen, erlaubt wenn
 *   Altersklasse G oder F ODER Trainingsdauer 60 Minuten.
 * Die Zeitverteilung der Kurzstrukturen folgt 15+20+25 bei 60 Minuten
 * (Verhältnis 25 % / 33 % / 42 %), bei anderen Dauern proportional.
 */
export const STRUCTURES = {
  standard: {
    id: 'standard',
    label: 'Standardstruktur (6 Phasen)',
    phases: PHASE_ORDER,
    phaseLabels: PHASE_LABELS,
    ratios: null,
  },
  kurz_a: {
    id: 'kurz_a',
    label: 'Kurzstruktur A: Aufwärmen – Übung – Spielform',
    phases: ['warmup_1', 'exercise', 'game_form_1'],
    phaseLabels: { warmup_1: 'Aufwärmen', exercise: 'Übung', game_form_1: 'Spielform' },
    ratios: [0.25, 1 / 3, 5 / 12],
  },
  kurz_b: {
    id: 'kurz_b',
    label: 'Kurzstruktur B: Aufwärmen – Spielform – Spielform',
    phases: ['warmup_1', 'game_form_1', 'game_form_2'],
    phaseLabels: { warmup_1: 'Aufwärmen', game_form_1: 'Spielform 1', game_form_2: 'Spielform 2' },
    ratios: [0.25, 1 / 3, 5 / 12],
  },
};

/** Erlaubte Strukturen für die Eingaben (Kurzstrukturen nur G/F oder 60 min). */
export function allowedStructures({ ageGroup, duration }) {
  const short = ageGroup === 'G' || ageGroup === 'F' || Number(duration) === 60;
  return short
    ? [STRUCTURES.standard, STRUCTURES.kurz_a, STRUCTURES.kurz_b]
    : [STRUCTURES.standard];
}

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

/** Feld-Schlüssel für den exakten Vergleich (Vorlage + Maße). */
export function fieldKey(e) {
  return `${e.fieldTemplate ?? '?'}|${e.fieldLength ?? '?'}x${e.fieldWidth ?? '?'}`;
}

/**
 * Feldgrößenklassen (Feldkompatibilität, 2026-07-17):
 * Ein WESENTLICHER Umbau liegt nur vor, wenn das Feld neu abgesteckt werden
 * muss – also beim Wechsel der Größenklasse. Vorlagen-/Maßwechsel innerhalb
 * derselben Klasse (Minitore dazustellen, Hütchen versetzen, Gasse markieren)
 * zählen als KLEINE ANPASSUNG.
 */
export const SIZE_CLASS_LABELS = {
  S: 'Aufwärmfeld (bis 20 m)',
  M: 'Kleinfeld (21–32 m)',
  L: 'Mittelfeld (33–45 m)',
  XL: 'Großfeld (ab 46 m)',
};

/** Größenklasse einer Übung anhand der Feldlänge (Fallback: Kleinfeld). */
export function sizeClass(e) {
  const len = e?.fieldLength;
  if (!len) return 'M';
  if (len <= 20) return 'S';
  if (len <= 32) return 'M';
  if (len <= 45) return 'L';
  return 'XL';
}

/** Lesbare Feldbeschreibung für Umbauhinweise. */
export function fieldLabel(e) {
  const size = e.fieldLength && e.fieldWidth ? ` ${e.fieldLength}×${e.fieldWidth} m` : '';
  return `${e.fieldTemplate ?? 'Feld'}${size}`;
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
  if (!e.ageGroups?.includes(effectiveAge(ageGroup))) return 'Altersgruppe unpassend';
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
export function scoreExercise(e, { focus, players }) {
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
 * Verteilt die Gesamtdauer auf die Übungen (innerhalb min/max).
 * Optional mit Zielverhältnissen (Kurzstrukturen: 25/33/42 %).
 * Liefert null, wenn die Gesamtdauer nicht erreichbar ist.
 */
export function allocateTime(exercises, totalDuration, ratios = null) {
  const mins = exercises.map((e) => e.durationMin);
  const maxs = exercises.map((e) => e.durationMax);
  const minSum = mins.reduce((a, b) => a + b, 0);
  const maxSum = maxs.reduce((a, b) => a + b, 0);
  if (minSum > totalDuration || maxSum < totalDuration) return null;

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const alloc = ratios
    ? exercises.map((e, i) => clamp(Math.round(totalDuration * ratios[i]), mins[i], maxs[i]))
    : [...mins];

  let rest = totalDuration - alloc.reduce((a, b) => a + b, 0);
  // Rest verteilen: erst hinten auffüllen (mehr Spielzeit am Ende),
  // bei Überschuss vorne kürzen.
  let safety = 1000;
  while (rest !== 0 && safety-- > 0) {
    let moved = false;
    if (rest > 0) {
      for (let i = alloc.length - 1; i >= 0 && rest > 0; i--) {
        if (alloc[i] < maxs[i]) {
          alloc[i] += 1;
          rest -= 1;
          moved = true;
        }
      }
    } else {
      for (let i = 0; i < alloc.length && rest < 0; i++) {
        if (alloc[i] > mins[i]) {
          alloc[i] -= 1;
          rest += 1;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return rest === 0 ? alloc : null;
}

/**
 * Erkennt die primäre Spielform (z. B. 3 gegen 3, 4 gegen 4) aus dem Titel.
 * Nur ausgeglichene Formate zählen; beiläufige Erwähnungen in Regression/
 * Progression lösen bewusst nichts aus (Backlog §7).
 */
export function detectBaseFormat(e) {
  const t = String(e?.title ?? '');
  const m = t.match(/([2-8])\s*(?:gegen|vs\.?)\s*([2-8])/i);
  if (m && m[1] === m[2]) return Number(m[1]);
  const words = { zwei: 2, drei: 3, vier: 4, ['fünf']: 5, sechs: 6, sieben: 7, acht: 8 };
  const w = t.toLowerCase().match(/(zwei|drei|vier|fünf|sechs|sieben|acht)[- ]gegen[- ](zwei|drei|vier|fünf|sechs|sieben|acht)/);
  if (w && w[1] === w[2]) return words[w[1]];
  return null;
}

/**
 * Teamrotation für 3-gegen-3-/4-gegen-4-Formen (Backlog §7):
 * maximal vier Teams, zwei spielen gegeneinander, Wechsel nach Gegentor
 * oder spätestens nach zwei bis drei Minuten. Überzählige Spieler werden
 * neutrale Joker beim ballbesitzenden Team. Liefert null, wenn keine
 * Rotation nötig/möglich ist.
 */
export function rotationPlan(e, players) {
  const base = detectBaseFormat(e);
  if (base !== 3 && base !== 4) return null;
  const gk = e.goalkeepersRequired ?? 0;
  const outfield = players - gk;
  if (outfield < base * 3) return null; // zwei Teams reichen – normales Spiel

  // kleinste Teamgröße >= base, mit der höchstens vier Teams entstehen
  let teamSize = base;
  let teams = Math.floor(outfield / teamSize);
  while (teams > 4) {
    teamSize += 1;
    teams = Math.floor(outfield / teamSize);
  }
  teams = Math.min(teams, 4);
  if (teams < 3) return null;
  const jokers = outfield - teams * teamSize;
  return { base, teams, teamSize, jokers };
}

/** Mannschafts- und Feldorganisation für eine Übung (nur Arithmetik). */
export function organize(e, players) {
  const { fields } = playerFit(e, players);
  const gk = e.goalkeepersRequired ?? 0;

  // 3v3/4v4 mit Teamrotation (12/16 Spieler u. ä.): max. vier Teams
  const rot = fields === 1 ? rotationPlan(e, players) : null;
  if (rot) {
    return {
      fields: 1,
      playersPerField: [players],
      goalkeepers: gk,
      mode: 'rotation',
      rotation: rot,
      teamsPerField:
        `${rot.teams} Teams à ${rot.teamSize} – ${rot.teamSize} gegen ${rot.teamSize}, ` +
        'Wechsel nach Gegentor oder spätestens nach 2–3 Minuten',
      oddPlayerHint:
        rot.jokers > 0
          ? `${rot.jokers} neutrale${rot.jokers === 1 ? 'r' : ''} Joker spielt mit dem ballbesitzenden Team`
          : null,
    };
  }

  const perFieldBase = Math.floor(players / fields);
  const extra = players % fields;
  const perField = Array.from({ length: fields }, (_, i) =>
    i < extra ? perFieldBase + 1 : perFieldBase
  );
  const outfield = perField[0] - gk;
  const teamSize = Math.floor(outfield / 2);
  const oddRest = outfield - teamSize * 2;
  return {
    fields,
    playersPerField: perField,
    goalkeepers: gk,
    mode: 'standard',
    teamsPerField: `${teamSize} gegen ${teamSize}${oddRest ? ' + 1' : ''}`,
    oddPlayerHint: oddRest ? e.oddPlayerSolution || null : null,
  };
}

/** Kandidaten je Phase: hart filtern, bewerten, sortieren. */
function candidatesPerPhase(exercises, inputs, phases = PHASE_ORDER) {
  const byPhase = {};
  const reasons = {};
  phases.forEach((phase) => {
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

/**
 * Zählt Feldwechsel einer Kombination zweistufig:
 * - rebuilds/changes: wesentliche Umbauten (Wechsel der Größenklasse)
 * - adjustments/adjustmentChanges: kleine Anpassungen (gleiche Klasse,
 *   aber andere Vorlage oder andere Maße)
 */
export function countRebuilds(exercises) {
  let rebuilds = 0;
  let adjustments = 0;
  const changes = [];
  const adjustmentChanges = [];
  for (let i = 1; i < exercises.length; i++) {
    const prev = exercises[i - 1];
    const cur = exercises[i];
    const entry = {
      afterPhase: prev.phase,
      beforePhase: cur.phase,
      from: fieldLabel(prev),
      to: fieldLabel(cur),
    };
    if (sizeClass(cur) !== sizeClass(prev)) {
      rebuilds += 1;
      changes.push(entry);
    } else if (fieldKey(cur) !== fieldKey(prev)) {
      adjustments += 1;
      adjustmentChanges.push(entry);
    }
  }
  return { rebuilds, changes, adjustments, adjustmentChanges };
}

/**
 * Erzeugt eine vollständige Trainingseinheit.
 * Bewertet alle für die Eingaben zulässigen Strukturen (Standard sowie
 * G/F-/60-Minuten-Kurzstrukturen) und wählt die fachlich beste Kombination.
 * @param {object} db - Datenbank aus loadDatabase() (db.exercises inkl. Diagramm)
 * @param {object} inputs - { ageGroup, duration, focus, players, variant? }
 */
export function generateTraining(db, { ageGroup, duration, focus, players, variant = 0 }) {
  const exercises = db?.exercises ?? [];
  const inputs = { ageGroup, focus, players };
  const structures = allowedStructures({ ageGroup, duration });
  const maxSetupChanges = Number(db?.settings?.maxSetupChanges ?? 1);
  // G/F: hohe Aktivität und einfache Organisation → Kurzstrukturen leicht bevorzugen
  const shortBonus = ageGroup === 'G' || ageGroup === 'F' ? 0.05 : 0;

  const combos = [];
  const failure = { missing: [], details: [] };

  structures.forEach((structure) => {
    const { byPhase, reasons } = candidatesPerPhase(exercises, inputs, structure.phases);
    const missing = structure.phases.filter((p) => (byPhase[p] ?? []).length === 0);
    if (missing.length > 0) {
      if (structure.id === 'standard') {
        failure.missing = missing.map((p) => PHASE_LABELS[p]);
        failure.details = missing.flatMap((p) => reasons[p] ?? []);
      }
      return;
    }

    const walk = (phaseIdx, chosen, baseScore, usedIds) => {
      if (phaseIdx === structure.phases.length) {
        const list = chosen.map((c) => c.exercise);
        const times = allocateTime(list, duration, structure.ratios);
        if (!times) return; // Zeitbudget nicht erfüllbar → harte Regel
        const { rebuilds, changes, adjustments, adjustmentChanges } = countRebuilds(list);
        const fieldScore =
          WEIGHTS.field * ((list.length - 1 - rebuilds) / (list.length - 1));
        const penalty =
          (rebuilds > maxSetupChanges ? (rebuilds - maxSetupChanges) * 0.2 : 0) +
          adjustments * 0.02; // identische Felder bleiben die beste Wahl
        const bonus = structure.id === 'standard' ? 0 : shortBonus;
        combos.push({
          structure,
          exercises: list,
          times,
          rebuilds,
          changes,
          adjustments,
          adjustmentChanges,
          score: baseScore / list.length + fieldScore - penalty + bonus,
        });
        return;
      }
      for (const c of byPhase[structure.phases[phaseIdx]]) {
        if (usedIds.has(c.exercise.id)) continue; // keine Übung doppelt je Einheit
        usedIds.add(c.exercise.id);
        walk(phaseIdx + 1, [...chosen, c], baseScore + c.score, usedIds);
        usedIds.delete(c.exercise.id);
      }
    };
    walk(0, [], 0, new Set());
  });

  if (combos.length === 0) {
    if (failure.missing.length > 0) {
      return {
        ok: false,
        reason: 'Für folgende Phasen wurde keine passende Übung gefunden',
        missingPhases: failure.missing,
        details: failure.details,
      };
    }
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
    structure: pick.structure.id,
    structureLabel: pick.structure.label,
    totalDuration: duration,
    rebuilds: pick.rebuilds,
    rebuildChanges: pick.changes,
    adjustments: pick.adjustments,
    adjustmentChanges: pick.adjustmentChanges,
    equipment: [...new Set(pick.exercises.flatMap((e) => e.equipment ?? []))],
    phases: pick.exercises.map((e, i) => ({
      phase: e.phase,
      label: pick.structure.phaseLabels[e.phase] ?? PHASE_LABELS[e.phase],
      duration: pick.times[i],
      exercise: e,
      organization: organize(e, players),
    })),
  };
}
