/**
 * PDF, Druck und Teilen (Anleitung §16).
 * Das PDF entsteht vollständig im Browser über die Druckfunktion:
 * Die Druckansicht (PrintView) enthält die komplette Einheit in DIN A4,
 * der Dokumenttitel dient als Dateiname beim „Als PDF speichern“.
 */

import { ageGroupLabel } from './sheetSchema.js';

export function buildFileName(inputs, date = new Date()) {
  const clean = (s) =>
    String(s ?? '')
      .replace(/[^\wäöüÄÖÜß-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  const iso = date.toISOString().slice(0, 10);
  return `SVS_Training_${clean(ageGroupLabel(inputs.ageGroup))}_${clean(inputs.focus)}_${iso}`;
}

/** Öffnet den Druckdialog; der Dateiname kommt aus dem Dokumenttitel. */
export function printTraining(inputs) {
  const previousTitle = document.title;
  document.title = buildFileName(inputs);
  const restore = () => {
    document.title = previousTitle;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
}

/** Natives Teilen verfügbar? (moderne Mobilgeräte) */
export function canShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/** Teilt eine Kurzfassung der Einheit über das System-Teilen-Menü. */
export async function shareTraining(plan, inputs) {
  const text =
    `${ageGroupLabel(inputs.ageGroup)} · ${inputs.focus} · ${inputs.players} Spieler · ${plan.totalDuration} min\n` +
    plan.phases
      .map((p) => `${p.label}: ${p.exercise.title} (${p.duration} min)`)
      .join('\n');
  try {
    await navigator.share({ title: buildFileName(inputs), text });
    return true;
  } catch {
    return false; // Abbruch durch Nutzer oder nicht unterstützt
  }
}
