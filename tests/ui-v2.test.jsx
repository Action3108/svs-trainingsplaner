import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Chip from '../src/components/ui/Chip.jsx';
import Stepper from '../src/components/ui/Stepper.jsx';

describe('Chip', () => {
  it('meldet Auswahl über aria-pressed und onToggle', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<Chip selected={false} onToggle={onToggle}>Passspiel</Chip>);
    const chip = screen.getByRole('button', { name: 'Passspiel' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(chip);
    expect(onToggle).toHaveBeenCalledWith(true);
    rerender(<Chip selected onToggle={onToggle}>Passspiel</Chip>);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('ist im deaktivierten Zustand nicht klickbar', () => {
    const onToggle = vi.fn();
    render(<Chip disabled onToggle={onToggle}>Kopfball</Chip>);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe('Stepper', () => {
  it('erhöht und verringert innerhalb der Grenzen', () => {
    const onChange = vi.fn();
    render(<Stepper value={14} min={4} max={30} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /erhöhen/i }));
    expect(onChange).toHaveBeenCalledWith(15);
    fireEvent.click(screen.getByRole('button', { name: /verringern/i }));
    expect(onChange).toHaveBeenCalledWith(13);
  });

  it('deaktiviert Minus am Minimum und begrenzt den Slider', () => {
    const onChange = vi.fn();
    render(<Stepper value={4} min={4} max={30} onChange={onChange} />);
    expect(screen.getByRole('button', { name: /verringern/i })).toBeDisabled();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '99' } });
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it('zeigt den Wert mit Einheit an', () => {
    render(<Stepper value={14} onChange={() => {}} />);
    expect(screen.getByText('14 Spieler')).toBeInTheDocument();
  });
});
