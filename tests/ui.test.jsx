import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../src/components/ui/Button.jsx';
import SelectField from '../src/components/ui/SelectField.jsx';
import TrainingCard from '../src/components/ui/TrainingCard.jsx';
import BottomSheet from '../src/components/ui/BottomSheet.jsx';

describe('Button', () => {
  it('rendert Varianten als Klassen', () => {
    render(<Button variant="secondary">Test</Button>);
    const btn = screen.getByRole('button', { name: 'Test' });
    expect(btn).toHaveClass('svs-btn', 'svs-btn--secondary');
  });

  it('hat type=button als Standard', () => {
    render(<Button>OK</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});

describe('SelectField', () => {
  it('verknüpft Label und Auswahl, meldet Änderungen', () => {
    const onChange = vi.fn();
    render(
      <SelectField
        label="Jugend"
        value="E"
        onChange={onChange}
        options={[
          { value: 'E', label: 'E-Junioren' },
          { value: 'D', label: 'D-Junioren' },
        ]}
      />
    );
    const select = screen.getByLabelText('Jugend');
    fireEvent.change(select, { target: { value: 'D' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('zeigt Fehler mit role=alert', () => {
    render(<SelectField label="Dauer" options={[]} error="Pflichtfeld" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Pflichtfeld');
  });
});

describe('TrainingCard', () => {
  it('zeigt Phase, Titel und Inhalt', () => {
    render(
      <TrainingCard phaseLabel="Aufwärmen 1" title="Dribbelgarten" meta="10 min" defaultOpen>
        <p>Inhalt</p>
      </TrainingCard>
    );
    expect(screen.getByText('Aufwärmen 1')).toBeInTheDocument();
    expect(screen.getByText('Dribbelgarten')).toBeInTheDocument();
    expect(screen.getByText('Inhalt')).toBeInTheDocument();
  });
});

describe('BottomSheet', () => {
  it('rendert nur bei open=true und schließt per Escape', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <BottomSheet open={false} title="Alternativen" onClose={onClose} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<BottomSheet open title="Alternativen" onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
