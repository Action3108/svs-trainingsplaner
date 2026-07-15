import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseCsv, csvToObjects } from '../src/logic/csv.js';
import {
  validateExerciseRow,
  validateDiagramRow,
  assembleDatabase,
  splitList,
} from '../src/logic/sheetSchema.js';
import { loadDatabase, saveCache, readCache } from '../src/logic/sheetClient.js';
import { CACHE_KEY } from '../src/config.js';

/** Hilfsfunktion: Zellen RFC-4180-konform quoten. */
const q = (cells) => cells.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',');

const DIAGRAM_JSON = JSON.stringify({
  field: { w: 100, h: 100 },
  players: [{ team: 'black', n: 1, x: 20, y: 20 }],
  balls: [{ x: 22, y: 22 }],
  arrows: [{ type: 'pass', from: { x: 20, y: 20 }, to: { x: 80, y: 20 } }],
});

const EXERCISE_HEADER = [
  'id', 'status', 'title', 'ageGroups', 'focusAreas', 'phase',
  'minPlayers', 'maxPlayers', 'durationMin', 'durationMax', 'diagramId',
];

function exerciseRow(overrides = {}) {
  return {
    id: 'EX-T1', status: 'published', title: 'Testübung',
    ageGroups: 'F;E', focusAreas: 'Passspiel', phase: 'warmup_1',
    minPlayers: '4', maxPlayers: '16', durationMin: '10', durationMax: '15',
    diagramId: 'DIA-T1', ...overrides,
  };
}

function diagramRow(overrides = {}) {
  return {
    diagramId: 'DIA-T1', exerciseId: 'EX-T1', status: 'published',
    diagramData: DIAGRAM_JSON, ...overrides,
  };
}

describe('CSV-Parser', () => {
  it('parst Anführungszeichen, Kommas und Zeilenumbrüche in Zellen', () => {
    const text = 'a,b\n"Hallo, Welt","Zeile1\nZeile2"\n"mit ""Zitat""",x';
    const rows = parseCsv(text);
    expect(rows).toEqual([
      ['a', 'b'],
      ['Hallo, Welt', 'Zeile1\nZeile2'],
      ['mit "Zitat"', 'x'],
    ]);
  });

  it('entfernt BOM und verarbeitet CRLF', () => {
    const text = '﻿key,value\r\nappTitle,Test\r\n';
    expect(csvToObjects(text)).toEqual([{ key: 'appTitle', value: 'Test' }]);
  });

  it('ignoriert komplett leere Zeilen', () => {
    expect(parseCsv('a,b\n\n1,2\n , \n')).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('Schema-Validierung', () => {
  it('akzeptiert eine gültige Übungszeile und normalisiert Listen/Zahlen', () => {
    const { valid, exercise } = validateExerciseRow(exerciseRow());
    expect(valid).toBe(true);
    expect(exercise.ageGroups).toEqual(['F', 'E']);
    expect(exercise.minPlayers).toBe(4);
    expect(exercise.durationMax).toBe(15);
  });

  it('lehnt Zeilen mit fehlender id, falscher Phase oder Zahlendreher ab', () => {
    expect(validateExerciseRow(exerciseRow({ id: '' })).valid).toBe(false);
    expect(validateExerciseRow(exerciseRow({ phase: 'kuchen' })).valid).toBe(false);
    expect(validateExerciseRow(exerciseRow({ minPlayers: '10', maxPlayers: '4' })).valid).toBe(false);
  });

  it('lehnt Diagramme mit defektem JSON ab', () => {
    const { valid, errors } = validateDiagramRow(diagramRow({ diagramData: '{kaputt' }));
    expect(valid).toBe(false);
    expect(errors.join(' ')).toMatch(/JSON/i);
  });

  it('splitList trennt Semikolon-Listen', () => {
    expect(splitList(' F; E ;')).toEqual(['F', 'E']);
  });
});

describe('assembleDatabase', () => {
  it('übernimmt nur published-Übungen mit gültigem published-Diagramm', () => {
    const db = assembleDatabase({
      exercises: [
        exerciseRow(),
        exerciseRow({ id: 'EX-T2', status: 'draft' }),
        exerciseRow({ id: 'EX-T3', diagramId: 'DIA-DRAFT' }),
      ],
      diagrams: [diagramRow(), diagramRow({ diagramId: 'DIA-DRAFT', status: 'draft' })],
      lists: [{ listName: 'ageGroups', value: 'F', label: 'F-Junioren', sortOrder: '2' }],
      settings: [{ key: 'appTitle', value: 'SVS' }],
    });
    expect(db.exercises.map((e) => e.id)).toEqual(['EX-T1']);
    expect(db.exercises[0].diagram.data.players).toHaveLength(1);
    expect(db.errors.join(' ')).toMatch(/EX-T3/);
    expect(db.settings.appTitle).toBe('SVS');
    expect(db.lists.ageGroups[0].label).toBe('F-Junioren');
  });

  it('überspringt doppelte ids und defekte Zeilen, ohne zu blockieren', () => {
    const db = assembleDatabase({
      exercises: [exerciseRow(), exerciseRow(), exerciseRow({ id: 'EX-X', phase: 'falsch' })],
      diagrams: [diagramRow()],
      lists: [],
      settings: [],
    });
    expect(db.exercises).toHaveLength(1);
    expect(db.errors.some((e) => e.includes('doppelte id'))).toBe(true);
    expect(db.errors.some((e) => e.includes('EX-X'))).toBe(true);
  });
});

describe('loadDatabase (Fallback-Kette)', () => {
  const csvByTab = {
    Settings: 'key,value\nappTitle,SVS-Test',
    Lists: 'listName,value,label,sortOrder\nageGroups,F,F-Junioren,1',
    Exercises: [q(EXERCISE_HEADER), q(EXERCISE_HEADER.map((k) => exerciseRow()[k]))].join('\n'),
    Diagrams: [
      q(['diagramId', 'exerciseId', 'status', 'diagramData']),
      q(['DIA-T1', 'EX-T1', 'published', DIAGRAM_JSON]),
    ].join('\n'),
  };

  const okFetch = vi.fn((url) => {
    const tab = Object.keys(csvByTab).find((t) => url.includes(`sheet=${t}`));
    return Promise.resolve({ ok: true, text: () => Promise.resolve(csvByTab[tab] ?? '') });
  });

  beforeEach(() => localStorage.clear());

  it('lädt vom Netz, filtert published und füllt den Cache', async () => {
    const result = await loadDatabase({ fetchImpl: okFetch });
    expect(result.source).toBe('network');
    expect(result.db.exercises.map((e) => e.id)).toEqual(['EX-T1']);
    expect(result.db.settings.appTitle).toBe('SVS-Test');
    expect(readCache()).not.toBeNull();
  });

  it('nutzt bei Netzausfall die letzte gültige Kopie', async () => {
    saveCache({ exercises: [{ id: 'EX-CACHED' }], settings: {}, lists: {}, errors: [], counts: {} });
    const result = await loadDatabase({ fetchImpl: () => Promise.reject(new Error('offline')) });
    expect(result.source).toBe('cache');
    expect(result.db.exercises[0].id).toBe('EX-CACHED');
    expect(result.errors.join(' ')).toMatch(/nicht erreichbar/);
  });

  it('nutzt ohne Netz und Cache die eingebaute Fallback-Datenbank', async () => {
    const result = await loadDatabase({ fetchImpl: () => Promise.reject(new Error('offline')) });
    expect(result.source).toBe('fallback');
    expect(result.db.exercises.length).toBeGreaterThanOrEqual(6);
    const phases = result.db.exercises.map((e) => e.phase);
    ['warmup_1', 'warmup_2', 'game_form_1', 'exercise', 'game_form_2', 'final_game'].forEach((p) =>
      expect(phases).toContain(p)
    );
  });

  it('wertet HTTP-Fehler als Netzausfall', async () => {
    const result = await loadDatabase({
      fetchImpl: () => Promise.resolve({ ok: false, status: 403, text: () => Promise.resolve('') }),
    });
    expect(result.source).toBe('fallback');
  });

  it('eine defekte Diagrammzeile blockiert die übrigen Daten nicht', async () => {
    const broken = {
      ...csvByTab,
      Diagrams: [
        q(['diagramId', 'exerciseId', 'status', 'diagramData']),
        q(['DIA-T1', 'EX-T1', 'published', DIAGRAM_JSON]),
        q(['DIA-BAD', 'EX-T1', 'published', '{kaputt']),
      ].join('\n'),
    };
    const fetchImpl = (url) => {
      const tab = Object.keys(broken).find((t) => url.includes(`sheet=${t}`));
      return Promise.resolve({ ok: true, text: () => Promise.resolve(broken[tab] ?? '') });
    };
    const result = await loadDatabase({ fetchImpl });
    expect(result.source).toBe('network');
    expect(result.db.exercises).toHaveLength(1);
    expect(result.errors.some((e) => e.includes('DIA-BAD'))).toBe(true);
  });

  it('Cache-Schlüssel ist versioniert', () => {
    expect(CACHE_KEY).toMatch(/-v\d+$/);
  });

  it('hängt an jeden Abruf einen Cache-Buster an und nutzt die Query-Engine', async () => {
    const calls = [];
    const fetchImpl = (url) => {
      calls.push(url);
      const tab = Object.keys(csvByTab).find((t) => url.includes(`sheet=${t}`));
      return Promise.resolve({ ok: true, text: () => Promise.resolve(csvByTab[tab] ?? '') });
    };
    await loadDatabase({ fetchImpl });
    expect(calls).toHaveLength(4);
    calls.forEach((url) => expect(url).toMatch(/[?&]cb=\d+/));
    // Exercises/Diagrams/Lists über die Query-Engine (frische Daten) …
    expect(calls.find((u) => u.includes('sheet=Exercises'))).toContain('tq=select');
    // … Settings ohne tq (Query-Engine leert dort Textwerte)
    expect(calls.find((u) => u.includes('sheet=Settings'))).not.toContain('tq=select');
  });

  it('nutzt kanonische Spaltennamen, wenn gviz Spaltenköpfe verfälscht', async () => {
    // Nachgestellter gviz-Bug: Kopfzeile nennt die status-Spalte „published“.
    // Volle kanonische Spaltenzahl (49) → kanonische Namen greifen.
    const header = Array(49).fill('x');
    const row = Array(49).fill('');
    // Kopf absichtlich verfälscht:
    header[0] = 'id'; header[1] = 'published'; header[2] = 'title';
    row[0] = 'EX-T1'; row[1] = 'published'; row[2] = 'Testübung';
    row[3] = 'F;E'; row[4] = 'Passspiel'; row[5] = 'warmup_1';
    row[6] = '4'; row[7] = '16'; row[16] = '10'; row[17] = '15';
    row[47] = 'DIA-T1';
    const brokenHeader = {
      ...csvByTab,
      Exercises: [q(header), q(row)].join('\n'),
    };
    const fetchImpl = (url) => {
      const tab = Object.keys(brokenHeader).find((t) => url.includes(`sheet=${t}`));
      return Promise.resolve({ ok: true, text: () => Promise.resolve(brokenHeader[tab] ?? '') });
    };
    const result = await loadDatabase({ fetchImpl });
    expect(result.db.exercises.map((e) => e.id)).toEqual(['EX-T1']);
  });

  it('überschreibt eine gute Cache-Kopie nicht mit einem 0-Übungen-Ergebnis', async () => {
    saveCache({ exercises: [{ id: 'EX-GOOD' }], settings: {}, lists: {}, errors: [], counts: {} });
    // Netzwerk liefert Zeilen, aber alle Diagramme draft → 0 published
    const draftDiagrams = {
      ...csvByTab,
      Diagrams: [
        q(['diagramId', 'exerciseId', 'status', 'diagramData']),
        q(['DIA-T1', 'EX-T1', 'draft', DIAGRAM_JSON]),
      ].join('\n'),
    };
    const fetchImpl = (url) => {
      const tab = Object.keys(draftDiagrams).find((t) => url.includes(`sheet=${t}`));
      return Promise.resolve({ ok: true, text: () => Promise.resolve(draftDiagrams[tab] ?? '') });
    };
    const result = await loadDatabase({ fetchImpl });
    expect(result.db.exercises).toHaveLength(0); // ehrliches Netzwerk-Ergebnis
    expect(readCache().db.exercises[0].id).toBe('EX-GOOD'); // Cache unangetastet
  });
});
