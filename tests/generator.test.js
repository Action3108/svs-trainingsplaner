import { describe, it, expect } from 'vitest';
import {
  generateTraining,
  allocateTime,
  hardExclusion,
  playerFit,
  countRebuilds,
  PHASE_ORDER,
} from '../src/logic/generator.js';
import fallbackDb from '../src/data/fallbackExercises.json';

/** Fixture-Übung im Format der assemblierten Datenbank. */
function ex(overrides = {}) {
  return {
    id: `EX-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Fixture',
    phase: 'warmup_1',
    ageGroups: ['F', 'E', 'D'],
    focusAreas: ['Passspiel'],
    minPlayers: 4,
    maxPlayers: 16,
    preferredPlayers: 10,
    goalkeepersRequired: 0,
    maxWaitingPlayers: 0,
    oddPlayerSolution: 'ein Spieler doppelt',
    restPlayersAllowed: false,
    parallelFieldsPossible: false,
    playersPerField: null,
    durationMin: 8,
    durationMax: 20,
    fieldTemplate: 'quadrat_klein',
    equipment: ['Bälle', 'Hütchen'],
    diagram: { diagramId: 'D', data: {} },
    ...overrides,
  };
}

/** Datenbank mit je zwei Kandidaten pro Phase. */
function fixtureDb(overridesPerPhase = {}) {
  const exercises = PHASE_ORDER.flatMap((phase, i) => [
    ex({ id: `A-${phase}`, phase, ...(overridesPerPhase[phase] ?? {}) }),
    ex({ id: `B-${phase}`, phase, fieldTemplate: `feld_${i}`, focusAreas: ['Dribbling'] }),
  ]);
  return { exercises, settings: { maxSetupChanges: '1' }, lists: {}, errors: [] };
}

describe('Harte Ausschlussregeln', () => {
  it('schließt falsche Altersgruppe und Spielerzahl aus', () => {
    expect(hardExclusion(ex(), { ageGroup: 'A', players: 10 })).toMatch(/Altersgruppe/);
    expect(hardExclusion(ex(), { ageGroup: 'E', players: 30 })).toMatch(/Spielerzahl/);
    expect(hardExclusion(ex(), { ageGroup: 'E', players: 10 })).toBeNull();
  });

  it('behandelt „Senioren“ (S) wie die A-Jugend – A-Übungen werden akzeptiert', () => {
    const aOnly = ex({ ageGroups: ['A'] });
    expect(hardExclusion(aOnly, { ageGroup: 'S', players: 10 })).toBeNull();
    expect(hardExclusion(aOnly, { ageGroup: 'A', players: 10 })).toBeNull();
    // Eine reine Jugendübung ohne A bleibt für Senioren ausgeschlossen
    expect(hardExclusion(ex({ ageGroups: ['E'] }), { ageGroup: 'S', players: 10 })).toMatch(
      /Altersgruppe/
    );
  });

  it('schließt ungerade Spielerzahl ohne hinterlegte Lösung aus', () => {
    const noSolution = ex({ oddPlayerSolution: '', restPlayersAllowed: false });
    expect(hardExclusion(noSolution, { ageGroup: 'E', players: 7 })).toMatch(/ungerade/);
    expect(hardExclusion(ex(), { ageGroup: 'E', players: 7 })).toBeNull();
  });

  it('erlaubt große Gruppen über parallele Felder', () => {
    const parallel = ex({ maxPlayers: 8, parallelFieldsPossible: true, playersPerField: 8 });
    expect(playerFit(parallel, 20)).toEqual({ ok: true, fields: 3 });
    expect(playerFit(ex({ maxPlayers: 8 }), 20).ok).toBe(false);
  });
});

describe('Zeitverteilung', () => {
  it('verteilt die Gesamtdauer exakt innerhalb min/max', () => {
    const list = [ex(), ex(), ex(), ex(), ex(), ex()];
    const alloc = allocateTime(list, 90);
    expect(alloc.reduce((a, b) => a + b, 0)).toBe(90);
    alloc.forEach((t, i) => {
      expect(t).toBeGreaterThanOrEqual(list[i].durationMin);
      expect(t).toBeLessThanOrEqual(list[i].durationMax);
    });
  });

  it('liefert null, wenn das Zeitbudget nicht erreichbar ist', () => {
    const list = [ex({ durationMin: 30, durationMax: 40 })];
    expect(allocateTime(list, 20)).toBeNull();
    expect(allocateTime(list, 50)).toBeNull();
  });
});

describe('generateTraining', () => {
  const inputs = { ageGroup: 'E', duration: 90, focus: 'Passspiel', players: 10 };

  it('erzeugt genau sechs Phasen in fester Reihenfolge mit exakter Gesamtdauer', () => {
    const result = generateTraining(fixtureDb(), inputs);
    expect(result.ok).toBe(true);
    expect(result.phases.map((p) => p.phase)).toEqual(PHASE_ORDER);
    expect(result.phases.reduce((a, p) => a + p.duration, 0)).toBe(90);
  });

  it('funktioniert für alle Altersklassen und Dauern der Fixture', () => {
    ['F', 'E', 'D'].forEach((ageGroup) => {
      [60, 75, 90, 105].forEach((duration) => {
        const r = generateTraining(fixtureDb(), { ...inputs, ageGroup, duration });
        expect(r.ok).toBe(true);
        expect(r.phases.reduce((a, p) => a + p.duration, 0)).toBe(duration);
      });
    });
  });

  it('bevorzugt Schwerpunkt-Übungen und minimiert Umbauten', () => {
    const r = generateTraining(fixtureDb(), inputs);
    // A-Übungen: Schwerpunkt Passspiel UND gleiches Feld → beides spricht für A
    expect(r.phases.every((p) => p.exercise.id.startsWith('A-'))).toBe(true);
    expect(r.rebuilds).toBe(0);
  });

  it('meldet fehlende Phasen klar, statt etwas zu erfinden', () => {
    const db = fixtureDb();
    db.exercises = db.exercises.filter((e) => e.phase !== 'final_game');
    const r = generateTraining(db, inputs);
    expect(r.ok).toBe(false);
    expect(r.missingPhases).toContain('Abschlussspiel');
  });

  it('meldet unpassende Spielerzahl als fehlende Kandidaten', () => {
    const r = generateTraining(fixtureDb(), { ...inputs, players: 30 });
    expect(r.ok).toBe(false);
    expect(r.details.join(' ')).toMatch(/Spielerzahl/);
  });

  it('liefert alternative Gesamtpläne bei unveränderten Filtern', () => {
    const r0 = generateTraining(fixtureDb(), inputs);
    const r1 = generateTraining(fixtureDb(), { ...inputs, variant: 1 });
    expect(r1.ok).toBe(true);
    expect(r1.variantsAvailable).toBeGreaterThan(1);
    const ids = (r) => r.phases.map((p) => p.exercise.id).join(',');
    expect(ids(r1)).not.toBe(ids(r0));
  });

  it('enthält keine doppelten Übungen', () => {
    const r = generateTraining(fixtureDb(), inputs);
    const ids = r.phases.map((p) => p.exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('berechnet Organisation inkl. ungerader Spielerzahl', () => {
    const r = generateTraining(fixtureDb(), { ...inputs, players: 9 });
    expect(r.ok).toBe(true);
    const org = r.phases[0].organization;
    expect(org.fields).toBe(1);
    expect(org.teamsPerField).toMatch(/\+ 1/);
    expect(org.oddPlayerHint).toBeTruthy();
  });

  it('zählt wesentliche Umbauten (Größenklassenwechsel) korrekt', () => {
    const { rebuilds, adjustments } = countRebuilds([
      ex({ fieldTemplate: 'a', fieldLength: 20, fieldWidth: 20 }), // S
      ex({ fieldTemplate: 'a', fieldLength: 20, fieldWidth: 20 }), // S
      ex({ fieldTemplate: 'b', fieldLength: 30, fieldWidth: 25 }), // M → Umbau
    ]);
    expect(rebuilds).toBe(1);
    expect(adjustments).toBe(0);
  });

  it('wertet Vorlagenwechsel in gleicher Größenklasse als kleine Anpassung', () => {
    const { rebuilds, adjustments, adjustmentChanges } = countRebuilds([
      ex({ fieldTemplate: 'quadrat_klein', fieldLength: 25, fieldWidth: 20 }),
      ex({ fieldTemplate: 'vier_tore', fieldLength: 25, fieldWidth: 20 }), // Tore dazustellen
    ]);
    expect(rebuilds).toBe(0);
    expect(adjustments).toBe(1);
    expect(adjustmentChanges[0].to).toMatch(/vier_tore/);
  });
});

describe('Integration mit der Fallback-Datenbank', () => {
  it('erzeugt aus den sechs Fallback-Übungen eine vollständige Einheit', () => {
    const r = generateTraining(fallbackDb, {
      ageGroup: 'E',
      duration: 90,
      focus: 'Passspiel',
      players: 8,
    });
    expect(r.ok).toBe(true);
    expect(r.phases).toHaveLength(6);
    expect(r.phases.reduce((a, p) => a + p.duration, 0)).toBe(90);
    expect(r.equipment.length).toBeGreaterThan(0);
    r.phases.forEach((p) => expect(p.exercise.diagram).toBeTruthy());
  });

  it('meldet bei 30 Spielern fehlende Kandidaten (Fallback-Grenzen)', () => {
    const r = generateTraining(fallbackDb, {
      ageGroup: 'E',
      duration: 90,
      focus: 'Passspiel',
      players: 30,
    });
    expect(r.ok).toBe(false);
  });
});
