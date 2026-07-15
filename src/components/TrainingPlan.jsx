import { useState } from 'react';
import TrainingCard from './ui/TrainingCard.jsx';
import DiagramCard from './diagram/DiagramCard.jsx';
import Diagram from './diagram/Diagram.jsx';
import BottomSheet from './ui/BottomSheet.jsx';
import Button from './ui/Button.jsx';
import { findAlternatives } from '../logic/exchange.js';
import { printTraining, canShare, shareTraining } from '../logic/share.js';

/**
 * Ergebnisbereich: Zusammenfassung, Materialliste, Umbauampel,
 * sechs aufklappbare Trainingskarten mit Diagramm, Übungsaustausch
 * sowie „Alternative Einheit“.
 *
 * Jede Karte zeigt direkt nur die Kerninfos (Trainingsziel, Aufbau,
 * Ablauf, Regeln, Coachingpunkte). Alle weiteren Details öffnen sich
 * über den „Infos“-Button in einem Bottom Sheet.
 */

function Section({ title, text }) {
  if (!String(text ?? '').trim()) return null;
  return (
    <>
      <h4 className="svs-card__section-title">{title}</h4>
      <p>{text}</p>
    </>
  );
}

/** Umbauampel: grün = kein Umbau, gelb = 1, rot = mehr. */
export function RebuildStatus({ rebuilds, changes = [] }) {
  if (rebuilds === 0) {
    return (
      <p className="svs-note svs-note--success">Kein Umbau nötig – alle Formen nutzen denselben Grundaufbau.</p>
    );
  }
  const detail = changes
    .map((c) => `${c.from} → ${c.to}`)
    .join(' · ');
  if (rebuilds === 1) {
    return <p className="svs-note svs-note--warn">1 Umbau nötig: {detail}</p>;
  }
  return <p className="svs-note svs-note--error">{rebuilds} Umbauten nötig: {detail}</p>;
}

function organizationText(org, players) {
  const parts = [`${players} Spieler`, org.teamsPerField];
  if (org.fields > 1) parts.push(`${org.fields} Felder (je ${org.playersPerField.join('/')} Spieler)`);
  if (org.goalkeepers > 0) parts.push(`${org.goalkeepers} Torhüter`);
  return parts.join(' · ');
}

/** Bottom Sheet mit allen weiteren Details einer Übung. */
function InfoSheet({ open, phase, players, onClose }) {
  if (!phase) return null;
  const e = phase.exercise;
  const org = phase.organization;
  return (
    <BottomSheet open={open} title={`Infos – ${e.title}`} onClose={onClose}>
      <Section title="Mannschaftseinteilung" text={organizationText(org, players)} />
      {org.oddPlayerHint && (
        <Section title="Ungerade Spielerzahl" text={org.oddPlayerHint} />
      )}
      <Section title="Material" text={(e.equipment ?? []).join(', ')} />
      <Section title="Kommandos" text={e.coachingCommands} />
      <Section title="Häufige Fehler" text={e.commonMistakes} />
      <Section title="Korrekturen" text={e.corrections} />
      <Section title="Leichtere Variante" text={e.regression} />
      <Section title="Schwierigere Variante" text={e.progression} />
      <Section title="Übergang zur nächsten Form" text={e.transitionHints} />
      {e.videoVerified && e.videoUrl && (
        <p>
          <a
            className="svs-btn svs-btn--secondary"
            href={e.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Übung als Video ansehen ↗
          </a>
        </p>
      )}
      {e.sourceTitle && (
        <p className="svs-card__source">
          Quelle:{' '}
          {e.sourceUrl ? (
            <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">
              {e.sourceTitle} ↗
            </a>
          ) : (
            e.sourceTitle
          )}
          {e.adaptationNote ? ` – ${e.adaptationNote}` : ''}
        </p>
      )}
    </BottomSheet>
  );
}

/** Bottom Sheet mit bis zu fünf Alternativen für eine Phase. */
function ExchangeSheet({ open, phase, alternatives, onSelect, onClose }) {
  return (
    <BottomSheet
      open={open}
      title={`Alternative für „${phase?.label ?? ''}“`}
      onClose={onClose}
    >
      {alternatives.length === 0 && (
        <p className="svs-note svs-note--info">
          Keine passende Alternative verfügbar – Filter, Spielerzahl und
          Zeitfenster lassen keine weitere Übung zu.
        </p>
      )}
      {alternatives.map(({ exercise: e, sameField }) => (
        <article key={e.id} className="svs-card" style={{ padding: 'var(--sp-3, 12px)' }}>
          <h4 className="svs-card__title">{e.title}</h4>
          <p className="svs-card__meta">
            {e.durationMin}–{e.durationMax} min · {e.minPlayers}–{e.maxPlayers} Spieler
            {e.intensity ? ` · ${e.intensity}` : ''} ·{' '}
            {sameField ? 'kein Umbau' : 'Umbau nötig'}
          </p>
          <div style={{ maxWidth: 320 }}>
            <Diagram data={e.diagram?.data} altText={`Vorschau: ${e.title}`} />
          </div>
          {e.objective && <p>{e.objective}</p>}
          <Button block onClick={() => onSelect(e)}>
            „{e.title}“ auswählen
          </Button>
        </article>
      ))}
    </BottomSheet>
  );
}

function PhaseCard({ phase, players, defaultOpen, onOpenInfo, onOpenExchange }) {
  const e = phase.exercise;
  const field =
    e.fieldLength && e.fieldWidth ? `${e.fieldLength} × ${e.fieldWidth} m` : null;
  return (
    <TrainingCard
      phaseLabel={phase.label}
      title={e.title}
      meta={`${phase.duration} min · ${players} Spieler`}
      defaultOpen={defaultOpen}
    >
      <DiagramCard
        type={phase.label}
        data={e.diagram?.data}
        altText={e.diagram?.diagramAltText || `Übungsgrafik: ${e.title}`}
        meta={{
          players: `${e.minPlayers}–${e.maxPlayers} Spieler`,
          field,
          goals: e.goals,
        }}
      />
      <Section title="Trainingsziel" text={e.objective} />
      <Section title="Aufbau" text={e.setup} />
      <Section title="Ablauf" text={e.procedure} />
      <Section title="Regeln" text={e.rules} />
      <Section title="Coachingpunkte" text={e.coachingPoints} />
      <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={onOpenInfo}>
          Infos
        </Button>
        {onOpenExchange && (
          <Button variant="secondary" onClick={onOpenExchange}>
            Übung austauschen
          </Button>
        )}
      </p>
    </TrainingCard>
  );
}

export default function TrainingPlan({
  plan,
  inputs,
  db,
  onVariant,
  onExchange,
  canUndo = false,
  onUndo,
  showSources = true,
}) {
  const [exchangeFor, setExchangeFor] = useState(null);
  const [infoFor, setInfoFor] = useState(null);
  if (!plan) return null;

  if (!plan.ok) {
    return (
      <div className="svs-note svs-note--error" role="alert">
        <p>
          <strong>{plan.reason}:</strong>{' '}
          {plan.missingPhases.join(', ') || '–'}
        </p>
        {plan.details.length > 0 && (
          <p className="svs-plan__error-details">{plan.details.slice(0, 6).join(' · ')}</p>
        )}
        <p>Tipp: Spielerzahl, Jugend oder Dauer anpassen.</p>
      </div>
    );
  }

  // Quellenanzeige zentral steuern (Settings → showSources)
  const displayPhases = plan.phases.map((p) =>
    showSources ? p : { ...p, exercise: { ...p.exercise, sourceTitle: '' } }
  );

  return (
    <section className="svs-plan" aria-label="Erstelltes Training">
      <div className="svs-note svs-note--info">
        Gesamtdauer {plan.totalDuration} min · {inputs.players} Spieler ·{' '}
        {inputs.focus} · Material: {plan.equipment.join(', ')}
      </div>
      <RebuildStatus rebuilds={plan.rebuilds} changes={plan.rebuildChanges} />

      <p className="no-print" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button onClick={() => printTraining(inputs)}>PDF erstellen</Button>
        <Button variant="secondary" onClick={() => printTraining(inputs)}>
          Drucken
        </Button>
        {canShare() && (
          <Button variant="secondary" onClick={() => shareTraining(plan, inputs)}>
            Teilen
          </Button>
        )}
      </p>

      {canUndo && (
        <p className="svs-note svs-note--info">
          Übung ausgetauscht.{' '}
          <Button variant="ghost" onClick={onUndo}>
            Rückgängig
          </Button>
        </p>
      )}

      {displayPhases.map((p, i) => (
        <PhaseCard
          key={p.phase}
          phase={p}
          players={inputs.players}
          defaultOpen={i === 0}
          onOpenInfo={() => setInfoFor(i)}
          onOpenExchange={onExchange ? () => setExchangeFor(i) : undefined}
        />
      ))}

      <InfoSheet
        open={infoFor !== null}
        phase={infoFor !== null ? displayPhases[infoFor] : null}
        players={inputs.players}
        onClose={() => setInfoFor(null)}
      />

      {onExchange && (
        <ExchangeSheet
          open={exchangeFor !== null}
          phase={exchangeFor !== null ? plan.phases[exchangeFor] : null}
          alternatives={
            exchangeFor !== null ? findAlternatives(db, plan, exchangeFor, inputs) : []
          }
          onSelect={(exercise) => {
            onExchange(exchangeFor, exercise);
            setExchangeFor(null);
          }}
          onClose={() => setExchangeFor(null)}
        />
      )}

      {plan.variantsAvailable > 1 && (
        <Button variant="secondary" block onClick={onVariant}>
          Alternative Einheit ({plan.variant + 1}/{plan.variantsAvailable})
        </Button>
      )}
    </section>
  );
}
