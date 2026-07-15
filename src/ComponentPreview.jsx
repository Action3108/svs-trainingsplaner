import { useState } from 'react';
import Header from './components/ui/Header.jsx';
import Button from './components/ui/Button.jsx';
import SelectField from './components/ui/SelectField.jsx';
import TrainingCard from './components/ui/TrainingCard.jsx';
import Dialog from './components/ui/Dialog.jsx';
import BottomSheet from './components/ui/BottomSheet.jsx';
import Chip from './components/ui/Chip.jsx';
import Stepper from './components/ui/Stepper.jsx';
import DiagramRenderer from './components/DiagramRenderer.jsx';
import DiagramCard from './components/diagram/DiagramCard.jsx';
import { exampleDiagrams } from './data/exampleDiagrams.js';

export default function ComponentPreview() {
  const [age, setAge] = useState('E');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [theme, setTheme] = useState('v2');
  const [players, setPlayers] = useState(14);
  const [focus, setFocus] = useState(['Passspiel']);

  const toggleFocus = (name) => (on) =>
    setFocus((f) => (on ? [...f, name] : f.filter((x) => x !== name)));

  return (
    <div className="theme-scope" data-theme={theme === 'v2' ? 'v2' : undefined}>
      <div className="app no-print" role="radiogroup" aria-label="Designsystem wählen" style={{ paddingBottom: 0, display: 'flex', gap: 12 }}>
        <Button variant={theme === 'v1' ? 'primary' : 'secondary'} onClick={() => setTheme('v1')} aria-pressed={theme === 'v1'}>
          Design V1 (Anthrazit)
        </Button>
        <Button variant={theme === 'v2' ? 'primary' : 'secondary'} onClick={() => setTheme('v2')} aria-pressed={theme === 'v2'}>
          Design V2 (Coaching Workspace)
        </Button>
      </div>
      <Header subtitle="Komponenten-Vorschau (Designsystem)" />
      <div className="app">
        <h2>Buttons und Zustände</h2>
        <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button>Training erstellen</Button>
          <Button variant="secondary">Übung austauschen</Button>
          <Button variant="ghost">Rückgängig</Button>
          <Button variant="danger">Verwerfen</Button>
          <Button variant="accent">Premium-Akzent (nur V2)</Button>
          <Button disabled>Deaktiviert</Button>
          <Button className="svs-btn--loading" aria-busy="true" aria-label="Lädt">
            Lädt
          </Button>
        </p>
        <Button block>PDF erstellen (volle Breite)</Button>

        <h2>Auswahl-Chips (Schwerpunkt)</h2>
        <p style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Passspiel', 'Dribbling', 'Torschuss', '1 gegen 1'].map((s) => (
            <Chip key={s} selected={focus.includes(s)} onToggle={toggleFocus(s)}>
              {s}
            </Chip>
          ))}
          <Chip disabled>Kopfball (deaktiviert)</Chip>
        </p>

        <h2>Spielerzahl-Stepper</h2>
        <Stepper value={players} onChange={setPlayers} min={4} max={30} />

        <h2>Hinweis- und Statuskarten</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="svs-note svs-note--info">Daten aktualisiert am 14.07.2026, 18:32 Uhr.</div>
          <div className="svs-note svs-note--warn">Umbau nötig: Minitore an die Seiten versetzen.</div>
          <div className="svs-note svs-note--error">Keine passende Übung für 4 Spieler in dieser Phase gefunden.</div>
          <div className="svs-note svs-note--success">Training erstellt – alle sechs Phasen vollständig.</div>
        </div>

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

        <h2>Übungsdiagramme V3 – Moderne Spielfeldkarte</h2>
        {exampleDiagrams.map((d, i) => (
          <DiagramCard
            key={d.id}
            title={d.title}
            type={d.type}
            meta={d.meta}
            description={d.description}
            data={d.data}
            altText={d.alt}
            defaultLegendOpen={i === 0}
          />
        ))}

        <h3>Mobile-Darstellung (360 px)</h3>
        <div style={{ maxWidth: 360 }}>
          <DiagramCard
            title={exampleDiagrams[4].title}
            type={exampleDiagrams[4].type}
            meta={exampleDiagrams[4].meta}
            description={exampleDiagrams[4].description}
            data={exampleDiagrams[4].data}
            altText={exampleDiagrams[4].alt}
          />
        </div>

        <h3>Fehlerfall (ungültige Daten)</h3>
        <DiagramCard title="Defekte Übung" data={'{kaputt'} />

        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>
            Vergleich: bisheriger Renderer (V2)
          </summary>
          {exampleDiagrams.map((d) => (
            <div key={`old-${d.id}`} style={{ marginBottom: 24, maxWidth: 480 }}>
              <DiagramRenderer data={d.data} caption={d.caption} altText={d.alt} />
            </div>
          ))}
        </details>

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
