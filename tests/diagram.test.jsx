import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { validateDiagramData } from '../src/logic/diagramSchema.js';
import DiagramRenderer from '../src/components/DiagramRenderer.jsx';
import { exampleDiagrams } from '../src/data/exampleDiagrams.js';

describe('validateDiagramData', () => {
  it('akzeptiert alle sechs Beispieldiagramme', () => {
    exampleDiagrams.forEach((d) => {
      const result = validateDiagramData(d.data);
      expect(result.valid, `${d.id}: ${result.errors.join('; ')}`).toBe(true);
    });
  });

  it('akzeptiert JSON-Strings', () => {
    const json = JSON.stringify(exampleDiagrams[0].data);
    expect(validateDiagramData(json).valid).toBe(true);
  });

  it('lehnt kaputtes JSON ab', () => {
    const r = validateDiagramData('{kaputt');
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('lehnt Koordinaten außerhalb 0–100 ab', () => {
    const r = validateDiagramData({ players: [{ team: 'black', n: 1, x: 120, y: 50 }] });
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toContain('players[0].x');
  });

  it('lehnt unbekannte Team- und Pfeiltypen ab', () => {
    const r = validateDiagramData({
      players: [{ team: 'lila', n: 1, x: 10, y: 10 }],
      arrows: [{ type: 'teleport', from: { x: 0, y: 0 }, to: { x: 10, y: 10 } }],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toContain('team');
    expect(r.errors.join(' ')).toContain('arrows[0].type');
  });
});

describe('DiagramRenderer', () => {
  it('rendert ein Diagramm als beschriftetes SVG-Bild', () => {
    const d = exampleDiagrams[3]; // Torschuss mit TW, Trainer, Linie
    render(<DiagramRenderer data={d.data} altText={d.alt} caption={d.caption} />);
    expect(screen.getByRole('img', { name: d.alt })).toBeInTheDocument();
    expect(screen.getByText(d.caption)).toBeInTheDocument();
    expect(screen.getByText('TW')).toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('zeigt bei ungültigen Daten einen Hinweis statt zu crashen', () => {
    render(<DiagramRenderer data={'{kaputt'} />);
    expect(screen.getByRole('note')).toHaveTextContent(/keine gültige Grafik/i);
  });

  it('rendert alle sechs Beispiele ohne Fehler', () => {
    exampleDiagrams.forEach((d) => {
      const { unmount } = render(<DiagramRenderer data={d.data} altText={d.alt} />);
      expect(screen.getByRole('img', { name: d.alt })).toBeInTheDocument();
      unmount();
    });
  });

  it('startet und stoppt die Ablauf-Animation über den Play-Button', async () => {
    const { fireEvent } = await import('@testing-library/react');
    const d = exampleDiagrams[1]; // Passquadrat mit 2 Pfeilen
    const { container } = render(<DiagramRenderer data={d.data} altText={d.alt} />);
    expect(container.querySelectorAll('animateMotion')).toHaveLength(0);
    const btn = screen.getByRole('button', { name: /Ablauf abspielen/i });
    fireEvent.click(btn);
    expect(container.querySelectorAll('animateMotion')).toHaveLength(2);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(btn);
    expect(container.querySelectorAll('animateMotion')).toHaveLength(0);
  });

  it('zeigt keinen Play-Button, wenn keine Pfeile vorhanden sind', () => {
    render(<DiagramRenderer data={{ players: [{ team: 'black', n: 1, x: 50, y: 50 }] }} />);
    expect(screen.queryByRole('button', { name: /Ablauf/i })).not.toBeInTheDocument();
  });
});
