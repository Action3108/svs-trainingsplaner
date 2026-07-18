import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfoGrid from '../src/components/ui/InfoGrid.jsx';
import TrainingCard from '../src/components/ui/TrainingCard.jsx';
import DiagramCard from '../src/components/diagram/DiagramCard.jsx';

const exercise = {
  equipment: ['Bälle', 'Hütchen'],
  setup: '20x20-m-Feld mit vier Hütchen.',
  procedure: 'Alle dribbeln frei durch das Feld.',
  rules: 'Kein Ball darf ein Hütchen berühren.',
  coachingPoints: 'Kopf heben, beide Füße nutzen.',
  regression: 'Feld vergrößern.',
  progression: 'Fänger einbauen.',
};

describe('Informationskarten (Backlog §12)', () => {
  it('zeigt alle Themen als Blöcke mit Icon und sichtbarem Textlabel', () => {
    const { container } = render(<InfoGrid exercise={exercise} />);
    ['Material', 'Aufbau', 'Ablauf', 'Regeln', 'Coaching', 'Leichtere Variante', 'Schwierigere Variante'].forEach(
      (label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    );
    // jedes Icon ist dekorativ (aria-hidden) und begleitet ein Textlabel
    const icons = container.querySelectorAll('.svs-info__icon svg[aria-hidden="true"]');
    expect(icons.length).toBe(7);
    // Zwei-Spalten-Raster als Container vorhanden
    expect(container.querySelector('.svs-info-grid')).not.toBeNull();
  });

  it('lässt Blöcke mit fehlenden optionalen Feldern einfach weg', () => {
    render(<InfoGrid exercise={{ setup: 'Nur Aufbau vorhanden.' }} />);
    expect(screen.getByText('Aufbau')).toBeInTheDocument();
    expect(screen.queryByText('Regeln')).toBeNull();
    expect(screen.queryByText('Material')).toBeNull();
  });

  it('rendert nichts, wenn keine Inhalte vorhanden sind', () => {
    const { container } = render(<InfoGrid exercise={{}} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('Übungs-ID sichtbar (Backlog §4)', () => {
  it('zeigt die laufende Übungsnummer im Kartentitel', () => {
    render(
      <TrainingCard phaseLabel="Spielform 1" exerciseId="EX-043" title="Vier-gegen-vier Pass-oder-Dribbel">
        Inhalt
      </TrainingCard>
    );
    expect(screen.getByText(/EX-043/)).toBeInTheDocument();
    expect(screen.getByText(/Vier-gegen-vier Pass-oder-Dribbel/)).toBeInTheDocument();
  });
});

describe('Team-Bezeichnung (Backlog §8)', () => {
  it('zeigt in der Legende „Team Rot“ statt „Team Koralle“', () => {
    render(
      <DiagramCard
        type="Spielform 1"
        data={{ players: [{ team: 'black', n: 1, x: 10, y: 10 }] }}
        altText="Test"
      />
    );
    expect(screen.getByText(/Team Rot/)).toBeInTheDocument();
    expect(screen.queryByText(/Koralle/)).toBeNull();
  });
});
