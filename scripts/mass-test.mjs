#!/usr/bin/env node
/**
 * 100-Einheiten-Großtest (Backlog §11): erzeugt reproduzierbar 100
 * unterschiedliche Trainingseinheiten und prüft jede Einheit fachlich
 * (harte Regeln) sowie heuristisch aus vier Perspektiven.
 *
 * Aufruf: node scripts/mass-test.mjs <pfad/zu/Exercises.csv+Diagrams.csv-Ordner> [reportpfad]
 * Seed: 42 (fest, reproduzierbar).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv } from '../src/logic/csv.js';
import { validateExerciseRow, validateDiagramRow, ALLOWED_FOCUS_AREAS, AGE_GROUPS } from '../src/logic/sheetSchema.js';
import {
  generateTraining,
  allowedStructures,
  detectBaseFormat,
  hardExclusion,
} from '../src/logic/generator.js';

const SEED = 42;
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toObjects(text) {
  const rows = parseCsv(text.replace(/^﻿/, ''));
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => (r[0] ?? '').trim()).map((r) => {
    const o = {};
    header.forEach((k, i) => (o[k] = (r[i] ?? '').trim()));
    return o;
  });
}

const dir = process.argv[2];
const out = process.argv[3] ?? join(dir, 'Grosstest-Protokoll.md');
const exRows = toObjects(readFileSync(join(dir, 'Exercises.csv'), 'utf-8'));
const diaRows = toObjects(readFileSync(join(dir, 'Diagrams.csv'), 'utf-8'));

const diagrams = new Map();
diaRows.forEach((r) => {
  const { valid, diagram } = validateDiagramRow(r);
  if (valid) diagrams.set(diagram.diagramId, diagram);
});
const exercises = [];
exRows.forEach((r) => {
  const { valid, exercise } = validateExerciseRow(r);
  if (valid && diagrams.has(exercise.diagramId)) {
    exercises.push({ ...exercise, diagram: diagrams.get(exercise.diagramId) });
  }
});
const db = { exercises, settings: { maxSetupChanges: '1' }, lists: {}, errors: [] };

// ---- 100 eindeutige Testkonfigurationen (Seed 42) -------------------------
const durations = [60, 75, 90];
const playerCounts = [4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24, 30];
const rand = mulberry32(SEED);
const configs = [];
const seen = new Set();
// Pflichtfälle laut Backlog zuerst
[
  { ageGroup: 'G', duration: 60, players: 12, focus: 'Dribbling' },
  { ageGroup: 'F', duration: 60, players: 16, focus: 'Passspiel' },
  { ageGroup: 'E', duration: 60, players: 10, focus: '1 gegen 1' },
  { ageGroup: 'D', duration: 60, players: 14, focus: 'Umschalten' },
  { ageGroup: 'G', duration: 75, players: 8, focus: 'Dribbling' },
  { ageGroup: 'F', duration: 90, players: 12, focus: 'Freilaufen und Anbieten' },
  { ageGroup: 'E', duration: 90, players: 12, focus: 'Dribbling' },
  { ageGroup: 'D', duration: 90, players: 16, focus: 'Passspiel' },
].forEach((c) => {
  configs.push(c);
  seen.add(JSON.stringify(c));
});
while (configs.length < 100) {
  const c = {
    ageGroup: AGE_GROUPS[Math.floor(rand() * AGE_GROUPS.length)],
    duration: durations[Math.floor(rand() * durations.length)],
    players: playerCounts[Math.floor(rand() * playerCounts.length)],
    focus: ALLOWED_FOCUS_AREAS[Math.floor(rand() * ALLOWED_FOCUS_AREAS.length)],
  };
  const key = JSON.stringify(c);
  if (!seen.has(key)) {
    seen.add(key);
    configs.push(c);
  }
}

// ---- Prüfung je Einheit ----------------------------------------------------
const findings = [];
const results = [];
const planSignatures = new Set();

function note(caseId, cfg, perspective, severity, observation, expected, suggestion, exIds = []) {
  findings.push({ caseId, cfg, perspective, severity, observation, expected, suggestion, exIds });
}

configs.forEach((cfg, i) => {
  const caseId = `T-${String(i + 1).padStart(3, '0')}`;
  const plan = generateTraining(db, cfg);
  const r = { caseId, cfg, ok: plan.ok, structure: plan.structure ?? '-', scores: {} };
  results.push(r);

  if (!plan.ok) {
    r.failReason = plan.reason;
    // Kein Fehler per se: klare Meldung ist gefordertes Verhalten.
    // Auffälligkeit nur, wenn die Eingaben plausibel abgedeckt sein müssten.
    const anyFit = exercises.some((e) => !hardExclusion(e, cfg));
    note(caseId, cfg, 'DFB', anyFit ? 'mittel' : 'niedrig',
      `Keine Einheit generierbar (${plan.reason})`,
      'Für gängige Eingaben sollte eine Einheit entstehen',
      'Übungspool für diese Kombination erweitern', []);
    r.scores = { T17: 3, T50: 3, UX: 4, DFB: anyFit ? 2 : 3 };
    return;
  }

  const ids = plan.phases.map((p) => p.exercise.id);
  const sig = ids.join('|');
  r.duplicatePlan = planSignatures.has(sig);
  planSignatures.add(sig);

  // Harte Prüfungen
  const total = plan.phases.reduce((a, p) => a + p.duration, 0);
  if (total !== cfg.duration)
    note(caseId, cfg, 'DFB', 'kritisch', `Gesamtdauer ${total} ≠ ${cfg.duration}`, 'exakte Gesamtdauer', 'Zeitverteilung korrigieren', ids);
  if (new Set(ids).size !== ids.length)
    note(caseId, cfg, 'DFB', 'kritisch', 'Übung doppelt in der Einheit', 'keine Duplikate', 'Generator-Duplikatschutz prüfen', ids);
  const structOk = allowedStructures(cfg).some((s) => s.id === plan.structure);
  if (!structOk)
    note(caseId, cfg, 'DFB', 'kritisch', `Unzulässige Struktur ${plan.structure}`, 'nur erlaubte Strukturen', 'Strukturwahl prüfen', ids);
  plan.phases.forEach((p) => {
    const e = p.exercise;
    if (!e.ageGroups.includes(cfg.ageGroup))
      note(caseId, cfg, 'DFB', 'kritisch', `${e.id} passt nicht zur Altersklasse ${cfg.ageGroup}`, 'Altersfreigabe einhalten', 'Ausschlussregel prüfen', [e.id]);
    if (p.duration < e.durationMin || p.duration > e.durationMax)
      note(caseId, cfg, 'DFB', 'hoch', `${e.id}: ${p.duration} min außerhalb ${e.durationMin}–${e.durationMax}`, 'Zeitfenster einhalten', 'allocateTime prüfen', [e.id]);
    if (!e.diagram)
      note(caseId, cfg, 'UX', 'hoch', `${e.id} ohne Diagramm`, 'jede Übung mit Grafik', 'Diagramm ergänzen', [e.id]);
    const rot = p.organization?.mode === 'rotation';
    if (rot && p.organization.rotation.teams > 4)
      note(caseId, cfg, 'DFB', 'kritisch', 'mehr als vier Teams', 'max. vier Teams', 'rotationPlan prüfen', [e.id]);
  });
  if ((cfg.players === 12 || cfg.players === 16)) {
    plan.phases.forEach((p) => {
      const base = detectBaseFormat(p.exercise);
      if ((base === 3 || base === 4) && p.organization.mode !== 'rotation' && p.organization.fields === 1) {
        note(caseId, cfg, 'DFB', 'hoch', `${p.exercise.id}: 12/16 Spieler ohne Teamrotation organisiert (${p.organization.teamsPerField})`, 'Rotationsvariante nutzen', 'organize() prüfen', [p.exercise.id]);
      }
    });
  }

  // Heuristische Perspektivbewertung (1–5)
  const rebuilds = plan.rebuilds;
  const equipCount = plan.equipment.length;
  const phasesWithFocus = plan.phases.filter((p) => p.exercise.focusAreas.includes(cfg.focus)).length;
  const focusShare = phasesWithFocus / plan.phases.length;
  const gkHeavy = plan.phases.filter((p) => (p.exercise.goalkeepersRequired ?? 0) > 0).length;
  const smallForms = plan.phases.filter((p) => {
    const base = detectBaseFormat(p.exercise);
    return base !== null && base <= 4;
  }).length;

  const clamp = (v) => Math.max(1, Math.min(5, Math.round(v * 10) / 10));
  r.scores.T17 = clamp(5 - rebuilds * 0.7 - (equipCount > 6 ? 0.5 : 0));
  r.scores.T50 = clamp(5 - rebuilds * 0.5 - (plan.phases.length === 6 && cfg.duration === 60 ? 0.5 : 0));
  r.scores.UX = clamp(5 - (plan.structureLabel ? 0 : 0.5) - rebuilds * 0.3);
  r.scores.DFB = clamp(3.2 + focusShare * 1.6 + (smallForms >= 2 ? 0.4 : 0) - rebuilds * 0.4 - (gkHeavy > 3 ? 0.3 : 0));

  if (focusShare < 0.5)
    note(caseId, cfg, 'DFB', 'mittel', `Nur ${phasesWithFocus}/${plan.phases.length} Phasen decken den Schwerpunkt „${cfg.focus}“ ab`, 'roter Faden zum Schwerpunkt', 'Schwerpunktgewichtung erhöhen oder Pool erweitern', ids);
  if (rebuilds > 1)
    note(caseId, cfg, 'T17', 'mittel', `${rebuilds} Umbauten`, 'höchstens ein wesentlicher Umbau', 'Feldkompatibilität im Pool verbessern', ids);
});

// ---- Report ----------------------------------------------------------------
const okCount = results.filter((r) => r.ok).length;
const dupPlans = results.filter((r) => r.duplicatePlan).length;
const avg = (k) => (results.filter((r) => r.ok).reduce((a, r) => a + (r.scores[k] ?? 0), 0) / okCount).toFixed(2);
const bySeverity = (s) => findings.filter((f) => f.severity === s).length;

let md = `# 100-Einheiten-Großtest – SV Schöning Trainingsplaner\n\n`;
md += `Seed: ${SEED} · Datenbestand: ${exercises.length} veröffentlichte Übungen · ${new Date().toISOString().slice(0, 10)}\n\n`;
md += `## Gesamtergebnis\n\n| Kennzahl | Wert |\n| --- | ---: |\n`;
md += `| Testfälle | ${results.length} |\n| erfolgreich generiert | ${okCount} |\n| ohne zulässige Kombination (klare Meldung) | ${results.length - okCount} |\n`;
md += `| identische Einheiten (Doppelzählung) | ${dupPlans} |\n`;
md += `| Auffälligkeiten kritisch/hoch/mittel/niedrig | ${bySeverity('kritisch')}/${bySeverity('hoch')}/${bySeverity('mittel')}/${bySeverity('niedrig')} |\n\n`;
md += `## Gesamtbewertung je Prüfperspektive (Ø 1–5)\n\n`;
md += `| Perspektive | Ø |\n| --- | ---: |\n`;
md += `| Trainer, 17 Jahre (Bedienbarkeit/Umsetzbarkeit) | ${avg('T17')} |\n`;
md += `| Trainer, 50 Jahre (Orientierung/Lesbarkeit) | ${avg('T50')} |\n`;
md += `| Senior UI/UX (Struktur/Konsistenz) | ${avg('UX')} |\n`;
md += `| DFB-Stützpunkttrainer (Fachlichkeit) | ${avg('DFB')} |\n\n`;

md += `## Verteilung der Testfälle\n\n`;
const dist = {};
results.forEach((r) => {
  const k = `${r.cfg.ageGroup} · ${r.cfg.duration} min`;
  dist[k] = (dist[k] ?? 0) + 1;
});
md += `| Altersklasse · Dauer | Fälle |\n| --- | ---: |\n`;
Object.keys(dist).sort().forEach((k) => (md += `| ${k} | ${dist[k]} |\n`));

md += `\n## Auffälligkeiten (${findings.length})\n\n`;
if (findings.length === 0) md += `Keine.\n`;
else {
  md += `| Testfall | Eingaben | Perspektive | Schweregrad | Beobachtung | Erwartet | Vorschlag | Übungen |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n`;
  findings.forEach((f) => {
    md += `| ${f.caseId} | ${f.cfg.ageGroup}/${f.cfg.duration}min/${f.cfg.players}Sp/${f.cfg.focus} | ${f.perspective} | ${f.severity} | ${f.observation} | ${f.expected} | ${f.suggestion} | ${f.exIds.join(', ')} |\n`;
  });
}

md += `\n## Alle Testfälle\n\n| Fall | Eingaben | Ergebnis | Struktur | T17 | T50 | UX | DFB |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n`;
results.forEach((r) => {
  md += `| ${r.caseId} | ${r.cfg.ageGroup}/${r.cfg.duration}min/${r.cfg.players}Sp/${r.cfg.focus} | ${r.ok ? 'OK' : `FEHLER: ${r.failReason}`} | ${r.structure} | ${r.scores.T17 ?? '-'} | ${r.scores.T50 ?? '-'} | ${r.scores.UX ?? '-'} | ${r.scores.DFB ?? '-'} |\n`;
});

writeFileSync(out, md);
console.log(`Testfälle: ${results.length} · OK: ${okCount} · Auffälligkeiten: ${findings.length} (kritisch: ${bySeverity('kritisch')})`);
console.log(`Report: ${out}`);
process.exit(bySeverity('kritisch') === 0 ? 0 : 1);
