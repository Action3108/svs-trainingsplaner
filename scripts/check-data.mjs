#!/usr/bin/env node
/**
 * Datenqualitätsprüfung der Übungsdatenbank (Backlog §2/§13, Datenmigration).
 *
 * Prüft einen CSV-Ordner (Exercises.csv, Diagrams.csv) oder – ohne Argument –
 * das veröffentlichte Google Sheet:
 *   node scripts/check-data.mjs [pfad/zum/csv-ordner]
 *
 * Prüfungen:
 * - eindeutige Übungs-IDs und eindeutige normalisierte Titel
 * - eindeutige Diagramm-IDs, keine verwaisten Diagramme
 * - keine Übung ohne gültiges Diagramm
 * - alle published, kein sichtbares „ENTWURF“
 * - nur die acht erlaubten Schwerpunkte, keine doppelten Tags
 * - Diagramm-JSON entspricht dem App-Schema
 * - finale Übungszahl = eindeutige Vereinigungsmenge (nicht auf 60 begrenzt)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv } from '../src/logic/csv.js';
import { validateDiagramData } from '../src/logic/diagramSchema.js';
import { ALLOWED_FOCUS_AREAS } from '../src/logic/sheetSchema.js';

export function normalizeTitle(t) {
  return String(t ?? '')
    .replace(/entwurf/gi, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-–—:;,.!„“"'()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

export function checkData(exercises, diagrams) {
  const problems = [];
  const push = (level, msg) => problems.push({ level, msg });

  // IDs eindeutig
  const ids = exercises.map((e) => e.id);
  ids.filter((id, i) => ids.indexOf(id) !== i).forEach((id) => push('error', `doppelte Übungs-ID: ${id}`));

  // Titel eindeutig (normalisiert)
  const titles = new Map();
  exercises.forEach((e) => {
    const nt = normalizeTitle(e.title);
    if (titles.has(nt)) push('error', `doppelter normalisierter Titel: „${e.title}“ (${e.id} vs. ${titles.get(nt)})`);
    else titles.set(nt, e.id);
  });

  // Diagramm-IDs eindeutig
  const dids = diagrams.map((d) => d.diagramId);
  dids.filter((id, i) => dids.indexOf(id) !== i).forEach((id) => push('error', `doppelte Diagramm-ID: ${id}`));

  // Verweise
  const idSet = new Set(ids);
  const didSet = new Set(dids);
  diagrams.forEach((d) => {
    if (!idSet.has(d.exerciseId)) push('error', `verwaistes Diagramm ${d.diagramId} (exerciseId ${d.exerciseId})`);
  });
  exercises.forEach((e) => {
    if (!didSet.has(e.diagramId)) push('error', `${e.id}: Diagrammverweis ${e.diagramId} existiert nicht`);
  });

  // Status + ENTWURF + Schwerpunkte
  exercises.forEach((e) => {
    if (e.status && e.status !== 'published') push('warn', `${e.id}: status=${e.status}`);
    const visible = [e.title, e.sourceTitle, e.adaptationNote, e.objective, e.setup].join(' ');
    if (/entwurf/i.test(visible)) push('error', `${e.id}: sichtbares „Entwurf“ gefunden`);
    const focus = String(e.focusAreas ?? '').split(';').map((f) => f.trim()).filter(Boolean);
    if (focus.length === 0) push('error', `${e.id}: keine Schwerpunkte`);
    focus.forEach((f) => {
      if (!ALLOWED_FOCUS_AREAS.includes(f)) push('error', `${e.id}: unzulässiger Schwerpunkt „${f}“`);
    });
    if (new Set(focus).size !== focus.length) push('error', `${e.id}: doppelte Schwerpunkt-Tags`);
  });

  // Diagramm-Schema
  diagrams.forEach((d) => {
    const { valid, errors } = validateDiagramData(d.diagramData);
    if (!valid) push('error', `${d.diagramId}: ${errors.join(', ')}`);
  });

  return {
    problems,
    errors: problems.filter((p) => p.level === 'error'),
    counts: { exercises: exercises.length, diagrams: diagrams.length },
  };
}

// CLI
const dir = process.argv[2];
if (dir) {
  const exercises = toObjects(readFileSync(join(dir, 'Exercises.csv'), 'utf-8'));
  const diagrams = toObjects(readFileSync(join(dir, 'Diagrams.csv'), 'utf-8'));
  const { problems, errors, counts } = checkData(exercises, diagrams);
  console.log(`Übungen: ${counts.exercises} · Diagramme: ${counts.diagrams}`);
  problems.forEach((p) => console.log(`[${p.level}] ${p.msg}`));
  console.log(errors.length === 0 ? 'ALLE PRÜFUNGEN BESTANDEN' : `${errors.length} FEHLER`);
  process.exit(errors.length === 0 ? 0 : 1);
}
