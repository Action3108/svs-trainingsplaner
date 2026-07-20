import { useId } from 'react';

export default function SelectField({
  label,
  options = [],
  hint,
  error,
  value,
  onChange,
  ...rest
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="svs-field">
      <label className="svs-field__label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <span className="svs-field__hint" id={hintId}>
          {hint}
        </span>
      )}
      <select
        id={id}
        className="svs-field__control"
        value={value}
        onChange={onChange}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? 'true' : undefined}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={o.style}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="svs-field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
