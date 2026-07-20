import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  buildProtocolMarkdown,
  loadReviewState,
  saveReviewState,
} from '../src/components/ReviewMode.jsx';
import ReviewMode from '../src/components/ReviewMode.jsx';
import { REVIEW_STORAGE_KEY } from '../src/config.js';
import { vi } from 'vitest';

const exercises = [
  { id: 'EX-001', title: 'Alpha' },
  { id: 'EX-002', title: 'Beta' },
  { id: 'EX-003', title: 'Gamma' },
];

function stateWith(entries) {
  return { entries };
}

beforeEach(() => {
  // Tests laufen offline: fetch schlägt fehl → Fallback-Datenbank
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
  localStorage.clear();
});

describe('Prüfdatensatz (Kontrollmodus)', () => {
  it('speichert und lädt den Zustand verlustfrei über localStorage', () => {
    const state = stateWith({
      'EX-001': { status: 'fehlerfrei', findings: [], checkedAt: '2026-07-16T10:00:00Z' },
    });
    saveReviewState(state);
    expect(loadReviewState()).toEqual(state);
  });

  it('liefert einen leeren Zustand bei kaputtem Speicherinhalt', () => {
    localStorage.setItem(REVIEW_STORAGE_KEY, '{kaputt');
    expect(loadReviewState()).toEqual({ entries: {} });
  });
});

describe('Update-Protokoll', () => {
  it('führt alle Prüffälle mit Übungs-ID, Bereich und Priorität auf', () => {
    const state = stateWith({
      'EX-002': {
        status: 'Fehler gefunden',
        checkedAt: '2026-07-16T10:00:00Z',
        findings: [
          {
            area: 'Diagramm',
            priority: 'hoch',
            description: 'Pfeil zeigt in die falsche Richtung',
            suggestion: 'Pfeil auf das rechte Tor drehen',
            comment: '',
          },
          {
            area: 'Regeln',
            priority: 'niedrig',
            description: 'Regel unklar formuliert',
            suggestion: 'Satz vereinfachen',
            comment: 'betrifft nur ältere Jahrgänge',
          },
        ],
      },
      'EX-001': { status: 'fehlerfrei', findings: [], checkedAt: '2026-07-16T09:00:00Z' },
    });
    const md = buildProtocolMarkdown(state, exercises);
    expect(md).toMatch(/Prüffall 1: EX-002 · Beta/);
    expect(md).toMatch(/Prüffall 2: EX-002 · Beta/);
    expect(md).toMatch(/Diagramm/);
    expect(md).toMatch(/hoch/);
    expect(md).toMatch(/Zusatzkommentar \| betrifft nur ältere Jahrgänge/);
    // fehlerfreie Übungen zählen im Gesamtstatus, sind aber kein Einzelpunkt
    expect(md).toMatch(/\| fehlerfrei \| 1 \|/);
    expect(md).not.toMatch(/Prüffall \d+: EX-001/);
  });

  it('bildet mehrere Fehler derselben Übung ab, ohne Informationen zu überschreiben', () => {
    const state = stateWith({
      'EX-003': {
        status: 'Fehler gefunden',
        checkedAt: '2026-07-16T10:00:00Z',
        findings: [
          { area: 'Aufbau', priority: 'mittel', description: 'A', suggestion: 'B', comment: '' },
          { area: 'Coaching', priority: 'kritisch', description: 'C', suggestion: 'D', comment: '' },
        ],
      },
    });
    const md = buildProtocolMarkdown(state, exercises);
    expect((md.match(/EX-003/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(md).toMatch(/kritisch/);
  });
});

describe('Kontrollmodus-Oberfläche', () => {
  it('zeigt Fortschritt und Übungen in stabiler ID-Reihenfolge (Fallback-Daten)', async () => {
    render(<ReviewMode />);
    // Ladehinweis, danach Fallback-Datenbank (6 eingebaute Übungen)
    const counter = await screen.findByText(/0\/6/i, {}, { timeout: 5000 });
    expect(counter).toBeInTheDocument();
    expect(screen.getByText(/geprüft/)).toBeInTheDocument();
    expect(screen.getByText(/offen: 6/)).toBeInTheDocument();
    // erste Übung nach ID-Sortierung: FB-001
    expect(screen.getAllByText(/FB-001/).length).toBeGreaterThan(0);
    // Prüfmodus verändert keine produktiven Daten – Hinweis sichtbar
    expect(screen.getByText(/verändern niemals die Übungsdatenbank/i)).toBeInTheDocument();
  });
});
