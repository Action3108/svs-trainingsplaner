import Diagram from './diagram/Diagram.jsx';

/**
 * Druck-/PDF-Ansicht (DIN A4): enthält die KOMPLETTE Einheit mit allen
 * Details – unabhängig von der gestrafften Kartenansicht am Bildschirm.
 * Am Bildschirm unsichtbar (CSS), im Druck die einzige sichtbare Ansicht.
 */

function P({ t, x }) {
  if (!String(x ?? '').trim()) return null;
  return (
    <p>
      <strong>{t}: </strong>
      {x}
    </p>
  );
}

export default function PrintView({ plan, inputs }) {
  if (!plan?.ok || !inputs) return null;
  const today = new Date().toLocaleDateString('de-DE');
  return (
    <section className="svs-print" aria-hidden="true">
      <header className="svs-print__head">
        <img
          src={`${import.meta.env.BASE_URL}assets/sv-schoening-logo.png`}
          alt=""
        />
        <div>
          <h1>SV Schöning Trainingsplaner</h1>
          <p>SV Schöning 1926 e.V. · erstellt am {today}</p>
        </div>
      </header>

      <p className="svs-print__meta">
        <strong>
          {inputs.ageGroup}-Jugend · Schwerpunkt {inputs.focus} ·{' '}
          {inputs.players} Spieler · {plan.totalDuration} Minuten
        </strong>
      </p>
      <P t="Material gesamt" x={plan.equipment.join(', ')} />
      <P
        t="Umbauten"
        x={
          plan.rebuilds === 0
            ? 'keine – ein Grundaufbau für die gesamte Einheit'
            : plan.rebuildChanges.map((c) => `${c.from} → ${c.to}`).join(' · ')
        }
      />

      {plan.phases.map((p) => {
        const e = p.exercise;
        const org = p.organization;
        return (
          <article key={p.phase} className="svs-print__phase">
            <h2>
              {p.label}: {e.title} ({p.duration} min)
            </h2>
            <div className="svs-print__diagram">
              <Diagram
                data={e.diagram?.data}
                altText={e.diagram?.diagramAltText || `Übungsgrafik: ${e.title}`}
              />
            </div>
            <P t="Trainingsziel" x={e.objective} />
            <P
              t="Mannschaften"
              x={`${inputs.players} Spieler · ${org.teamsPerField}${
                org.fields > 1 ? ` · ${org.fields} Felder` : ''
              }${org.goalkeepers > 0 ? ` · ${org.goalkeepers} Torhüter` : ''}`}
            />
            {org.oddPlayerHint && <P t="Ungerade Spielerzahl" x={org.oddPlayerHint} />}
            <P t="Aufbau" x={e.setup} />
            <P t="Material" x={(e.equipment ?? []).join(', ')} />
            <P t="Ablauf" x={e.procedure} />
            <P t="Regeln" x={e.rules} />
            <P t="Coachingpunkte" x={e.coachingPoints} />
            <P t="Kommandos" x={e.coachingCommands} />
            <P t="Häufige Fehler" x={e.commonMistakes} />
            <P t="Korrekturen" x={e.corrections} />
            <P t="Leichtere Variante" x={e.regression} />
            <P t="Schwierigere Variante" x={e.progression} />
            <P t="Übergang" x={e.transitionHints} />
            {e.sourceTitle && (
              <P t="Quelle" x={`${e.sourceTitle}${e.sourceUrl ? ` – ${e.sourceUrl}` : ''}`} />
            )}
            {e.videoVerified && e.videoUrl && <P t="Video" x={e.videoUrl} />}
          </article>
        );
      })}
    </section>
  );
}
