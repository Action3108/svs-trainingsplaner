import { describe, it, expect } from 'vitest';
import {
  generateTraining,
  allowedStructures,
  allocateTime,
  STRUCTURES,
  PHASE_ORDER,
} from '../src/logic/generator.js';

/** Fixture-Übung im Format der assemblierten Datenbank. */
function ex(overrides = {}) {
  return {
    id: `EX-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Fixture',
    phase: 'warmup_1',
    ageGroups: ['G', 'F', 'E', 'D'],
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

function fullDb() {
  const exercises = PHASE_ORDER.flatMap((phase) => [
    ex({ id: `A-${phase}`, phase }),
    ex({ id: `B-${phase}`, phase, focusAreas: ['Dribbling'] }),
  ]);
  return { exercises, settings: { maxSetupChanges: '1' }, lists: {}, errors: [] };
}

const base = { focus: 'Passspiel', players: 12 };

describe('Erlaubte Trainingsstrukturen (Backlog §6)', () => {
  it('erlaubt Kurzstrukturen für G, F und 60 Minuten', () => {
    expect(allowedStructures({ ageGroup: 'G', duration: 90 }).map((s) => s.id)).toContain('kurz_a');
    expect(allowedStructures({ ageGroup: 'F', duration: 75 }).map((s) => s.id)).toContain('kurz_b');
    expect(allowedStructures({ ageGroup: 'D', duration: 60 }).map((s) => s.id)).toContain('kurz_a');
  });

  it('erlaubt für ältere Jahrgänge mit langer Dauer nur die Standardstruktur', () => {
    expect(allowedStructures({ ageGroup: 'D', duration: 90 }).map((s) => s.id)).toEqual(['standard']);
    expect(allowedStructures({ ageGroup: 'C', duration: 105 }).map((s) => s.id)).toEqual(['standard']);
  });
});

describe('Zeitverteilung', () => {
  it('verteilt 60 Minuten als 15+20+25, wenn die Zeitfenster es erlauben', () => {
    const list = [
      ex({ durationMin: 10, durationMax: 18 }),
      ex({ durationMin: 12, durationMax: 25 }),
      ex({ durationMin: 15, durationMax: 30 }),
    ];
    expect(allocateTime(list, 60, STRUCTURES.kurz_a.ratios)).toEqual([15, 20, 25]);
  });

  it('bleibt exakt bei der Gesamtdauer, auch wenn Ziele geklemmt werden', () => {
    const list = [ex(), ex(), ex()]; // je 8–20 min
    const alloc = allocateTime(list, 60, STRUCTURES.kurz_a.ratios);
    expect(alloc.reduce((a, b) => a + b, 0)).toBe(60);
    alloc.forEach((t) => {
      expect(t).toBeGreaterThanOrEqual(8);
      expect(t).toBeLessThanOrEqual(20);
    });
  });

  it('liefert null, wenn die Dauer nicht erreichbar ist', () => {
    const list = [ex({ durationMax: 10 }), ex({ durationMax: 10 }), ex({ durationMax: 10 })];
    expect(allocateTime(list, 60, STRUCTURES.kurz_a.ratios)).toBeNull();
  });
});

describe('Generator mit Kurzstrukturen', () => {
  it.each(['G', 'F'])('erzeugt für %s-Junioren mit 60 Minuten eine Kurzstruktur', (ageGroup) => {
    const plan = generateTraining(fullDb(), { ...base, ageGroup, duration: 60 });
    expect(plan.ok).toBe(true);
    expect(['kurz_a', 'kurz_b']).toContain(plan.structure);
    expect(plan.phases).toHaveLength(3);
    expect(plan.phases.reduce((a, p) => a + p.duration, 0)).toBe(60);
    expect(plan.structureLabel).toMatch(/Kurzstruktur/);
  });

  it('erzeugt für E-Junioren mit 60 Minuten eine exakte Einheit (Struktur frei)', () => {
    const plan = generateTraining(fullDb(), { ...base, ageGroup: 'E', duration: 60 });
    expect(plan.ok).toBe(true);
    expect(plan.phases.reduce((a, p) => a + p.duration, 0)).toBe(60);
  });

  it.each([75, 90])('G-Junioren mit %s Minuten: Gesamtdauer exakt', (duration) => {
    const plan = generateTraining(fullDb(), { ...base, ageGroup: 'G', duration });
    expect(plan.ok).toBe(true);
    expect(plan.phases.reduce((a, p) => a + p.duration, 0)).toBe(duration);
  });

  it('verwendet für D-Junioren mit 90 Minuten die Standardstruktur mit 6 Phasen', () => {
    const plan = generateTraining(fullDb(), { ...base, ageGroup: 'D', duration: 90 });
    expect(plan.ok).toBe(true);
    expect(plan.structure).toBe('standard');
    expect(plan.phases).toHaveLength(6);
  });

  it('enthält keine Übung doppelt', () => {
    const plan = generateTraining(fullDb(), { ...base, ageGroup: 'G', duration: 60 });
    const ids = plan.phases.map((p) => p.exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('wählt Kurzstruktur A, wenn nur deren Phasen Kandidaten haben', () => {
    const exercises = [
      ex({ id: 'W', phase: 'warmup_1', durationMin: 10, durationMax: 18 }),
      ex({ id: 'U', phase: 'exercise', durationMin: 12, durationMax: 25 }),
      ex({ id: 'S', phase: 'game_form_1', durationMin: 15, durationMax: 30 }),
    ];
    const plan = generateTraining(
      { exercises, settings: {}, lists: {}, errors: [] },
      { ...base, ageGroup: 'F', duration: 60 }
    );
    expect(plan.ok).toBe(true);
    expect(plan.structure).toBe('kurz_a');
    expect(plan.phases.map((p) => p.duration)).toEqual([15, 20, 25]);
    expect(plan.phases.map((p) => p.label)).toEqual(['Aufwärmen', 'Übung', 'Spielform']);
  });

  it('meldet fehlende Phasen klar, wenn keine Struktur möglich ist', () => {
    const exercises = [ex({ id: 'W', phase: 'warmup_1' })];
    const plan = generateTraining(
      { exercises, settings: {}, lists: {}, errors: [] },
      { ...base, ageGroup: 'D', duration: 90 }
    );
    expect(plan.ok).toBe(false);
    expect(plan.missingPhases.length).toBeGreaterThan(0);
  });
});
