import { describe, it, expect } from 'vitest';
import { checkData, normalizeTitle } from '../scripts/check-data.mjs';

const okDiagram = JSON.stringify({
  field: { w: 100, h: 100 },
  players: [{ team: 'black', n: 1, x: 10, y: 10 }],
  balls: [{ x: 12, y: 12 }],
  arrows: [{ type: 'run', from: { x: 10, y: 10 }, to: { x: 40, y: 40 } }],
});

function ex(id, overrides = {}) {
  return {
    id,
    status: 'published',
    title: `Übung ${id}`,
    focusAreas: 'Passspiel',
    diagramId: id.replace('EX', 'DIA'),
    ...overrides,
  };
}
function dia(id, overrides = {}) {
  return {
    diagramId: id,
    exerciseId: id.replace('DIA', 'EX'),
    status: 'published',
    diagramData: okDiagram,
    ...overrides,
  };
}

describe('Datenmigrationsprüfung (Backlog §13)', () => {
  it('akzeptiert einen konsistenten Datenbestand beliebiger Größe (> 60 erlaubt)', () => {
    const exercises = Array.from({ length: 98 }, (_, i) => ex(`EX-${String(i + 1).padStart(3, '0')}`));
    const diagrams = exercises.map((e) => dia(e.diagramId));
    const { errors, counts } = checkData(exercises, diagrams);
    expect(errors).toEqual([]);
    expect(counts.exercises).toBe(98); // nicht künstlich auf 60 begrenzt
  });

  it('findet doppelte IDs und doppelte normalisierte Titel', () => {
    const { errors } = checkData(
      [ex('EX-001'), ex('EX-001'), ex('EX-002', { title: 'entwurf: übung ex-001 ' })],
      [dia('DIA-001'), dia('DIA-002')]
    );
    expect(errors.some((e) => e.msg.includes('doppelte Übungs-ID'))).toBe(true);
    expect(errors.some((e) => e.msg.includes('doppelter normalisierter Titel'))).toBe(true);
  });

  it('findet verwaiste Diagramme und fehlende Diagrammverweise', () => {
    const { errors } = checkData(
      [ex('EX-001', { diagramId: 'DIA-404' })],
      [dia('DIA-001'), dia('DIA-777', { exerciseId: 'EX-999' })]
    );
    expect(errors.some((e) => e.msg.includes('verwaistes Diagramm'))).toBe(true);
    expect(errors.some((e) => e.msg.includes('existiert nicht'))).toBe(true);
  });

  it('meldet sichtbares „Entwurf“, alte Schwerpunkte und doppelte Tags', () => {
    const { errors } = checkData(
      [
        ex('EX-001', { title: 'ENTWURF: Test' }),
        ex('EX-002', { focusAreas: 'Torschuss' }),
        ex('EX-003', { focusAreas: 'Passspiel;Passspiel' }),
      ],
      [dia('DIA-001'), dia('DIA-002'), dia('DIA-003')]
    );
    expect(errors.some((e) => e.msg.includes('Entwurf'))).toBe(true);
    expect(errors.some((e) => e.msg.includes('unzulässiger Schwerpunkt'))).toBe(true);
    expect(errors.some((e) => e.msg.includes('doppelte Schwerpunkt-Tags'))).toBe(true);
  });

  it('prüft Diagramm-JSON gegen das App-Schema', () => {
    const { errors } = checkData(
      [ex('EX-001')],
      [dia('DIA-001', { diagramData: '{"players":[{"team":"lila","x":10,"y":10}]}' })]
    );
    expect(errors.some((e) => e.msg.includes('team'))).toBe(true);
  });

  it('normalisiert Titel wie vereinbart', () => {
    expect(normalizeTitle('ENTWURF: Drei-gegen-Drei  auf vier Tore!')).toBe(
      normalizeTitle('drei gegen drei auf vier tore')
    );
  });
});
