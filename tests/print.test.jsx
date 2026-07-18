import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildFileName, printTraining } from '../src/logic/share.js';
import PrintView from '../src/components/PrintView.jsx';
import TrainingPlan from '../src/components/TrainingPlan.jsx';
import { generateTraining } from '../src/logic/generator.js';
import fallbackDb from '../src/data/fallbackExercises.json';

const inputs = { ageGroup: 'E', duration: 90, focus: 'Passspiel', players: 8 };
const plan = generateTraining(fallbackDb, inputs);

afterEach(() => vi.unstubAllGlobals());

describe('Dateiname & Druck', () => {
  it('baut sprechende Dateinamen', () => {
    const name = buildFileName(
      { ageGroup: 'D', focus: '1 gegen 1' },
      new Date('2026-07-13T12:00:00Z')
    );
    expect(name).toBe('SVS_Training_D-Jugend_1-gegen-1_2026-07-13');
  });

  it('setzt den Dokumenttitel für das PDF und stellt ihn danach wieder her', () => {
    const print = vi.fn();
    vi.stubGlobal('print', print);
    document.title = 'App';
    printTraining(inputs);
    expect(print).toHaveBeenCalled();
    expect(document.title).toMatch(/^SVS_Training_E-Jugend_Passspiel_/);
    fireEvent(window, new Event('afterprint'));
    expect(document.title).toBe('App');
  });
});

describe('PrintView', () => {
  it('enthält alle sechs Phasen mit Diagrammen und vollständigen Details', () => {
    const { container } = render(<PrintView plan={plan} inputs={inputs} />);
    expect(container.querySelectorAll('.svs-print__phase')).toHaveLength(6);
    expect(container.querySelectorAll('svg.dgm-stage')).toHaveLength(6);
    // Details, die am Bildschirm im Infos-Sheet stecken, stehen hier direkt:
    expect(screen.getAllByText(/Leichtere Variante/).length).toBe(6);
    expect(screen.getAllByText(/Mannschaften/).length).toBe(6);
    expect(screen.getByText(/Material gesamt/)).toBeInTheDocument();
    expect(screen.getByText(/erstellt am/)).toBeInTheDocument();
  });

  it('rendert nichts ohne gültigen Plan', () => {
    const { container } = render(<PrintView plan={{ ok: false }} inputs={inputs} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('Aktionen im Plan', () => {
  it('bietet genau eine Hauptaktion (PDF/Druck); Teilen nur mit Web-Share-Unterstützung', () => {
    const { unmount } = render(
      <TrainingPlan plan={plan} inputs={inputs} onVariant={() => {}} />
    );
    expect(screen.getByRole('button', { name: /PDF speichern \/ drucken/ })).toBeInTheDocument();
    // kein paralleler Drucken-Button mit gleicher Funktion mehr
    expect(screen.queryByRole('button', { name: /^Drucken$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Teilen$/ })).not.toBeInTheDocument();
    unmount();

    vi.stubGlobal('navigator', { ...navigator, share: vi.fn() });
    render(<TrainingPlan plan={plan} inputs={inputs} onVariant={() => {}} />);
    expect(screen.getByRole('button', { name: /^Teilen$/ })).toBeInTheDocument();
  });
});
