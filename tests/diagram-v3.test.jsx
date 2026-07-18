import { render, screen } from '@testing-library/react';
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
    const [, x1] = path.match(/M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+)/).map(Number).slice(0);
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

  it('zeigt keinen Animations-Button mehr (Entscheidung 2026-07-17)', () => {
    exampleDiagrams.forEach((ex) => {
      const { container, unmount } = render(
        <DiagramCard title={ex.title} type={ex.type} data={ex.data} altText={ex.alt} />
      );
      expect(screen.queryByRole('button', { name: /Ablauf|Animation/i })).not.toBeInTheDocument();
      expect(container.querySelectorAll('animateMotion')).toHaveLength(0);
      unmount();
    });
  });

  it('blendet Laufwege aus, Pass-/Dribbel-/Schusswege bleiben sichtbar', () => {
    const data = {
      players: [{ team: 'black', n: 1, x: 10, y: 10 }],
      balls: [{ x: 12, y: 12 }],
      arrows: [
        { type: 'run', from: { x: 10, y: 10 }, to: { x: 40, y: 40 } },
        { type: 'run', from: { x: 40, y: 40 }, to: { x: 70, y: 20 } },
        { type: 'pass', from: { x: 12, y: 12 }, to: { x: 80, y: 60 } },
      ],
    };
    const { container } = render(<Diagram data={data} altText="Lauftest" />);
    // Nur der Pass-Pfeil wird gezeichnet, die beiden Laufwege nicht:
    expect(container.querySelectorAll('path[marker-end]')).toHaveLength(1);
  });

  it('zeigt in der Legende keinen Laufweg-Eintrag mehr', () => {
    const d5 = exampleDiagrams[0];
    render(<DiagramCard title={d5.title} data={d5.data} altText={d5.alt} defaultLegendOpen />);
    expect(screen.queryByText(/^Laufweg$/)).not.toBeInTheDocument();
    expect(screen.getByText(/^Pass$/)).toBeInTheDocument();
  });

  it('blendet immer mindestens einen Ball ein (Ball-Garantie)', () => {
    // Daten ohne Ball → Fallback-Ball neben dem ersten Spieler
    const data = { players: [{ team: 'black', n: 1, x: 30, y: 30 }] };
    const { container } = render(<Diagram data={data} altText="Balltest" />);
    // Der Ball-Glyph enthält das zentrale Fünfeck (polygon); ohne Hütchen/Tore
    // im Testdatensatz stammt jedes Polygon vom Ball.
    expect(container.querySelectorAll('polygon').length).toBeGreaterThan(0);
  });

  it('zeigt alle Bälle, wenn laut Daten jeder Spieler einen Ball hat', () => {
    const data = {
      players: [
        { team: 'black', n: 1, x: 20, y: 20 },
        { team: 'black', n: 2, x: 60, y: 60 },
      ],
      balls: [
        { x: 22, y: 22 },
        { x: 62, y: 62 },
      ],
    };
    const { container } = render(<Diagram data={data} altText="Zwei Bälle" />);
    expect(container.querySelectorAll('polygon')).toHaveLength(2);
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
