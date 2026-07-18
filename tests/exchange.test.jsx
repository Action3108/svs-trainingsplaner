import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { findAlternatives, applyExchange } from '../src/logic/exchange.js';
import { generateTraining, PHASE_ORDER } from '../src/logic/generator.js';
import TrainingPlan from '../src/components/TrainingPlan.jsx';

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
    diagram: { diagramId: 'D', data: { field: { w: 100, h: 100 } } },
    ...overrides,
  };
}

/** Datenbank: je Phase A (Standard), plus Alternativen für warmup_1. */
function fixtureDb() {
  const exercises = PHASE_ORDER.map((phase) => ex({ id: `A-${phase}`, phase, title: `A ${phase}` }));
  exercises.push(
    ex({ id: 'ALT-1', title: 'Alternative Eins', equipment: ['Leibchen'] }),
    ex({ id: 'ALT-2', title: 'Alternative Zwei', fieldTemplate: 'anderes_feld', fieldLength: 40, fieldWidth: 30 }),
    ex({ id: 'ALT-FALSCHER-FOKUS', title: 'Falscher Fokus', focusAreas: ['Kopfball'] }),
    ex({ id: 'ALT-ZU-KURZ', title: 'Zu kurz', durationMin: 1, durationMax: 3 }),
    ex({ id: 'ALT-ZU-GROSS', title: 'Zu groß', minPlayers: 20, maxPlayers: 30 })
  );
  return { exercises, settings: { maxSetupChanges: '1' }, lists: {}, errors: [] };
}

const inputs = { ageGroup: 'E', duration: 90, focus: 'Passspiel', players: 10 };

function makePlan(db = fixtureDb()) {
  const plan = generateTraining(db, inputs);
  expect(plan.ok).toBe(true);
  return { db, plan };
}

describe('findAlternatives', () => {
  it('filtert Phase, Fokus, Zeitfenster, Spielerzahl und Duplikate', () => {
    const { db, plan } = makePlan();
    const alts = findAlternatives(db, plan, 0, inputs);
    const ids = alts.map((a) => a.exercise.id);
    expect(ids).toContain('ALT-1');
    expect(ids).toContain('ALT-2');
    expect(ids).not.toContain('A-warmup_1'); // bereits in der Einheit
    expect(ids).not.toContain('ALT-FALSCHER-FOKUS'); // Hauptschwerpunkt bleibt abgedeckt
    expect(ids).not.toContain('ALT-ZU-KURZ'); // Zeitfenster passt nicht
    expect(ids).not.toContain('ALT-ZU-GROSS'); // Spielerzahl
  });

  it('sortiert gleiche Feldaufbauten nach vorn und liefert höchstens fünf', () => {
    const { db, plan } = makePlan();
    const alts = findAlternatives(db, plan, 0, inputs);
    expect(alts.length).toBeLessThanOrEqual(5);
    expect(alts[0].exercise.id).toBe('ALT-1'); // gleiches Feld wie Nachbarphase
    expect(alts[0].sameField).toBe(true);
  });

  it('liefert eine leere Liste, wenn nichts passt', () => {
    const db = { exercises: PHASE_ORDER.map((phase) => ex({ id: `A-${phase}`, phase })) };
    const plan = generateTraining({ ...db, settings: {} }, inputs);
    expect(findAlternatives(db, plan, 0, inputs)).toEqual([]);
  });
});

describe('applyExchange', () => {
  it('ersetzt die Übung und aktualisiert Material, Organisation und Umbauampel', () => {
    const { db, plan } = makePlan();
    const alt = db.exercises.find((e) => e.id === 'ALT-2'); // anderes Feld
    const next = applyExchange(plan, 0, alt, inputs.players);
    expect(next.phases[0].exercise.id).toBe('ALT-2');
    expect(next.phases[0].duration).toBe(plan.phases[0].duration); // Zeit bleibt
    expect(next.rebuilds).toBeGreaterThan(plan.rebuilds); // Umbauampel aktualisiert
    expect(next.phases[0].organization.playersPerField[0]).toBe(10);
    // Gesamtplan unverändert in den anderen Phasen:
    expect(next.phases[1].exercise.id).toBe(plan.phases[1].exercise.id);
  });

  it('aktualisiert die Materialliste', () => {
    const { db, plan } = makePlan();
    const alt = db.exercises.find((e) => e.id === 'ALT-1'); // Leibchen
    const next = applyExchange(plan, 0, alt, inputs.players);
    expect(next.equipment).toContain('Leibchen');
  });
});

describe('Austausch-UI', () => {
  it('öffnet das Bottom Sheet, tauscht nach Bestätigung und bietet Rückgängig', () => {
    const { db, plan } = makePlan();
    const onExchange = vi.fn();
    render(
      <TrainingPlan plan={plan} inputs={inputs} db={db} onExchange={onExchange} onVariant={() => {}} />
    );
    // Button auf jeder Karte
    const buttons = screen.getAllByRole('button', { name: /Übung austauschen/i });
    expect(buttons).toHaveLength(6);
    fireEvent.click(buttons[0]);
    // Sheet zeigt Alternativen mit Vorschau und Meta
    expect(screen.getByText(/Alternative für/)).toBeInTheDocument();
    expect(screen.getByText('Alternative Eins')).toBeInTheDocument();
    expect(screen.getByText(/kein Umbau/)).toBeInTheDocument();
    // bewusste Bestätigung
    fireEvent.click(screen.getByRole('button', { name: /„Alternative Eins“ auswählen/ }));
    expect(onExchange).toHaveBeenCalledWith(0, expect.objectContaining({ id: 'ALT-1' }));
  });

  it('zeigt den Rückgängig-Hinweis nach einem Austausch', () => {
    const { db, plan } = makePlan();
    const onUndo = vi.fn();
    render(
      <TrainingPlan
        plan={plan}
        inputs={inputs}
        db={db}
        onExchange={() => {}}
        canUndo
        onUndo={onUndo}
        onVariant={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Rückgängig/ }));
    expect(onUndo).toHaveBeenCalled();
  });

  it('meldet fehlende Alternativen verständlich', () => {
    const db = { exercises: PHASE_ORDER.map((phase) => ex({ id: `A-${phase}`, phase })), settings: {} };
    const plan = generateTraining(db, inputs);
    render(
      <TrainingPlan plan={plan} inputs={inputs} db={db} onExchange={() => {}} onVariant={() => {}} />
    );
    fireEvent.click(screen.getAllByRole('button', { name: /Übung austauschen/i })[0]);
    expect(screen.getByText(/Keine passende Alternative verfügbar/)).toBeInTheDocument();
  });
});
