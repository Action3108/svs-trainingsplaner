import SelectField from './ui/SelectField.jsx';
import Stepper from './ui/Stepper.jsx';
import Button from './ui/Button.jsx';

/**
 * Startbereich: Jugend, Trainingsdauer, Schwerpunkt und Spielerzahl.
 * Die Auswahllisten kommen aus dem Google Sheet (Lists-Tab);
 * min/max der Spielerzahl aus den Settings.
 */
export default function TrainingForm({ db, value, onChange, onSubmit, busy = false }) {
  const lists = db?.lists ?? {};
  const ages = lists.ageGroups ?? [];
  const durations = lists.durations ?? [];
  const focuses = lists.focusAreas ?? [];
  const minPlayers = Number(db?.settings?.minPlayers ?? 4);
  const maxPlayers = Number(db?.settings?.maxPlayers ?? 30);

  return (
    <form
      className="svs-form"
      aria-label="Training zusammenstellen"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <SelectField
        label="Jugend"
        hint="Altersklasse der Mannschaft"
        options={ages}
        value={value.ageGroup}
        onChange={(e) => onChange({ ...value, ageGroup: e.target.value })}
      />
      <SelectField
        label="Trainingsdauer"
        options={durations}
        value={String(value.duration)}
        onChange={(e) => onChange({ ...value, duration: Number(e.target.value) })}
      />
      <SelectField
        label="Schwerpunkt"
        options={focuses}
        value={value.focus}
        onChange={(e) => onChange({ ...value, focus: e.target.value })}
      />
      <Stepper
        label="Spielerzahl"
        value={value.players}
        min={minPlayers}
        max={maxPlayers}
        onChange={(players) => onChange({ ...value, players })}
      />
      <Button type="submit" block disabled={busy}>
        Training erstellen
      </Button>
    </form>
  );
}
