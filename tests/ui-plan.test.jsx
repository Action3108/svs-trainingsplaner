import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../src/App.jsx';
import TrainingPlan, { RebuildStatus } from '../src/components/TrainingPlan.jsx';
import { generateTraining, PHASE_LABELS } from '../src/logic/generator.js';
import fallbackDb from '../src/data/fallbackExercises.json';

// Offline: App fällt auf die eingebaute Fallback-Datenbank zurück (6 Übungen).
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
  localStorage.clear();
});

async function renderAppReady() {
  render(<App />);
  await screen.findByText(/eingebaute Beispielübungen/i);
  // Formular erscheint einen Render-Tick nach dem Datenstatus
  await screen.findByLabelText(/Jugend/i);
}

describe('Trainingsformular', () => {
  it('zeigt Jugend, Dauer, Schwerpunkt und Spielerzahl mit Daten aus der Datenbank', async () => {
    await renderAppReady();
    expect(screen.getByLabelText(/Jugend/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Trainingsdauer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Schwerpunkt/i)).toBeInTheDocument();
    expect(screen.getByText(/14 Spieler/)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'E-Junioren' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Training erstellen/i })).toBeInTheDocument();
  });

  it('Spielerzahl per Plus/Minus und Schieberegler bedienbar', async () => {
    await renderAppReady();
    fireEvent.click(screen.getByRole('button', { name: /erhöhen/i }));
    expect(screen.getByText(/15 Spieler/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });
    expect(screen.getByText(/8 Spieler/)).toBeInTheDocument();
  });
});

describe('Training erstellen (Integration)', () => {
  it('erzeugt sechs aufklappbare Karten mit Diagrammen und Zusammenfassung', async () => {
    await renderAppReady();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: /Training erstellen/i }));

    Object.values(PHASE_LABELS).forEach((label) => {
      // Label erscheint auf der Karte (und ggf. in der Diagrammkarte)
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/Gesamtdauer 90 min/)).toBeInTheDocument();
    // jede Karte hat genau eine sichtbare Übungsgrafik
    // (die zweite SVG je Karte liegt im geschlossenen Vollbild-Dialog)
    expect(document.body.querySelectorAll('.svs-card .dgm-card > svg.dgm-stage').length).toBe(6);
  });

  it('zeigt bei unmöglicher Kombination eine klare Fehlermeldung', async () => {
    await renderAppReady();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /Training erstellen/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/keine passende Übung/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/Tipp/i);
  });
});

describe('TrainingPlan-Komponente', () => {
  const inputs = { ageGroup: 'E', duration: 90, focus: 'Passspiel', players: 8 };

  it('zeigt die Umbauampel in allen drei Stufen', () => {
    const { rerender } = render(<RebuildStatus rebuilds={0} />);
    expect(screen.getByText(/Kein Umbau nötig/)).toBeInTheDocument();
    rerender(<RebuildStatus rebuilds={1} changes={[{ from: 'a', to: 'b' }]} />);
    expect(screen.getByText(/1 Umbau nötig: a → b/)).toBeInTheDocument();
    rerender(
      <RebuildStatus rebuilds={2} changes={[{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }]} />
    );
    expect(screen.getByText(/2 Umbauten nötig/)).toBeInTheDocument();
  });

  it('zeigt Kerninfos direkt und die weiteren Details erst im Infos-Sheet', () => {
    const plan = generateTraining(fallbackDb, inputs);
    const { unmount } = render(<TrainingPlan plan={plan} inputs={inputs} onVariant={() => {}} />);
    // Kerninfos direkt auf der Karte:
    expect(screen.getAllByText('Trainingsziel').length).toBe(6);
    expect(screen.getAllByText('Aufbau').length).toBe(6);
    expect(screen.getAllByText('Coachingpunkte').length).toBe(6);
    // Details erst nach Klick auf „Infos“:
    expect(screen.queryByText('Leichtere Variante')).not.toBeInTheDocument();
    expect(screen.queryByText('Mannschaftseinteilung')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /^Infos$/ })[0]);
    expect(screen.getByText('Leichtere Variante')).toBeInTheDocument();
    expect(screen.getByText('Mannschaftseinteilung')).toBeInTheDocument();
    expect(screen.getByText('Material')).toBeInTheDocument();
    unmount();
  });

  it('zeigt den YouTube-Link nur bei verifiziertem Video (im Infos-Sheet)', () => {
    const plan = generateTraining(fallbackDb, inputs);
    // Kein Fallback-Video ist verifiziert → kein Link
    const first = render(<TrainingPlan plan={plan} inputs={inputs} onVariant={() => {}} />);
    fireEvent.click(screen.getAllByRole('button', { name: /^Infos$/ })[0]);
    expect(screen.queryByText(/als Video ansehen/)).not.toBeInTheDocument();
    first.unmount();

    // Mit verifiziertem Video → Link erscheint und öffnet extern
    const withVideo = {
      ...plan,
      phases: plan.phases.map((p, i) =>
        i === 0
          ? {
              ...p,
              exercise: {
                ...p.exercise,
                videoVerified: true,
                videoUrl: 'https://youtube.com/watch?v=x',
              },
            }
          : p
      ),
    };
    render(<TrainingPlan plan={withVideo} inputs={inputs} onVariant={() => {}} />);
    fireEvent.click(screen.getAllByRole('button', { name: /^Infos$/ })[0]);
    const link = screen.getByRole('link', { name: /als Video ansehen/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('zeigt Mannschaftseinteilung und Hinweis bei ungerader Spielerzahl im Infos-Sheet', () => {
    const plan = generateTraining(fallbackDb, { ...inputs, players: 7 });
    render(<TrainingPlan plan={plan} inputs={{ ...inputs, players: 7 }} onVariant={() => {}} />);
    fireEvent.click(screen.getAllByRole('button', { name: /^Infos$/ })[0]);
    expect(screen.getAllByText(/7 Spieler ·/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ungerade Spielerzahl/).length).toBeGreaterThan(0);
  });

  it('bietet „Alternative Einheit“ nur an, wenn es Varianten gibt', () => {
    const plan = generateTraining(fallbackDb, inputs); // 6 Übungen → genau 1 Kombination
    render(<TrainingPlan plan={plan} inputs={inputs} onVariant={() => {}} />);
    expect(screen.queryByRole('button', { name: /Alternative Einheit/ })).not.toBeInTheDocument();
  });
});
