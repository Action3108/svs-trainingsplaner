import { describe, it, expect } from 'vitest';
import {
  ALLOWED_FOCUS_AREAS,
  FOCUS_AREA_MAP,
  normalizeFocusAreas,
  stripDraftLabel,
  buildLists,
  validateExerciseRow,
} from '../src/logic/sheetSchema.js';

describe('Sechs erlaubte Trainingsschwerpunkte (Folge-Backlog §3)', () => {
  it('kennt genau die sechs vereinbarten Werte', () => {
    expect(ALLOWED_FOCUS_AREAS).toEqual([
      'Dribbling',
      'Passspiel',
      'Ballan- und -mitnahme',
      '1 gegen 1',
      'Umschalten',
      'Freilaufen und Anbieten',
    ]);
  });

  it('führt die alten Werte vollständig zusammen', () => {
    expect(normalizeFocusAreas(['Ballgewöhnung'])).toEqual(['Dribbling']);
    expect(normalizeFocusAreas(['1 gegen 1 offensiv', '1 gegen 1 defensiv'])).toEqual(['1 gegen 1']);
  });

  it('mappt alle alten Schwerpunktwerte auf erlaubte Werte', () => {
    Object.values(FOCUS_AREA_MAP).forEach((v) => {
      expect(ALLOWED_FOCUS_AREAS).toContain(v);
    });
    expect(normalizeFocusAreas(['Torschuss'])).toEqual(['1 gegen 1']);
    expect(normalizeFocusAreas(['Pressing', 'Spielaufbau'])).toEqual(['Umschalten', 'Passspiel']);
  });

  it('entfernt doppelte Tags nach dem Mapping', () => {
    expect(normalizeFocusAreas(['Dribbling', 'Fintieren', 'Schnelligkeit mit Ball'])).toEqual([
      'Dribbling',
    ]);
  });

  it('verwirft unbekannte Werte statt sie durchzureichen', () => {
    expect(normalizeFocusAreas(['Zaubertricks'])).toEqual([]);
  });

  it('normalisiert Übungszeilen beim Einlesen (auch alte Cache-Daten)', () => {
    const { valid, exercise } = validateExerciseRow({
      id: 'EX-999',
      title: 'ENTWURF: Testübung',
      phase: 'warmup_1',
      ageGroups: 'F;E',
      focusAreas: 'Torschuss;Kombinationen;Passspiel',
      minPlayers: '4',
      maxPlayers: '12',
      durationMin: '8',
      durationMax: '15',
      diagramId: 'DIA-999',
    });
    expect(valid).toBe(true);
    expect(exercise.focusAreas).toEqual(['1 gegen 1', 'Passspiel']);
    expect(exercise.title).toBe('Testübung');
  });

  it('begrenzt die Auswahlliste auf die sechs erlaubten Schwerpunkte', () => {
    const rows = [
      { listName: 'focusAreas', value: 'Torschuss', label: 'Torschuss', sortOrder: 1 },
      { listName: 'focusAreas', value: 'Passspiel', label: 'Passspiel', sortOrder: 2 },
      { listName: 'focusAreas', value: '1 gegen 1', label: '1 gegen 1', sortOrder: 3 },
      { listName: 'focusAreas', value: 'Kopfball', label: 'Kopfball', sortOrder: 4 },
    ];
    const { lists } = buildLists(rows);
    const values = lists.focusAreas.map((f) => f.value);
    values.forEach((v) => expect(ALLOWED_FOCUS_AREAS).toContain(v));
    expect(new Set(values).size).toBe(values.length); // keine Duplikate
  });
});

describe('Sichtbares „Entwurf“ entfernen (Backlog §4)', () => {
  it('entfernt ENTWURF-Präfixe und -Hinweise aus Texten', () => {
    expect(stripDraftLabel('ENTWURF: Dribbelgarten')).toBe('Dribbelgarten');
    expect(stripDraftLabel('Eigenentwicklung (ENTWURF – Quelle ergänzen)')).toBe('Eigenentwicklung');
    expect(stripDraftLabel('Titel ohne Markierung')).toBe('Titel ohne Markierung');
  });

  it('lässt technische Statuswerte unberührt', () => {
    // stripDraftLabel wird nur auf sichtbare Texte angewendet;
    // der Statuswert bleibt ein eigenes Feld.
    const { exercise } = validateExerciseRow({
      id: 'EX-998',
      status: 'published',
      title: 'ENTWURF: X',
      phase: 'warmup_1',
      ageGroups: 'F',
      focusAreas: 'Passspiel',
      minPlayers: '4',
      maxPlayers: '12',
      durationMin: '8',
      durationMax: '15',
      diagramId: 'DIA-998',
    });
    expect(exercise.status).toBe('published');
    expect(exercise.title).not.toMatch(/entwurf/i);
  });
});
