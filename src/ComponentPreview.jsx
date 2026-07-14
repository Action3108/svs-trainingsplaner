import { useState } from 'react';
import Header from './components/ui/Header.jsx';
import Button from './components/ui/Button.jsx';
import SelectField from './components/ui/SelectField.jsx';
import TrainingCard from './components/ui/TrainingCard.jsx';
import Dialog from './components/ui/Dialog.jsx';
import BottomSheet from './components/ui/BottomSheet.jsx';

export default function ComponentPreview() {
  const [age, setAge] = useState('E');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div>
      <Header subtitle="Komponenten-Vorschau (Designsystem)" />
      <div className="app">
        <h2>Buttons</h2>
        <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button>Training erstellen</Button>
          <Button variant="secondary">Übung austauschen</Button>
          <Button variant="ghost">Rückgängig</Button>
          <Button variant="danger">Verwerfen</Button>
          <Button disabled>Deaktiviert</Button>
        </p>
        <Button block>PDF erstellen (volle Breite)</Button>

        <h2>Formularfeld</h2>
        <SelectField
          label="Jugend"
          hint="Altersklasse der Mannschaft"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          options={[
            { value: 'G', label: 'G-Junioren' },
            { value: 'F', label: 'F-Junioren' },
            { value: 'E', label: 'E-Junioren' },
            { value: 'D', label: 'D-Junioren' },
          ]}
        />

        <h2>Trainingskarte</h2>
        <TrainingCard
          phaseLabel="Aufwärmen 1"
          title="Dribbelgarten"
          meta="10 min · 10 Spieler"
          defaultOpen
        >
          <h4 className="svs-card__section-title">Trainingsziel</h4>
          <p>Viele Ballkontakte, enge Ballführung, Kopf heben.</p>
          <h4 className="svs-card__section-title">Coachingpunkte</h4>
          <p>Ball eng am Fuß · Blick vom Ball lösen · beide Füße nutzen</p>
        </TrainingCard>
        <TrainingCard phaseLabel="Spielform 1" title="3 gegen 3 auf vier Minitore" meta="15 min · 12 Spieler">
          <p>Eingeklappter Zustand – aufklappen zum Testen.</p>
        </TrainingCard>

        <h2>Hinweis</h2>
        <div className="svs-note">
          Umbau nötig: Minitore von der Grundlinie an die Seiten versetzen.
        </div>

        <h2>Dialog &amp; Bottom Sheet</h2>
        <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            Dialog öffnen
          </Button>
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Bottom Sheet öffnen
          </Button>
        </p>

        <Dialog
          open={dialogOpen}
          title="Übung ersetzen?"
          onClose={() => setDialogOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={() => setDialogOpen(false)}>Ersetzen</Button>
            </>
          }
        >
          <p>„Dribbelgarten“ wird durch „Kettenfänger mit Ball“ ersetzt.</p>
        </Dialog>

        <BottomSheet open={sheetOpen} title="Alternative Übungen" onClose={() => setSheetOpen(false)}>
          <TrainingCard phaseLabel="Aufwärmen 1" title="Kettenfänger mit Ball" meta="10 min">
            <p>Vorschau der Alternative.</p>
          </TrainingCard>
          <Button block onClick={() => setSheetOpen(false)}>
            Auswählen
          </Button>
        </BottomSheet>
      </div>
    </div>
  );
}
