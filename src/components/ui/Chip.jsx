/**
 * Auswahl-Chip (Toggle). Ausgewählt-Zustand über aria-pressed –
 * sichtbar durch Füllung UND Häkchen (nicht nur Farbe).
 */
export default function Chip({ selected = false, onToggle, disabled = false, children, ...rest }) {
  return (
    <button
      type="button"
      className="svs-chip"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onToggle?.(!selected)}
      {...rest}
    >
      {children}
    </button>
  );
}
