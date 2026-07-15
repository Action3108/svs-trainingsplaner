import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Diagram from '../src/components/diagram/Diagram.jsx';
import DiagramCard from '../src/components/diagram/DiagramCard.jsx';
import { motionPath } from '../src/components/diagram/MotionLine.jsx';
import { sy, VB_H } from '../src/components/diagram/scale.js';
import { exampleDiagrams } from '../src/data/exampleDiagrams.js';

describe('Diagram (V3-Renderer)', () => {
  it('rendert alle sechs Beispiele als beschriftetes Bild', () => {
    exampleDiagrams.forEach((d) => {
      const { unmount } = render(<Diagram data={d.data} altText={d.alt} />);
      expect(screen.getByRole('img', { name: d.alt })).toBeInTheDocument();
      unmount();
    });
  });

  it('zeigt bei ungültigen Daten eine Fehlerkarte', () => {
    render(<Diagram data={'{kaputt'} />);
    expect(screen.getByRole('note')).toHaveTextContent(/keine gültige Grafik/i);
  });

  it('skaliert Y-Koordinaten ins 16:10-Format', () => {
    expect(VB_H).toBeCloseTo(62.5);
    expect(sy(100)).toBeCloseTo(62.5);
    expect(sy(50)).toBeCloseTo(31.25);
  });

  it('hält Abstand zwischen Pfeilenden und Symbolen', () => {
    const path = motionPath({ type: 'pass', from: { x: 0, y: 50 }, to: { x: 100, y: 50 } });
    const [, x1, , , x2] = path.match(/M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+)/).map(Number).slice(0);
    expect(x1).toBeGreaterThan(3); // verkürzt am Start
    // Ende ebenfalls verkürzt:
    const coords = path.match(/[\d.]+/g).map(Number);
    expect(coords[2]).toBeLessThan(97);
  });
});

describe('DiagramCard', () => {
  const d = exampleDiagrams[4]; // 3 gegen 3 mit Zielzone

  it('zeigt Titel, Übungsart und Meta-Chips', () => {
    render(<DiagramCard title={d.title} type={d.type} meta={d.meta} data={d.data} altText={d.alt} />);
    expect(screen.getByRole('heading', { name: d.title })).toBeInTheDocument();
    expect(screen.getByText(d.type)).toBeInTheDocument();
    expect(screen.getByText(d.meta.players)).toBeInTheDocument();
    expect(screen.getByText(d.meta.goals)).toBeInTheDocument();
  });

  it('hat eine einklappbare Legende und einen Vollbild-Button', () => {
    render(<DiagramCard title={d.title} data={d.data} altText={d.alt} />);
    expect(screen.getByText(/Legende anzeigen/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /vergrößern/i })).toBeInTheDocument();
  });

  it('startet die Ablauf-Animation über den Play-Button (Passquadrat)', () => {
    const pq = exampleDiagrams[1]; // Passquadrat: Pass + Laufweg
    const { container } = render(
      <DiagramCard title={pq.title} type={pq.type} data={pq.data} altText={pq.alt} />
    );
    expect(container.querySelectorAll('animateMotion')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Ablauf abspielen/i }));
    expect(container.querySelectorAll('animateMotion').length).toBeGreaterThan(0);
    // Laufweg-/Passpfeile sind während der Animation ausgeblendet:
    expect(container.querySelectorAll('path[marker-end]')).toHaveLength(0);
  });

  it('verkettet die Aktionen sequenziell (begin = vorherige.end)', () => {
    const pq = exampleDiagrams[1];
    const { container } = render(
      <DiagramCard title={pq.title} type={pq.type} data={pq.data} altText={pq.alt} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Ablauf abspielen/i }));
    const anims = [...container.querySelectorAll('animateMotion')];
    expect(anims.some((a) => a.getAttribute('begin')?.includes('dgm-seq-0.end'))).toBe(true);
    // keine unendliche Parallel-Wiederholung mehr:
    expect(anims.every((a) => a.getAttribute('repeatCount') !== 'indefinite')).toBe(true);
  });

  it('bewegt beim Laufweg den Spieler selbst (Animation an der Spielergruppe)', () => {
    const pq = exampleDiagrams[1];
    const { container } = render(
      <DiagramCard title={pq.title} type={pq.type} data={pq.data} altText={pq.alt} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Ablauf abspielen/i }));
    // Mindestens eine Animation liegt in einer Gruppe mit Spielerkreis (r = 3.8)
    const playerAnim = [...container.querySelectorAll('g > animateMotion')].some((a) =>
      a.parentElement?.querySelector('circle[r="3.8"]')
    );
    expect(playerAnim).toBe(true);
  });

  it('bietet für Spielform und Abschlussspiel keine Animation an', () => {
    [exampleDiagrams[4], exampleDiagrams[5]].forEach((ex) => {
      const { unmount } = render(
        <DiagramCard title={ex.title} type={ex.type} data={ex.data} altText={ex.alt} />
      );
      expect(screen.queryByRole('button', { name: /Ablauf abspielen/i })).not.toBeInTheDocument();
      unmount();
    });
  });

  it('rückt Zielzonen minimal ins Feld ein', () => {
    const sf = exampleDiagrams[4]; // Zielzone x:80 w:20 h:100
    const { container } = render(<Diagram data={sf.data} altText={sf.alt} />);
    const zone = container.querySelector('rect[fill="url(#dgm-zone-hatch)"]');
    const x = Number(zone.getAttribute('x'));
    const w = Number(zone.getAttribute('width'));
    const y = Number(zone.getAttribute('y'));
    const h = Number(zone.getAttribute('height'));
    expect(x + w).toBeLessThan(100); // rechte Kante im Feld
    expect(y).toBeGreaterThan(0); // obere Kante im Feld
    expect(y + h).toBeLessThan(62.5); // untere Kante im Feld
  });

  it('zeigt bei ungültigen Daten weder Play- noch Vollbild-Button', () => {
    render(<DiagramCard title="Defekt" data={'{kaputt'} />);
    expect(screen.queryByRole('button', { name: /Ablauf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /vergrößern/i })).not.toBeInTheDocument();
  });
});
