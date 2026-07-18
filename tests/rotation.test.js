import { describe, it, expect } from 'vitest';
import { detectBaseFormat, rotationPlan, organize, hardExclusion } from '../src/logic/generator.js';

function ex(overrides = {}) {
  return {
    id: 'EX-test',
    title: '3 gegen 3 auf vier Minitore',
    phase: 'game_form_1',
    ageGroups: ['E', 'D'],
    focusAreas: ['Dribbling'],
    minPlayers: 6,
    maxPlayers: 16,
    preferredPlayers: 12,
    goalkeepersRequired: 0,
    maxWaitingPlayers: 6,
    oddPlayerSolution: 'neutraler Joker spielt mit dem ballbesitzenden Team',
    restPlayersAllowed: false,
    parallelFieldsPossible: true,
    playersPerField: 6,
    durationMin: 10,
    durationMax: 20,
    fieldTemplate: 'vier_tore',
    equipment: ['Bälle'],
    ...overrides,
  };
}

describe('Erkennung der primären Spielform', () => {
  it('erkennt 3 gegen 3 und 4 gegen 4 in Ziffern- und Wortform', () => {
    expect(detectBaseFormat({ title: '3 gegen 3 auf vier Minitore' })).toBe(3);
    expect(detectBaseFormat({ title: 'Drei-gegen-drei Passbonus' })).toBe(3);
    expect(detectBaseFormat({ title: 'Vier-gegen-vier mit Dribbelzonen' })).toBe(4);
    expect(detectBaseFormat({ title: '4 gegen 4 mit Aufbauzonen' })).toBe(4);
  });

  it('ignoriert unausgeglichene Formen und Übungen ohne Spielform im Titel', () => {
    expect(detectBaseFormat({ title: 'Überzahl-Dreieck 3 gegen 2' })).toBeNull();
    expect(detectBaseFormat({ title: 'Dribbelgarten' })).toBeNull();
  });
});

describe('Teamrotation 3 gegen 3 (Backlog §7)', () => {
  it('12 Spieler: vier Teams à drei Spieler', () => {
    const org = organize(ex(), 12);
    expect(org.mode).toBe('rotation');
    expect(org.rotation).toMatchObject({ teams: 4, teamSize: 3, jokers: 0 });
    expect(org.teamsPerField).toMatch(/4 Teams à 3/);
    expect(org.teamsPerField).toMatch(/Gegentor|2–3 Minuten/);
  });

  it('16 Spieler: vier Teams à vier Spieler (skaliert auf 4 gegen 4)', () => {
    const org = organize(ex(), 16);
    expect(org.rotation).toMatchObject({ teams: 4, teamSize: 4, jokers: 0 });
  });

  it('14 Spieler: vier Teams à drei plus zwei neutrale Joker', () => {
    const org = organize(ex(), 14);
    expect(org.rotation).toMatchObject({ teams: 4, teamSize: 3, jokers: 2 });
    expect(org.oddPlayerHint).toMatch(/Joker/);
  });

  it('wird bei 12 und 16 Spielern nicht fälschlich ausgeschlossen', () => {
    expect(hardExclusion(ex(), { ageGroup: 'E', players: 12 })).toBeNull();
    expect(hardExclusion(ex(), { ageGroup: 'E', players: 16 })).toBeNull();
  });
});

describe('Teamrotation 4 gegen 4 (Backlog §7)', () => {
  const ex4 = () => ex({ title: '4 gegen 4 mit Aufbauzonen', playersPerField: 8 });

  it('12 Spieler: drei Teams à vier Spieler', () => {
    const org = organize(ex4(), 12);
    expect(org.rotation).toMatchObject({ teams: 3, teamSize: 4, jokers: 0 });
  });

  it('16 Spieler: vier Teams à vier Spieler', () => {
    const org = organize(ex4(), 16);
    expect(org.rotation).toMatchObject({ teams: 4, teamSize: 4, jokers: 0 });
  });

  it('bildet nie mehr als vier Teams', () => {
    for (let players = 8; players <= 16; players++) {
      const plan = rotationPlan(ex4(), players);
      if (plan) expect(plan.teams).toBeLessThanOrEqual(4);
    }
  });

  it('8 Spieler: normales Spiel ohne Rotation (zwei Teams reichen)', () => {
    const org = organize(ex4(), 8);
    expect(org.mode).toBe('standard');
    expect(org.teamsPerField).toBe('4 gegen 4');
  });
});
