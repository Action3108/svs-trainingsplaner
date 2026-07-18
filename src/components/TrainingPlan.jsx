import { Fragment, useState } from 'react';
import TrainingCard from './ui/TrainingCard.jsx';
import DiagramCard from './diagram/DiagramCard.jsx';
import Diagram from './diagram/Diagram.jsx';
import BottomSheet from './ui/BottomSheet.jsx';
import Button from './ui/Button.jsx';
import InfoGrid from './ui/InfoGrid.jsx';
import EquipmentList from './ui/EquipmentList.jsx';
import { findAlternatives } from '../logic/exchange.js';
import { printTraining, canShare, shareTraining } from '../logic/share.js';

/**
 * Ergebnisbereich nach dem Prinzip der progressiven Offenlegung:
 * 1. kompakte Zusammenfassung (Dauer, Spieler, Material, Umbauampel,
 *    Einheit im Überblick) mit genau einer Hauptaktion (PDF/Druck),
 * 2. aufklappbare Trainingskarten mit Diagramm und Informationskarten,
 * 3. weitere Details je Übung im „Infos“-Bottom-Sheet.
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

/**
 * Umbauampel (kompakt, 2026-07-18): Oben erscheint nur noch die grüne
 * Erfolgsmeldung. Umbauten und kleine Anpassungen stehen als kurze
 * Hinweise direkt zwischen den betroffenen Übungen (RebuildHint).
 */
export function RebuildStatus({ rebuilds, adjustments = 0 }) {
  if (rebuilds > 0) return null;
  return (
    <p className="svs-note svs-note--success">
      Kein Umbau nötig – die ganze Einheit läuft auf einem Grundfeld.
      {adjustments > 0 ? ' Kleine Feld-Anpassungen stehen zwischen den Übungen.' : ''}
    </p>
  );
}

/**
 * Kurzer Umbau-Hinweis zwischen zwei Übungen,
 * z. B. „Umbau: Quadrat 20×20 m → Halbes Spielfeld 45×35 m".
 */
export function RebuildHint({ change, minor = false }) {
  if (!change) return null;
  return (
    <p className={`svs-rebuild-hint${minor ? ' svs-rebuild-hint--minor' : ''}`}>
      <span aria-hidden="true">🔁</span>
      <span>
        {minor ? 'Kleine Anpassung' : 'Umbau'}: {change.from} → {change.to}
      </span>
    </p>
  );
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
    <BottomSheet open={open} title={`Infos – ${e.id} · ${e.title}`} onClose={onClose}>
      <Section title="Mannschaftseinteilung" text={organizationText(org, players)} />
      {org.oddPlayerHint && (
        <Section title="Ungerade Spielerzahl" text={org.oddPlayerHint} />
      )}
      <Section title="Kommandos" text={e.coachingCommands} />
      <Section title="Häufige Fehler" text={e.commonMistakes} />
      <Section title="Korrekturen" text={e.corrections} />
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
      {alternatives.map(({ exercise: e, sameField, sameClass }) => (
        <article key={e.id} className="svs-card" style={{ padding: 'var(--sp-3, 12px)' }}>
          <h4 className="svs-card__title">
            <span className="svs-card__id">{e.id} · </span>
            {e.title}
          </h4>
          <p className="svs-card__meta">
            {e.durationMin}–{e.durationMax} min · {e.minPlayers}–{e.maxPlayers} Spieler
            {e.intensity ? ` · ${e.intensity}` : ''} ·{' '}
            {sameField ? 'kein Umbau' : sameClass ? 'kleine Anpassung' : 'Umbau nötig'}
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
      exerciseId={e.id}
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
      <InfoGrid exercise={e} />
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
        <span>
          Gesamtdauer {plan.totalDuration} min · {inputs.players} Spieler ·{' '}
          {inputs.focus}
          {plan.structureLabel && (
            <>
              <br />
              {plan.structureLabel}
            </>
          )}
          <EquipmentList items={plan.equipment} merge />
        </span>
      </div>
      <RebuildStatus rebuilds={plan.rebuilds} adjustments={plan.adjustments} />

      {/* Kompakte Übersicht zuerst (progressive Offenlegung): der Trainer sieht
          die ganze Einheit auf einen Blick, Details stehen in den Karten. */}
      <ol className="svs-overview" aria-label="Einheit im Überblick">
        {plan.phases.map((p) => (
          <li key={p.phase}>
            <span className="svs-overview__time">{p.duration} min</span>
            <span className="svs-overview__text">
              {p.label}: <span className="svs-card__id">{p.exercise.id}</span> {p.exercise.title}
            </span>
          </li>
        ))}
      </ol>

      <p className="no-print" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button onClick={() => printTraining(inputs)}>PDF speichern / drucken</Button>
        {canShare() && (
          <Button variant="ghost" onClick={() => shareTraining(plan, inputs)}>
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

      {displayPhases.map((p, i) => {
        // Umbau-Hinweis genau dort, wo der Wechsel stattfindet
        const rebuild = (plan.rebuildChanges ?? []).find((c) => c.beforePhase === p.phase);
        const adjust = (plan.adjustmentChanges ?? []).find((c) => c.beforePhase === p.phase);
        return (
          <Fragment key={p.phase}>
            {i > 0 && (rebuild ? <RebuildHint change={rebuild} /> : <RebuildHint change={adjust} minor />)}
            <PhaseCard
              phase={p}
              players={inputs.players}
              defaultOpen={i === 0}
              onOpenInfo={() => setInfoFor(i)}
              onOpenExchange={onExchange ? () => setExchangeFor(i) : undefined}
            />
          </Fragment>
        );
      })}

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
