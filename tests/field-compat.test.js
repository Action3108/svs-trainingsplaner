import { describe, it, expect } from 'vitest';
import {
  sizeClass,
  fieldLabel,
  countRebuilds,
  generateTraining,
  PHASE_ORDER,
  SIZE_CLASS_LABELS,
} from '../src/logic/generator.js';
import { findAlternatives } from '../src/logic/exchange.js';

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
    fieldLength: 20,
    fieldWidth: 20,
    equipment: ['Bälle'],
    diagram: { diagramId: 'D', data: {} },
    ...overrides,
  };
}

describe('Feldgrößenklassen (Feldkompatibilität 2026-07-17)', () => {
  it('ordnet Feldlängen den vier Klassen zu', () => {
    expect(sizeClass({ fieldLength: 12 })).toBe('S');
    expect(sizeClass({ fieldLength: 20 })).toBe('S');
    expect(sizeClass({ fieldLength: 21 })).toBe('M');
    expect(sizeClass({ fieldLength: 32 })).toBe('M');
    expect(sizeClass({ fieldLength: 33 })).toBe('L');
    expect(sizeClass({ fieldLength: 45 })).toBe('L');
    expect(sizeClass({ fieldLength: 46 })).toBe('XL');
    expect(sizeClass({})).toBe('M'); // Fallback ohne Maße
    expect(Object.keys(SIZE_CLASS_LABELS)).toEqual(['S', 'M', 'L', 'XL']);
  });

  it('beschreibt Felder lesbar für die Umbauhinweise', () => {
    expect(fieldLabel(ex())).toBe('quadrat_klein 20×20 m');
  });

  it('unterscheidet Umbau und kleine Anpassung in einer Einheit', () => {
    const { rebuilds, adjustments } = countRebuilds([
      ex({ fieldLength: 20, fieldWidth: 20 }), // S
      ex({ fieldLength: 18, fieldWidth: 18 }), // S, andere Maße → Anpassung
      ex({ fieldTemplate: 'vier_tore', fieldLength: 30, fieldWidth: 22 }), // M → Umbau
      ex({ fieldTemplate: 'zwei_tore', fieldLength: 30, fieldWidth: 24 }), // M → Anpassung
    ]);
    expect(rebuilds).toBe(1);
    expect(adjustments).toBe(2);
  });

  it('bevorzugt Kombinationen ohne Klassenwechsel gegenüber reinen Vorlagen-Matches', () => {
    // Pro Phase zwei Kandidaten: gleicher Score, aber Variante B bleibt
    // in derselben Größenklasse (M) trotz wechselnder Vorlagen.
    const exercises = PHASE_ORDER.flatMap((phase, i) => [
      ex({ id: `WECHSEL-${phase}`, phase, focusAreas: ['Dribbling'],
           fieldTemplate: 'quadrat_klein', fieldLength: i % 2 === 0 ? 20 : 40, fieldWidth: 20 }),
      ex({ id: `KLASSE-${phase}`, phase, focusAreas: ['Dribbling'],
           fieldTemplate: `vorlage_${i}`, fieldLength: 25 + i, fieldWidth: 20 }),
    ]);
    const plan = generateTraining(
      { exercises, settings: { maxSetupChanges: '1' }, lists: {}, errors: [] },
      { ageGroup: 'E', duration: 90, focus: 'Dribbling', players: 10 }
    );
    expect(plan.ok).toBe(true);
    expect(plan.phases.every((p) => p.exercise.id.startsWith('KLASSE-'))).toBe(true);
    expect(plan.rebuilds).toBe(0);
    expect(plan.adjustments).toBeGreaterThan(0);
  });

  it('kennzeichnet Alternativen mit gleicher Größenklasse als kleine Anpassung', () => {
    const exercises = PHASE_ORDER.map((phase) => ex({ id: `A-${phase}`, phase }));
    exercises.push(
      ex({ id: 'ALT-GLEICHE-KLASSE', fieldTemplate: 'kanal', fieldLength: 18, fieldWidth: 14 }),
      ex({ id: 'ALT-ANDERE-KLASSE', fieldTemplate: 'halbfeld', fieldLength: 40, fieldWidth: 30 })
    );
    const db = { exercises, settings: {}, lists: {}, errors: [] };
    const plan = generateTraining(db, { ageGroup: 'E', duration: 90, focus: 'Passspiel', players: 10 });
    const alts = findAlternatives(db, plan, 0, { ageGroup: 'E', focus: 'Passspiel', players: 10 });
    const sameClassAlt = alts.find((a) => a.exercise.id === 'ALT-GLEICHE-KLASSE');
    const otherClassAlt = alts.find((a) => a.exercise.id === 'ALT-ANDERE-KLASSE');
    expect(sameClassAlt.sameClass).toBe(true);
    expect(otherClassAlt.sameClass).toBe(false);
  });
});
