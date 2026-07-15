import { useId } from 'react';

/**
 * Spielerzahl-Stepper: Minus/Plus-Buttons (≥48px) plus Schieberegler.
 * Vollständig per Touch, Maus und Tastatur bedienbar.
 */
export default function Stepper({
  label = 'Spielerzahl',
  value,
  min = 4,
  max = 30,
  step = 1,
  unit = 'Spieler',
  onChange,
  disabled = false,
}) {
  const id = useId();
  const clamp = (v) => Math.min(max, Math.max(min, v));
  const set = (v) => onChange?.(clamp(v));

  return (
    <div className="svs-stepper">
      <label className="svs-field__label" htmlFor={id}>
        {label}
      </label>
      <div className="svs-stepper__row">
        <button
          type="button"
          className="svs-stepper__btn"
          aria-label={`${label} verringern`}
          onClick={() => set(value - step)}
          disabled={disabled || value <= min}
        >
          −
        </button>
        <output className="svs-stepper__value" htmlFor={id} aria-live="polite">
          {value} {unit}
        </output>
        <button
          type="button"
          className="svs-stepper__btn"
          aria-label={`${label} erhöhen`}
          onClick={() => set(value + step)}
          disabled={disabled || value >= max}
        >
          +
        </button>
      </div>
      <input
        id={id}
        className="svs-stepper__range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => set(Number(e.target.value))}
        aria-valuetext={`${value} ${unit}`}
      />
    </div>
  );
}
